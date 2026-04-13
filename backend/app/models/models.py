from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum, Float
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    AGENCY = "agency"


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ContentType(str, enum.Enum):
    TEXT = "text"
    AUDIO = "audio"
    VIDEO = "video"
    URL = "url"


class Platform(str, enum.Enum):
    BLOG = "blog"
    TWITTER_THREAD = "twitter_thread"
    LINKEDIN = "linkedin"
    INSTAGRAM = "instagram"
    YOUTUBE_DESC = "youtube_desc"
    NEWSLETTER = "newsletter"
    TIKTOK_SCRIPT = "tiktok_script"
    REDDIT = "reddit"
    PODCAST_NOTES = "podcast_notes"
    REEL_SCRIPT = "reel_script"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    plan: Mapped[PlanType] = mapped_column(SAEnum(PlanType, values_callable=lambda x: [e.value for e in x]), default=PlanType.FREE)
    credits_used: Mapped[int] = mapped_column(Integer, default=0)
    credits_reset_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255))
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    jobs: Mapped[List["RepurposeJob"]] = relationship("RepurposeJob", back_populates="user")

    @property
    def monthly_credit_limit(self) -> int:
        from app.core.config import settings
        limits = {
            PlanType.FREE: settings.FREE_TIER_MONTHLY_CREDITS,
            PlanType.STARTER: settings.STARTER_TIER_MONTHLY_CREDITS,
            PlanType.PRO: settings.PRO_TIER_MONTHLY_CREDITS,
            PlanType.AGENCY: 999999,
        }
        return limits.get(self.plan, 3)

    @property
    def credits_remaining(self) -> int:
        return max(0, self.monthly_credit_limit - self.credits_used)


class RepurposeJob(Base):
    __tablename__ = "repurpose_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[Optional[str]] = mapped_column(String(500))
    content_type: Mapped[ContentType] = mapped_column(SAEnum(ContentType, values_callable=lambda x: [e.value for e in x]))
    original_content: Mapped[Optional[str]] = mapped_column(Text)
    original_url: Mapped[Optional[str]] = mapped_column(String(2000))
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    transcription: Mapped[Optional[str]] = mapped_column(Text)
    platforms: Mapped[List[str]] = mapped_column(JSON, default=list)
    tone: Mapped[str] = mapped_column(String(50), default="professional")
    target_audience: Mapped[Optional[str]] = mapped_column(String(255))
    keywords: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus, values_callable=lambda x: [e.value for e in x]), default=JobStatus.PENDING)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(255))
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    processing_time_seconds: Mapped[Optional[float]] = mapped_column(Float)
    credits_consumed: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship("User", back_populates="jobs")
    outputs: Mapped[List["RepurposeOutput"]] = relationship("RepurposeOutput", back_populates="job")


class RepurposeOutput(Base):
    __tablename__ = "repurpose_outputs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("repurpose_jobs.id"), index=True)
    platform: Mapped[Platform] = mapped_column(SAEnum(Platform, values_callable=lambda x: [e.value for e in x]))
    content: Mapped[str] = mapped_column(Text)
    char_count: Mapped[int] = mapped_column(Integer, default=0)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    seo_score: Mapped[Optional[float]] = mapped_column(Float)
    extra_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    job: Mapped["RepurposeJob"] = relationship("RepurposeJob", back_populates="outputs")
