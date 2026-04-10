"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("credits_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("credits_reset_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "repurpose_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("content_type", sa.String(20), nullable=False),
        sa.Column("original_content", sa.Text(), nullable=True),
        sa.Column("original_url", sa.String(2000), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("transcription", sa.Text(), nullable=True),
        sa.Column("platforms", postgresql.JSON(), nullable=False, server_default="[]"),
        sa.Column("tone", sa.String(50), nullable=False, server_default="professional"),
        sa.Column("target_audience", sa.String(255), nullable=True),
        sa.Column("keywords", postgresql.JSON(), nullable=True, server_default="[]"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("processing_time_seconds", sa.Float(), nullable=True),
        sa.Column("credits_consumed", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repurpose_jobs_user_id", "repurpose_jobs", ["user_id"])

    op.create_table(
        "repurpose_outputs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("repurpose_jobs.id"), nullable=False),
        sa.Column("platform", sa.String(50), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("char_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("seo_score", sa.Float(), nullable=True),
        sa.Column("metadata", postgresql.JSON(), nullable=True, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repurpose_outputs_job_id", "repurpose_outputs", ["job_id"])


def downgrade() -> None:
    op.drop_table("repurpose_outputs")
    op.drop_table("repurpose_jobs")
    op.drop_table("users")
