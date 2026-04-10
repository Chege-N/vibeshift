"""Scheduled credit reset task."""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.models import User


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def reset_monthly_credits():
    """Reset credits for users whose billing cycle has renewed."""
    return run_async(_reset_monthly_credits())


async def _reset_monthly_credits():
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.credits_reset_at <= thirty_days_ago)
        )
        users = result.scalars().all()

        count = 0
        for user in users:
            user.credits_used = 0
            user.credits_reset_at = now
            count += 1

        await db.commit()
        return {"reset_count": count}
