from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import PlanType, JobStatus, ContentType, Platform


# ── Auth ──────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ─────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    plan: PlanType
    credits_used: int
    credits_remaining: int
    monthly_credit_limit: int
    stripe_customer_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


# ── Repurpose Job ─────────────────────────────────────────────

class RepurposeRequest(BaseModel):
    title: Optional[str] = None
    content_type: ContentType
    original_content: Optional[str] = None
    original_url: Optional[str] = None
    platforms: List[Platform]
    tone: str = "professional"
    target_audience: Optional[str] = None
    keywords: Optional[List[str]] = None

    @field_validator("platforms")
    @classmethod
    def validate_platforms(cls, v):
        if not v:
            raise ValueError("At least one platform required")
        if len(v) > 10:
            raise ValueError("Maximum 10 platforms per job")
        return v


class OutputSchema(BaseModel):
    id: int
    platform: Platform
    content: str
    char_count: int
    word_count: int
    seo_score: Optional[float]
    extra_metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class JobOut(BaseModel):
    id: int
    title: Optional[str]
    content_type: ContentType
    platforms: List[str]
    tone: str
    status: JobStatus
    error_message: Optional[str]
    processing_time_seconds: Optional[float]
    credits_consumed: int
    created_at: datetime
    completed_at: Optional[datetime]
    outputs: List[OutputSchema] = []

    class Config:
        from_attributes = True


class JobListItem(BaseModel):
    id: int
    title: Optional[str]
    content_type: ContentType
    platforms: List[str]
    status: JobStatus
    credits_consumed: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Payments ─────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str  # starter | pro | agency
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str


class BillingPortalRequest(BaseModel):
    return_url: str


# ── Stats ─────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_jobs: int
    completed_jobs: int
    total_outputs: int
    credits_used: int
    credits_remaining: int
    plan: str
    popular_platform: Optional[str]
