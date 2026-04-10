"""Transcription tasks using AssemblyAI."""
import asyncio
import assemblyai as aai
from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.models import RepurposeJob, JobStatus
from sqlalchemy import select
from app.tasks.repurpose_tasks import process_repurpose_job


aai.settings.api_key = settings.ASSEMBLYAI_API_KEY


def run_async(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=2)
def transcribe_and_repurpose(self, job_id: int, file_path: str):
    """Transcribe audio/video then kick off repurposing."""
    return run_async(_transcribe_and_repurpose(self, job_id, file_path))


async def _transcribe_and_repurpose(task, job_id: int, file_path: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(RepurposeJob).where(RepurposeJob.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        job.status = JobStatus.TRANSCRIBING
        await db.commit()

        try:
            # AssemblyAI transcription
            config = aai.TranscriptionConfig(
                speaker_labels=True,
                auto_chapters=True,
            )
            transcriber = aai.Transcriber(config=config)
            transcript = transcriber.transcribe(file_path)

            if transcript.status == aai.TranscriptStatus.error:
                raise Exception(f"Transcription error: {transcript.error}")

            job.transcription = transcript.text
            job.original_content = transcript.text
            await db.commit()

        except Exception as exc:
            job.status = JobStatus.FAILED
            job.error_message = f"Transcription failed: {str(exc)}"
            await db.commit()
            return

    # Kick off repurposing task
    process_repurpose_job.delay(job_id)
    return {"status": "transcription_complete", "job_id": job_id}
