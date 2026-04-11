"""
Async Celery tasks for content repurposing.
API returns 202 immediately; frontend polls for status.
"""
import asyncio
import time
from datetime import datetime, timezone
from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.models import RepurposeJob, RepurposeOutput, JobStatus, Platform, User
from app.services.repurpose_service import repurpose_content, calculate_seo_score
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue="repurpose")
def process_repurpose_job(self, job_id: int):
    return run_async(_process(self, job_id))


async def _process(task, job_id: int):
    start = time.time()
    async with AsyncSessionLocal() as db:
        # Load job + user
        result = await db.execute(
            select(RepurposeJob).where(RepurposeJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            logger.error("Job %s not found", job_id)
            return

        user_result = await db.execute(select(User).where(User.id == job.user_id))
        user = user_result.scalar_one_or_none()

        # Mark processing
        job.status = JobStatus.PROCESSING
        job.celery_task_id = task.request.id
        await db.commit()

        try:
            platforms = [Platform(p) for p in job.platforms]
            content = job.original_content or job.transcription or ""

            if not content.strip():
                raise ValueError("No content to process — original_content and transcription are both empty.")

            outputs = await repurpose_content(
                original_content=content,
                platforms=platforms,
                tone=job.tone,
                target_audience=job.target_audience,
                keywords=job.keywords or [],
                title=job.title,
            )

            for platform_key, text in outputs.items():
                output = RepurposeOutput(
                    job_id=job.id,
                    platform=Platform(platform_key),
                    content=text,
                    char_count=len(text),
                    word_count=len(text.split()),
                    seo_score=calculate_seo_score(text, job.keywords),
                    extra_metadata={"tone": job.tone},
                )
                db.add(output)

            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            job.processing_time_seconds = time.time() - start
            await db.commit()

            # Send completion email
            if user:
                from app.tasks.email_tasks import send_job_complete_email
                send_job_complete_email.delay(
                    user.email, user.full_name or "", job.id,
                    job.title or f"Job #{job.id}", len(outputs)
                )

            # Warn on low credits
            if user and user.credits_remaining == 1:
                from app.tasks.email_tasks import send_low_credits_email
                send_low_credits_email.delay(
                    user.email, user.full_name or "",
                    user.credits_remaining, user.plan.value
                )

            logger.info("Job %s completed — %s outputs in %.1fs", job_id, len(outputs), time.time() - start)
            return {"status": "completed", "job_id": job_id, "outputs": len(outputs)}

        except Exception as exc:
            logger.error("Job %s failed: %s", job_id, exc)
            job.status = JobStatus.FAILED
            job.error_message = str(exc)

            # Refund the credit
            if user and user.credits_used > 0:
                user.credits_used -= 1

            await db.commit()

            # Send failure email
            if user:
                from app.tasks.email_tasks import send_job_failed_email
                send_job_failed_email.delay(
                    user.email, user.full_name or "", job.id, job.title or f"Job #{job.id}"
                )

            try:
                raise task.retry(exc=exc)
            except task.MaxRetriesExceededError:
                return {"status": "failed", "job_id": job_id, "error": str(exc)}
