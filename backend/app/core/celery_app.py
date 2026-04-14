from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "repurposeai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.repurpose_tasks",
        "app.tasks.transcription_tasks",
        "app.tasks.email_tasks",
        "app.tasks.credit_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.tasks.repurpose_tasks.*": {"queue": "repurpose"},
        "app.tasks.transcription_tasks.*": {"queue": "transcription"},
        "app.tasks.email_tasks.*": {"queue": "email"},
    },
    task_default_queue="celery",
    worker_redirect_stdouts=False,
    beat_schedule={
        "reset-monthly-credits": {
            "task": "app.tasks.credit_tasks.reset_monthly_credits",
            "schedule": 3600.0,  # Check every hour; task handles logic
        },
    },
)
