"""
Billing API — powered by Paystack (works in Kenya, supports M-Pesa + cards).
Paystack docs: https://paystack.com/docs/api
"""
import hmac
import hashlib
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import User, PlanType
from app.schemas.schemas import CheckoutRequest, CheckoutResponse, BillingPortalRequest
from app.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["Billing"])

PAYSTACK_BASE = "https://api.paystack.co"

# Plan amounts in KES (Kenya Shillings) — adjust to your pricing
PLAN_AMOUNTS = {
    "starter": 250000,   # KES 2,500/month
    "pro":     650000,   # KES 6,500/month
    "agency":  2000000,  # KES 20,000/month
}

# Paystack Plan codes — create these in Paystack dashboard
PLAN_CODES = {
    "starter": settings.PAYSTACK_STARTER_PLAN_CODE,
    "pro":     settings.PAYSTACK_PRO_PLAN_CODE,
    "agency":  settings.PAYSTACK_AGENCY_PLAN_CODE,
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
    """Make authenticated request to Paystack API."""
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


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Initialize a Paystack transaction.
    Returns a checkout URL — user pays there, Paystack redirects back.
    """
    plan_code = PLAN_CODES.get(payload.plan)
    amount = PLAN_AMOUNTS.get(payload.plan)

    if not plan_code or not amount:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        result = await paystack_request("POST", "/transaction/initialize", {
            "email": current_user.email,
            "amount": amount,          # in kobo/cents
            "plan": plan_code,         # links to recurring plan
            "currency": "KES",
            "callback_url": payload.success_url,
            "metadata": {
                "user_id": str(current_user.id),
                "plan": payload.plan,
                "full_name": current_user.full_name or "",
            },
        })
    except Exception as e:
        logger.error("Paystack checkout error: %s", e)
        raise HTTPException(status_code=500, detail="Payment provider error. Try again.")

    if not result.get("status"):
        raise HTTPException(status_code=400, detail=result.get("message", "Checkout failed"))

    checkout_url = result["data"]["authorization_url"]
    return CheckoutResponse(checkout_url=checkout_url)


@router.get("/verify")
async def verify_payment(
    reference: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Called after Paystack redirects back to success_url.
    Verifies the payment and upgrades the user's plan.
    """
    try:
        result = await paystack_request("GET", f"/transaction/verify/{reference}")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not verify payment")

    if not result.get("status") or result["data"]["status"] != "success":
        raise HTTPException(status_code=400, detail="Payment not successful")

    metadata = result["data"].get("metadata", {})
    plan_str = metadata.get("plan")
    user_id = metadata.get("user_id")

    if not plan_str or not user_id:
        raise HTTPException(status_code=400, detail="Invalid payment metadata")

    # Upgrade the user
    plan = PLAN_TYPE_MAP.get(plan_str, PlanType.STARTER)
    sub_code = result["data"].get("subscription_code", reference)
    await UserService.update_plan(db, current_user, plan, sub_code)

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

    return {"status": "success", "plan": plan_str}


@router.post("/webhook", include_in_schema=False)
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Paystack sends events here for subscription renewals/cancellations.
    Secured by HMAC-SHA512 signature verification.
    """
    body = await request.body()

    # Verify signature
    sig = request.headers.get("x-paystack-signature", "")
    expected = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode(),
        body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    event = json.loads(body)
    event_type = event.get("event")
    data = event.get("data", {})

    logger.info("Paystack webhook: %s", event_type)

    if event_type == "charge.success":
        # One-time or first subscription payment succeeded
        metadata = data.get("metadata", {})
        plan_str = metadata.get("plan")
        user_id = metadata.get("user_id")

        if plan_str and user_id:
            user = await UserService.get_by_id(db, int(user_id))
            if user:
                plan = PLAN_TYPE_MAP.get(plan_str, PlanType.STARTER)
                sub_code = data.get("subscription_code", "")
                await UserService.update_plan(db, user, plan, sub_code)

    elif event_type == "subscription.disable":
        # Subscription cancelled — downgrade to free
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
    """Return plan info for the frontend pricing page."""
    return {
        "plans": [
            {"id": "starter", "name": "Starter", "amount_kes": 2500,  "amount_usd": 19, "credits": 30 },
            {"id": "pro",     "name": "Pro",     "amount_kes": 6500,  "amount_usd": 49, "credits": 100},
            {"id": "agency",  "name": "Agency",  "amount_kes": 20000, "amount_usd": 149,"credits": 999},
        ]
    }
