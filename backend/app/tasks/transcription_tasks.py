"""Transcription tasks using AssemblyAI."""
import asyncio
import os
import assemblyai as aai
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.models import RepurposeJob, JobStatus, User
from sqlalchemy import select
from app.tasks.repurpose_tasks import process_repurpose_job
import logging

logger = logging.getLogger(__name__)
aai.settings.api_key = settings.ASSEMBLYAI_API_KEY


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=2, queue="transcription")
def transcribe_and_repurpose(self, job_id: int, file_path: str):
    return run_async(_transcribe(self, job_id, file_path))


async def _transcribe(task, job_id: int, file_path: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(RepurposeJob).where(RepurposeJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        user_result = await db.execute(select(User).where(User.id == job.user_id))
        user = user_result.scalar_one_or_none()

        job.status = JobStatus.TRANSCRIBING
        await db.commit()

        try:
            if not settings.ASSEMBLYAI_API_KEY or settings.ASSEMBLYAI_API_KEY == "your-assemblyai-key-here":
                raise ValueError(
                    "AssemblyAI API key not configured. "
                    "Add ASSEMBLYAI_API_KEY to your .env file."
                )

            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Upload file not found: {file_path}")

            config = aai.TranscriptionConfig(
                speaker_labels=True,
                auto_chapters=True,
                punctuate=True,
                format_text=True,
            )
            transcriber = aai.Transcriber(config=config)
            transcript = transcriber.transcribe(file_path)

            if transcript.status == aai.TranscriptStatus.error:
                raise Exception(f"AssemblyAI error: {transcript.error}")

            if not transcript.text or len(transcript.text.strip()) < 50:
                raise ValueError("Transcription produced no usable text. Check the audio quality.")

            job.transcription = transcript.text
            job.original_content = transcript.text
            await db.commit()
            logger.info("Job %s transcribed — %d chars", job_id, len(transcript.text))

        except Exception as exc:
            logger.error("Transcription failed for job %s: %s", job_id, exc)
            job.status = JobStatus.FAILED
            job.error_message = f"Transcription failed: {str(exc)}"

            # Refund credit
            if user and user.credits_used > 0:
                user.credits_used -= 1

            await db.commit()

            # Send failure email
            if user:
                from app.tasks.email_tasks import send_job_failed_email
                send_job_failed_email.delay(
                    user.email, user.full_name or "", job.id,
                    job.title or f"Job #{job.id}"
                )
            return {"status": "failed", "job_id": job_id, "error": str(exc)}

    # Kick off repurposing now that we have text
    process_repurpose_job.delay(job_id)
    return {"status": "transcription_complete", "job_id": job_id}
