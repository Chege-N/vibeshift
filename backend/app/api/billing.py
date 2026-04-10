import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import User, PlanType
from app.schemas.schemas import CheckoutRequest, CheckoutResponse, BillingPortalRequest
from app.services.user_service import UserService

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/billing", tags=["Billing"])

PLAN_PRICE_MAP = {
    "starter": settings.STRIPE_STARTER_PRICE_ID,
    "pro": settings.STRIPE_PRO_PRICE_ID,
    "agency": settings.STRIPE_AGENCY_PRICE_ID,
}

PLAN_TYPE_MAP = {
    "starter": PlanType.STARTER,
    "pro": PlanType.PRO,
    "agency": PlanType.AGENCY,
}


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    payload: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    price_id = PLAN_PRICE_MAP.get(payload.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Get or create Stripe customer
    if not current_user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"user_id": str(current_user.id)},
        )
        current_user.stripe_customer_id = customer.id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=current_user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=payload.success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=payload.cancel_url,
        metadata={"user_id": str(current_user.id), "plan": payload.plan},
    )

    return CheckoutResponse(checkout_url=session.url)


@router.post("/portal")
async def create_portal(
    payload: BillingPortalRequest,
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=payload.return_url,
    )
    return {"portal_url": session.url}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    body = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            body, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan_str = session["metadata"]["plan"]
        sub_id = session["subscription"]

        user = await UserService.get_by_id(db, user_id)
        if user:
            plan = PLAN_TYPE_MAP.get(plan_str, PlanType.STARTER)
            await UserService.update_plan(db, user, plan, sub_id)

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == sub["id"])
        )
        user = result.scalar_one_or_none()
        if user:
            await UserService.update_plan(db, user, PlanType.FREE, "")

    return {"status": "ok"}
