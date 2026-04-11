"""
Email notification tasks.
Sends transactional emails via SMTP for key user events.
"""
from app.core.celery_app import celery_app
from app.core.config import settings
import smtplib
import ssl
import datetime
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, html_body: str, text_plain: str = "") -> bool:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
    msg["To"] = to_email
    if text_plain:
        msg.attach(MIMEText(text_plain, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.ehlo(); s.starttls(context=ctx)
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
        logger.info("Email sent → %s: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error("Email failed → %s: %s", to_email, e)
        return False


def _template(title: str, body: str, cta_text: str = "", cta_url: str = "") -> str:
    year = datetime.date.today().year
    cta = f'<div style="text-align:center;margin:32px 0;"><a href="{cta_url}" style="background:#ff710a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">{cta_text}</a></div>' if cta_text else ""
    return f"""<!DOCTYPE html><html><body style="margin:0;background:#f5f5f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1a1a15;padding:24px 40px;"><span style="font-size:20px;font-weight:800;color:#fff;">Repurpose<span style="color:#ff710a;">AI</span></span></td></tr>
<tr><td style="padding:40px 40px 0;"><h1 style="margin:0;font-size:24px;color:#1a1a15;">{title}</h1></td></tr>
<tr><td style="padding:20px 40px 0;font-size:15px;color:#5a5a4a;line-height:1.7;">{body}</td></tr>
<tr><td>{cta}</td></tr>
<tr><td style="padding:32px 40px;border-top:1px solid #e8e8df;font-size:13px;color:#8e8e79;text-align:center;">© {year} RepurposeAI</td></tr>
</table></td></tr></table></body></html>"""


APP_URL = "http://localhost:3000"


@celery_app.task(queue="email")
def send_welcome_email(user_email: str, user_name: str):
    name = user_name or "Creator"
    body = f"<p>Hey {name},</p><p>You're in! Create your first job and turn any content into 10 platform-ready pieces.</p><ul><li>3 free jobs/month</li><li>Blog, Twitter & LinkedIn outputs</li><li>No credit card needed</li></ul>"
    _send_email(user_email, f"Welcome to RepurposeAI, {name}! 🎉",
                _template(f"Welcome aboard, {name}!", body, "Create your first job →", f"{APP_URL}/dashboard/new"))


@celery_app.task(queue="email")
def send_job_complete_email(user_email: str, user_name: str, job_id: int, job_title: str, platform_count: int):
    name = user_name or "Creator"
    title = job_title or f"Job #{job_id}"
    body = f"<p>Hey {name},</p><p>Your job <strong>\"{title}\"</strong> is done. We generated <strong>{platform_count} platform-ready pieces</strong> — copy, download, and publish.</p>"
    _send_email(user_email, f"✅ Your content is ready — {title}",
                _template("Your content is ready 🚀", body, "View outputs →", f"{APP_URL}/dashboard/jobs/{job_id}"))


@celery_app.task(queue="email")
def send_job_failed_email(user_email: str, user_name: str, job_id: int, job_title: str):
    name = user_name or "Creator"
    title = job_title or f"Job #{job_id}"
    body = f"<p>Hey {name},</p><p>Job <strong>\"{title}\"</strong> failed. <strong>Your credit has been refunded.</strong> Please try again — if it keeps failing, reply to this email.</p>"
    _send_email(user_email, "⚠️ Job failed — your credit has been refunded",
                _template("Something went wrong", body, "Try again →", f"{APP_URL}/dashboard/new"))


@celery_app.task(queue="email")
def send_low_credits_email(user_email: str, user_name: str, credits_remaining: int, plan: str):
    name = user_name or "Creator"
    body = f"<p>Hey {name},</p><p>You only have <strong>{credits_remaining} credit(s) left</strong> this month on your <strong>{plan.title()} plan</strong>. Upgrade to keep creating without interruption.</p>"
    _send_email(user_email, "⚡ You're almost out of credits",
                _template("Running low on credits", body, "Upgrade now →", f"{APP_URL}/dashboard/pricing"))


@celery_app.task(queue="email")
def send_credits_reset_email(user_email: str, user_name: str, new_limit: int):
    name = user_name or "Creator"
    body = f"<p>Hey {name},</p><p>Your monthly credits have reset — you now have <strong>{new_limit} credits</strong> ready to use.</p>"
    _send_email(user_email, "🔄 Your credits have reset!",
                _template(f"You have {new_limit} fresh credits!", body, "Start repurposing →", f"{APP_URL}/dashboard/new"))


@celery_app.task(queue="email")
def send_upgrade_confirmation_email(user_email: str, user_name: str, plan: str, credits: int):
    name = user_name or "Creator"
    body = f"<p>Hey {name},</p><p>You're now on <strong>{plan.title()}</strong>. You have <strong>{credits} credits/month</strong>, all 10 platform formats, audio/video upload, and priority processing.</p>"
    _send_email(user_email, f"🎉 You're now on the {plan.title()} plan!",
                _template(f"Welcome to {plan.title()}! 🚀", body, "Create a job →", f"{APP_URL}/dashboard/new"))
