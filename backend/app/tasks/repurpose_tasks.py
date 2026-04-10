"""
Async Celery tasks for content repurposing.
These run in background workers so the API returns immediately
and the frontend polls for job status.
"""
import asyncio
import time
from datetime import datetime, timezone
from celery import shared_task
from sqlalchemy import select

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.models import RepurposeJob, RepurposeOutput, JobStatus, Platform
from app.services.repurpose_service import repurpose_content, calculate_seo_score


def run_async(coro):
    """Run async code in Celery sync context."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_repurpose_job(self, job_id: int):
    """Main task: take a job and generate all platform outputs."""
    return run_async(_process_repurpose_job(self, job_id))


async def _process_repurpose_job(task, job_id: int):
    start_time = time.time()

    async with AsyncSessionLocal() as db:
        # Fetch job
        result = await db.execute(
            select(RepurposeJob).where(RepurposeJob.id == job_id)
        )
        job = result.scalar_one_or_none()

        if not job:
            return {"error": f"Job {job_id} not found"}

        # Mark as processing
        job.status = JobStatus.PROCESSING
        job.celery_task_id = task.request.id
        await db.commit()

        try:
            platforms = [Platform(p) for p in job.platforms]

            outputs = await repurpose_content(
                original_content=job.original_content or job.transcription or "",
                platforms=platforms,
                tone=job.tone,
                target_audience=job.target_audience,
                keywords=job.keywords or [],
                title=job.title,
            )

            # Save each output
            for platform_key, content in outputs.items():
                words = content.split()
                seo = calculate_seo_score(content, job.keywords)

                output = RepurposeOutput(
                    job_id=job.id,
                    platform=Platform(platform_key),
                    content=content,
                    char_count=len(content),
                    word_count=len(words),
                    seo_score=seo,
                    extra_metadata={"tone": job.tone},
                )
                db.add(output)

            # Mark complete
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            job.processing_time_seconds = time.time() - start_time
            await db.commit()

            return {"status": "completed", "job_id": job_id, "outputs": len(outputs)}

        except Exception as exc:
            job.status = JobStatus.FAILED
            job.error_message = str(exc)
            await db.commit()

            # Retry on transient errors
            try:
                raise task.retry(exc=exc)
            except task.MaxRetriesExceededError:
                return {"status": "failed", "job_id": job_id, "error": str(exc)}
