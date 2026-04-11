import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import (
    User, RepurposeJob, RepurposeOutput,
    ContentType, Platform, JobStatus,
)
from app.schemas.schemas import RepurposeRequest, JobOut, JobListItem, DashboardStats, OutputSchema
from app.services.user_service import UserService
from app.tasks.repurpose_tasks import process_repurpose_job
from app.tasks.transcription_tasks import transcribe_and_repurpose
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ── Helper ───────────────────────────────────────────────────────────────────

async def _get_job_or_404(db: AsyncSession, job_id: int, user_id: int) -> RepurposeJob:
    result = await db.execute(
        select(RepurposeJob).where(
            RepurposeJob.id == job_id,
            RepurposeJob.user_id == user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ── Create from text / URL ───────────────────────────────────────────────────

@router.post("/", response_model=JobOut, status_code=202)
async def create_job(
    payload: RepurposeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a repurposing job from text or URL."""
    if current_user.credits_remaining <= 0:
        raise HTTPException(status_code=402,
            detail="No credits remaining. Upgrade your plan or wait for monthly reset.")

    if payload.content_type == ContentType.TEXT and not payload.original_content:
        raise HTTPException(status_code=400, detail="original_content required for text type")
    if payload.content_type == ContentType.URL and not payload.original_url:
        raise HTTPException(status_code=400, detail="original_url required for URL type")
    if current_user.plan.value == "free" and len(payload.platforms) > 3:
        raise HTTPException(status_code=403,
            detail="Free plan limited to 3 platforms. Upgrade for all 10.")

    # Fetch URL content immediately so we can store it
    fetched_title = payload.title
    original_content = payload.original_content
    if payload.content_type == ContentType.URL:
        from app.services.url_service import fetch_url_content
        try:
            fetched = await fetch_url_content(str(payload.original_url))
            original_content = fetched["content"]
            fetched_title = fetched_title or fetched["title"]
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

    job = RepurposeJob(
        user_id=current_user.id,
        title=fetched_title,
        content_type=payload.content_type,
        original_content=original_content,
        original_url=str(payload.original_url) if payload.original_url else None,
        platforms=[p.value for p in payload.platforms],
        tone=payload.tone,
        target_audience=payload.target_audience,
        keywords=payload.keywords or [],
        status=JobStatus.PENDING,
    )
    db.add(job)
    await db.flush()
    await UserService.consume_credit(db, current_user)
    await db.commit()
    await db.refresh(job)

    process_repurpose_job.delay(job.id)
    logger.info("Job %s created by user %s", job.id, current_user.id)
    return job


# ── Create from file upload ──────────────────────────────────────────────────

@router.post("/upload", response_model=JobOut, status_code=202)
async def create_job_from_upload(
    file: UploadFile = File(...),
    platforms: str = Form(...),
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

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=413,
            detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = os.path.splitext(file.filename or "file")[1].lower()
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    audio_exts = {".mp3", ".m4a", ".wav", ".ogg", ".flac"}
    content_type = ContentType.AUDIO if ext in audio_exts else ContentType.VIDEO
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

    transcribe_and_repurpose.delay(job.id, file_path)
    return job


# ── List jobs ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[JobListItem])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    status: Optional[JobStatus] = None,
    content_type: Optional[ContentType] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(RepurposeJob).where(RepurposeJob.user_id == current_user.id)
    if status:
        query = query.where(RepurposeJob.status == status)
    if content_type:
        query = query.where(RepurposeJob.content_type == content_type)
    query = query.order_by(desc(RepurposeJob.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ── Dashboard stats ──────────────────────────────────────────────────────────

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
    # Most used platform
    platform_q = await db.execute(
        select(RepurposeOutput.platform, func.count(RepurposeOutput.id).label("cnt"))
        .join(RepurposeJob)
        .where(RepurposeJob.user_id == current_user.id)
        .group_by(RepurposeOutput.platform)
        .order_by(desc("cnt"))
        .limit(1)
    )
    top = platform_q.first()

    return DashboardStats(
        total_jobs=total_q.scalar() or 0,
        completed_jobs=completed_q.scalar() or 0,
        total_outputs=outputs_q.scalar() or 0,
        credits_used=current_user.credits_used,
        credits_remaining=current_user.credits_remaining,
        plan=current_user.plan.value,
        popular_platform=top[0].value if top else None,
    )


# ── Get single job ───────────────────────────────────────────────────────────

@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_job_or_404(db, job_id, current_user.id)


# ── Retry a failed job ───────────────────────────────────────────────────────

@router.post("/{job_id}/retry", response_model=JobOut, status_code=202)
async def retry_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retry a failed job. Consumes 1 credit."""
    job = await _get_job_or_404(db, job_id, current_user.id)
    if job.status != JobStatus.FAILED:
        raise HTTPException(status_code=400,
            detail=f"Only failed jobs can be retried. Current status: {job.status.value}")
    if current_user.credits_remaining <= 0:
        raise HTTPException(status_code=402, detail="No credits remaining")

    job.status = JobStatus.PENDING
    job.error_message = None
    job.celery_task_id = None
    await UserService.consume_credit(db, current_user)
    await db.commit()
    await db.refresh(job)

    if job.content_type in (ContentType.AUDIO, ContentType.VIDEO) and job.file_path:
        transcribe_and_repurpose.delay(job.id, job.file_path)
    else:
        process_repurpose_job.delay(job.id)

    return job


# ── Delete a job ─────────────────────────────────────────────────────────────

@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a job and all its outputs."""
    job = await _get_job_or_404(db, job_id, current_user.id)
    if job.status in (JobStatus.PROCESSING, JobStatus.TRANSCRIBING):
        raise HTTPException(status_code=400,
            detail="Cannot delete a job that is currently processing.")
    # Delete file if exists
    if job.file_path and os.path.exists(job.file_path):
        try:
            os.remove(job.file_path)
        except OSError:
            pass
    await db.delete(job)
    await db.commit()


# ── Edit a single output ─────────────────────────────────────────────────────

@router.patch("/{job_id}/outputs/{output_id}", response_model=OutputSchema)
async def edit_output(
    job_id: int,
    output_id: int,
    content: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Edit the content of a specific platform output."""
    await _get_job_or_404(db, job_id, current_user.id)

    result = await db.execute(
        select(RepurposeOutput).where(
            RepurposeOutput.id == output_id,
            RepurposeOutput.job_id == job_id,
        )
    )
    output = result.scalar_one_or_none()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")

    output.content = content
    output.char_count = len(content)
    output.word_count = len(content.split())
    await db.commit()
    await db.refresh(output)
    return output


# ── Regenerate a single output ───────────────────────────────────────────────

@router.post("/{job_id}/outputs/{output_id}/regenerate", response_model=OutputSchema)
async def regenerate_output(
    job_id: int,
    output_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Regenerate a single platform output using Claude (no extra credit cost)."""
    job = await _get_job_or_404(db, job_id, current_user.id)
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job must be completed to regenerate outputs")

    result = await db.execute(
        select(RepurposeOutput).where(
            RepurposeOutput.id == output_id,
            RepurposeOutput.job_id == job_id,
        )
    )
    output = result.scalar_one_or_none()
    if not output:
        raise HTTPException(status_code=404, detail="Output not found")

    from app.services.repurpose_service import repurpose_content, calculate_seo_score
    content_text = job.original_content or job.transcription or ""
    outputs = await repurpose_content(
        original_content=content_text,
        platforms=[output.platform],
        tone=job.tone,
        target_audience=job.target_audience,
        keywords=job.keywords or [],
        title=job.title,
    )
    new_text = outputs.get(output.platform.value, output.content)
    output.content = new_text
    output.char_count = len(new_text)
    output.word_count = len(new_text.split())
    output.seo_score = calculate_seo_score(new_text, job.keywords)
    await db.commit()
    await db.refresh(output)
    return output
