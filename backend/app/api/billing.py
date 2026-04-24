"""
Billing API — powered by Paystack (Kenya, M-Pesa + cards).
"""
import hmac
import hashlib
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import User, PlanType
from app.schemas.schemas import CheckoutRequest, CheckoutResponse
from app.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

PAYSTACK_BASE = "https://api.paystack.co"

PLAN_AMOUNTS = {
    "starter": 250000,   # KES 2,500 in kobo
    "pro":     650000,   # KES 6,500
    "agency":  2000000,  # KES 20,000
}

PLAN_TYPE_MAP = {
    "starter": PlanType.STARTER,
    "pro":     PlanType.PRO,
    "agency":  PlanType.AGENCY,
}

CREDIT_MAP = {
    "starter": settings.STARTER_TIER_MONTHLY_CREDITS,
    "pro":     settings.PRO_TIER_MONTHLY_CREDITS,
    "agency":  999,
}


async def paystack_request(method: str, endpoint: str, data: dict = None) -> dict:
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        if method == "POST":
            resp = await client.post(f"{PAYSTACK_BASE}{endpoint}", json=data, headers=headers)
        else:
            resp = await client.get(f"{PAYSTACK_BASE}{endpoint}", headers=headers)
        resp.raise_for_status()
        return resp.json()


def get_plan_code(plan: str) -> str:
    codes = {
        "starter": settings.PAYSTACK_STARTER_PLAN_CODE,
        "pro":     settings.PAYSTACK_PRO_PLAN_CODE,
        "agency":  settings.PAYSTACK_AGENCY_PLAN_CODE,
    }
    return codes.get(plan, "")


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    plan_code = get_plan_code(payload.plan)
    amount = PLAN_AMOUNTS.get(payload.plan)

    if not amount:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        body: dict = {
            "email": current_user.email,
            "amount": amount,
            "currency": "KES",
            "callback_url": payload.success_url,
            "metadata": {
                "user_id": str(current_user.id),
                "plan": payload.plan,
                "full_name": current_user.full_name or "",
            },
        }
        # Only add plan code if configured (recurring subscription)
        if plan_code:
            body["plan"] = plan_code

        result = await paystack_request("POST", "/transaction/initialize", body)
    except Exception as e:
        logger.error("Paystack checkout error: %s", e)
        raise HTTPException(status_code=500, detail="Payment provider error. Try again.")

    if not result.get("status"):
        raise HTTPException(status_code=400, detail=result.get("message", "Checkout failed"))

    return CheckoutResponse(checkout_url=result["data"]["authorization_url"])


@router.get("/verify")
async def verify_payment(
    reference: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Called after Paystack redirects back with ?reference=xxx
    Verifies payment and upgrades the user plan immediately.
    """
    if not reference:
        raise HTTPException(status_code=400, detail="No reference provided")

    try:
        result = await paystack_request("GET", f"/transaction/verify/{reference}")
    except Exception as e:
        logger.error("Paystack verify error: %s", e)
        raise HTTPException(status_code=400, detail="Could not verify payment")

    if not result.get("status"):
        raise HTTPException(status_code=400, detail="Verification failed")

    txn = result["data"]
    if txn.get("status") != "success":
        raise HTTPException(status_code=400, detail=f"Payment status: {txn.get('status')}")

    metadata = txn.get("metadata", {})
    # metadata can be a string or dict depending on Paystack version
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except Exception:
            metadata = {}

    plan_str = metadata.get("plan")
    user_id_str = metadata.get("user_id")

    if not plan_str:
        raise HTTPException(status_code=400, detail="Plan info missing from payment")

    # Verify this payment belongs to the current user
    if user_id_str and str(current_user.id) != str(user_id_str):
        raise HTTPException(status_code=403, detail="Payment does not belong to this account")

    plan = PLAN_TYPE_MAP.get(plan_str)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan_str}")

    sub_code = txn.get("subscription_code") or reference
    await UserService.update_plan(db, current_user, plan, sub_code)
    logger.info("User %s upgraded to %s via reference %s", current_user.id, plan_str, reference)

    # Send confirmation email
    try:
        from app.tasks.email_tasks import send_upgrade_confirmation_email
        send_upgrade_confirmation_email.delay(
            current_user.email,
            current_user.full_name or "",
            plan_str,
            CREDIT_MAP.get(plan_str, 30),
        )
    except Exception:
        pass

    return {
        "status": "success",
        "plan": plan_str,
        "credits": CREDIT_MAP.get(plan_str, 30),
        "message": f"Successfully upgraded to {plan_str.title()}!"
    }


@router.post("/webhook", include_in_schema=False)
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.body()

    # Verify Paystack signature
    sig = request.headers.get("x-paystack-signature", "")
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=400, detail="Invalid signature")

    event = json.loads(body)
    event_type = event.get("event")
    data = event.get("data", {})
    logger.info("Paystack webhook received: %s", event_type)

    if event_type == "charge.success":
        metadata = data.get("metadata", {})
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except Exception:
                metadata = {}

        plan_str = metadata.get("plan")
        user_id = metadata.get("user_id")

        if plan_str and user_id:
            user = await UserService.get_by_id(db, int(user_id))
            if user:
                plan = PLAN_TYPE_MAP.get(plan_str, PlanType.STARTER)
                sub_code = data.get("subscription_code", "")
                await UserService.update_plan(db, user, plan, sub_code)
                logger.info("Webhook: upgraded user %s to %s", user_id, plan_str)

    elif event_type == "subscription.disable":
        sub_code = data.get("subscription_code", "")
        if sub_code:
            from sqlalchemy import select
            result = await db.execute(
                select(User).where(User.stripe_subscription_id == sub_code)
            )
            user = result.scalar_one_or_none()
            if user:
                await UserService.update_plan(db, user, PlanType.FREE, "")

    return {"status": "ok"}


@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {"id": "starter", "name": "Starter", "amount_kes": 2500,  "credits": 30 },
            {"id": "pro",     "name": "Pro",     "amount_kes": 6500,  "credits": 100},
            {"id": "agency",  "name": "Agency",  "amount_kes": 20000, "credits": 999},
        ]
    }
