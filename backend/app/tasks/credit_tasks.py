"""Monthly credit reset — runs every hour, resets users whose 30-day cycle is up."""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.models import User
import logging

logger = logging.getLogger(__name__)


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task
def reset_monthly_credits():
    return run_async(_reset())


async def _reset():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.credits_reset_at <= cutoff)
        )
        users = result.scalars().all()

        count = 0
        for user in users:
            old_used = user.credits_used
            user.credits_used = 0
            user.credits_reset_at = now
            count += 1

            # Notify user their credits reset
            if old_used > 0:
                from app.tasks.email_tasks import send_credits_reset_email
                send_credits_reset_email.delay(
                    user.email,
                    user.full_name or "",
                    user.monthly_credit_limit,
                )

        await db.commit()
        logger.info("Reset credits for %s users", count)
        return {"reset_count": count}
