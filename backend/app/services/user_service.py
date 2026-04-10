from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.models import User, PlanType
from app.core.security import get_password_hash, verify_password
from datetime import datetime, timezone


class UserService:

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, email: str, password: str, full_name: Optional[str] = None) -> User:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            credits_reset_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await UserService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def update_plan(db: AsyncSession, user: User, plan: PlanType, stripe_sub_id: str) -> User:
        user.plan = plan
        user.stripe_subscription_id = stripe_sub_id
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def consume_credit(db: AsyncSession, user: User) -> bool:
        if user.credits_remaining <= 0:
            return False
        user.credits_used += 1
        await db.commit()
        return True

    @staticmethod
    async def reset_credits(db: AsyncSession, user: User) -> User:
        user.credits_used = 0
        user.credits_reset_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)
        return user
