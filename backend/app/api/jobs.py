import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import User, RepurposeJob, RepurposeOutput, ContentType, Platform, JobStatus
from app.schemas.schemas import RepurposeRequest, JobOut, JobListItem, DashboardStats
from app.services.user_service import UserService
from app.tasks.repurpose_tasks import process_repurpose_job
from app.tasks.transcription_tasks import transcribe_and_repurpose

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobOut, status_code=202)
async def create_job(
    payload: RepurposeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a repurposing job from text or URL."""
    # Check credits
    if current_user.credits_remaining <= 0:
        raise HTTPException(
            status_code=402,
            detail=f"No credits remaining. Upgrade your plan or wait for monthly reset.",
        )

    # Validate content
    if payload.content_type == ContentType.TEXT and not payload.original_content:
        raise HTTPException(status_code=400, detail="original_content required for text type")
    if payload.content_type == ContentType.URL and not payload.original_url:
        raise HTTPException(status_code=400, detail="original_url required for URL type")

    # Free plan: max 3 platforms
    if current_user.plan.value == "free" and len(payload.platforms) > 3:
        raise HTTPException(status_code=403, detail="Free plan limited to 3 platforms. Upgrade for all 10.")

    # Create job
    job = RepurposeJob(
        user_id=current_user.id,
        title=payload.title,
        content_type=payload.content_type,
        original_content=payload.original_content,
        original_url=str(payload.original_url) if payload.original_url else None,
        platforms=[p.value for p in payload.platforms],
        tone=payload.tone,
        target_audience=payload.target_audience,
        keywords=payload.keywords or [],
        status=JobStatus.PENDING,
    )
    db.add(job)
    await db.flush()

    # Consume credit
    await UserService.consume_credit(db, current_user)
    await db.commit()
    await db.refresh(job)

    # Dispatch Celery task
    process_repurpose_job.delay(job.id)

    return job


@router.post("/upload", response_model=JobOut, status_code=202)
async def create_job_from_upload(
    file: UploadFile = File(...),
    platforms: str = Form(...),  # comma-separated platform values
    tone: str = Form("professional"),
    title: Optional[str] = Form(None),
    target_audience: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a repurposing job from uploaded audio/video file."""
    if current_user.credits_remaining <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    # File size check
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Save file
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Determine content type
    audio_exts = {".mp3", ".m4a", ".wav", ".ogg", ".flac"}
    video_exts = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    content_type = ContentType.AUDIO if ext.lower() in audio_exts else ContentType.VIDEO

    platforms_list = [Platform(p.strip()) for p in platforms.split(",")]
    keywords_list = [k.strip() for k in keywords.split(",")] if keywords else []

    job = RepurposeJob(
        user_id=current_user.id,
        title=title or file.filename,
        content_type=content_type,
        file_path=file_path,
        platforms=[p.value for p in platforms_list],
        tone=tone,
        target_audience=target_audience,
        keywords=keywords_list,
        status=JobStatus.PENDING,
    )
    db.add(job)
    await db.flush()
    await UserService.consume_credit(db, current_user)
    await db.commit()
    await db.refresh(job)

    # Transcribe then repurpose
    transcribe_and_repurpose.delay(job.id, file_path)

    return job


@router.get("/", response_model=List[JobListItem])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    status: Optional[JobStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(RepurposeJob).where(RepurposeJob.user_id == current_user.id)
    if status:
        query = query.where(RepurposeJob.status == status)
    query = query.order_by(desc(RepurposeJob.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    total_q = await db.execute(
        select(func.count(RepurposeJob.id)).where(RepurposeJob.user_id == current_user.id)
    )
    completed_q = await db.execute(
        select(func.count(RepurposeJob.id)).where(
            RepurposeJob.user_id == current_user.id,
            RepurposeJob.status == JobStatus.COMPLETED,
        )
    )
    outputs_q = await db.execute(
        select(func.count(RepurposeOutput.id))
        .join(RepurposeJob)
        .where(RepurposeJob.user_id == current_user.id)
    )

    return DashboardStats(
        total_jobs=total_q.scalar() or 0,
        completed_jobs=completed_q.scalar() or 0,
        total_outputs=outputs_q.scalar() or 0,
        credits_used=current_user.credits_used,
        credits_remaining=current_user.credits_remaining,
        plan=current_user.plan.value,
        popular_platform="twitter_thread",
    )


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(RepurposeJob).where(
            RepurposeJob.id == job_id,
            RepurposeJob.user_id == current_user.id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
