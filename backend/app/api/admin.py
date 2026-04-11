"""
Admin API — protected by a static admin secret header.
Exposes platform-wide stats, user management, and job oversight.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, RepurposeJob, RepurposeOutput, JobStatus, PlanType
from app.schemas.schemas import UserOut
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != settings.SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")


class PlatformStats(BaseModel):
    total_users: int
    active_users_30d: int
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    total_outputs: int
    free_users: int
    starter_users: int
    pro_users: int
    agency_users: int
    jobs_today: int
    revenue_estimate_usd: float


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    plan: str
    credits_used: int
    credits_remaining: int
    is_active: bool
    created_at: datetime
    total_jobs: int

    class Config:
        from_attributes = True


@router.get("/stats", response_model=PlatformStats)
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    )).scalar() or 0
    total_jobs = (await db.execute(select(func.count(RepurposeJob.id)))).scalar() or 0
    completed = (await db.execute(
        select(func.count(RepurposeJob.id)).where(RepurposeJob.status == JobStatus.COMPLETED)
    )).scalar() or 0
    failed = (await db.execute(
        select(func.count(RepurposeJob.id)).where(RepurposeJob.status == JobStatus.FAILED)
    )).scalar() or 0
    total_outputs = (await db.execute(select(func.count(RepurposeOutput.id)))).scalar() or 0
    jobs_today = (await db.execute(
        select(func.count(RepurposeJob.id)).where(RepurposeJob.created_at >= today_start)
    )).scalar() or 0

    plan_counts = {}
    for plan in PlanType:
        c = (await db.execute(
            select(func.count(User.id)).where(User.plan == plan)
        )).scalar() or 0
        plan_counts[plan.value] = c

    # Rough MRR estimate
    revenue = (
        plan_counts.get("starter", 0) * 19 +
        plan_counts.get("pro", 0) * 49 +
        plan_counts.get("agency", 0) * 149
    )

    return PlatformStats(
        total_users=total_users,
        active_users_30d=active_users,
        total_jobs=total_jobs,
        completed_jobs=completed,
        failed_jobs=failed,
        total_outputs=total_outputs,
        free_users=plan_counts.get("free", 0),
        starter_users=plan_counts.get("starter", 0),
        pro_users=plan_counts.get("pro", 0),
        agency_users=plan_counts.get("agency", 0),
        jobs_today=jobs_today,
        revenue_estimate_usd=float(revenue),
    )


@router.get("/users", response_model=List[UserOut])
async def list_all_users(
    skip: int = 0,
    limit: int = 50,
    plan: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    query = select(User)
    if plan:
        query = query.where(User.plan == plan)
    query = query.order_by(desc(User.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/users/{user_id}/plan")
async def set_user_plan(
    user_id: int,
    plan: str,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.plan = PlanType(plan)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
    await db.commit()
    return {"user_id": user_id, "new_plan": plan}


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


@router.get("/jobs")
async def list_all_jobs(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    query = select(RepurposeJob)
    if status:
        query = query.where(RepurposeJob.status == status)
    query = query.order_by(desc(RepurposeJob.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()
    return [
        {
            "id": j.id, "user_id": j.user_id, "title": j.title,
            "status": j.status.value, "content_type": j.content_type.value,
            "platforms": j.platforms, "created_at": j.created_at.isoformat(),
            "processing_time_seconds": j.processing_time_seconds,
        }
        for j in jobs
    ]
