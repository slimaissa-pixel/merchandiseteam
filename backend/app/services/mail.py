import logging
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

# ---------------------------------------------------------------------------
# HTML Templates
# ---------------------------------------------------------------------------

APPROVAL_HTML = """
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
  <h2 style="color:#d4a84b;margin-bottom:8px;">Your demo access has been approved.</h2>
  <p style="color:#64748b;margin-top:0;">You can now log in to the FieldForce platform.</p>
  <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:24px 0;border:1px solid #e2e8f0;">
    <p style="margin:0;color:#334155;font-size:14px;"><strong>Email:</strong> {email}</p>
    <p style="margin:10px 0 0;color:#334155;font-size:14px;"><strong>Password:</strong> password123</p>
  </div>
  <a href="{login_url}" style="display:inline-block;margin-top:8px;padding:14px 28px;
     background:#d4a84b;color:#000;font-weight:700;border-radius:12px;text-decoration:none;">
    Launch Platform
  </a>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
    You are receiving this email because an administrator approved your FieldForce demo request.
  </p>
</div>
"""

DENIAL_HTML = """
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
  <h2 style="color:#ef4444;margin-bottom:8px;">Update on your FieldForce demo request</h2>
  <p style="color:#64748b;margin-top:0;">
    Hello. Unfortunately, your request for administrative demo access has been denied at this time.
  </p>
  <p style="color:#64748b;margin-top:16px;">
    If you believe this is a mistake or would like to schedule an official walk-through,
    please reach out to our team.
  </p>
  <a href="{contact_url}" style="display:inline-block;margin-top:24px;padding:14px 28px;
     background:#f1f5f9;color:#334155;font-weight:700;border-radius:12px;text-decoration:none;">
    Contact Support
  </a>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
    You are receiving this email because you submitted a FieldForce demo request.
  </p>
</div>
"""

DEMO_RECEIVED_HTML = """
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;background:#0a0a0c;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#d4a84b,#f5cc7f);padding:16px 32px;border-radius:16px;">
      <span style="color:#000;font-size:22px;font-weight:900;letter-spacing:-0.02em;">FieldForce</span>
    </div>
  </div>
  <h2 style="color:#ffffff;margin-bottom:8px;font-size:24px;">Demo request received &#x2705;</h2>
  <p style="color:#94a3b8;margin-top:0;font-size:15px;line-height:1.6;">
    Hi there! We have received your request for a FieldForce demo access.
    Our team will review it and get back to you shortly.
  </p>
  <div style="background:#1a1a1e;padding:24px;border-radius:16px;margin:24px 0;border:1px solid rgba(255,255,255,0.08);">
    <p style="margin:0;color:#d4a84b;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Submitted Email</p>
    <p style="margin:8px 0 0;color:#ffffff;font-size:16px;font-weight:600;">{email}</p>
  </div>
  <p style="color:#64748b;font-size:13px;line-height:1.6;">
    Once approved, you will receive a separate email with your login credentials.
  </p>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;">
    You are receiving this because you submitted a demo request at FieldForce.
  </p>
</div>
"""

# ---------------------------------------------------------------------------
# Send functions — SYNCHRONOUS so they work with RQ and BackgroundTasks
# ---------------------------------------------------------------------------

def send_approval_email(email: str) -> None:
    """Send demo approval email."""
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATED] Approval → {email}")
        return
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": "Your FieldForce access is approved ✅",
            "html": APPROVAL_HTML.format(
                email=email,
                login_url=settings.APP_URL + "/login",
            ),
        })
        logger.info(f"[EMAIL SENT] Approval → {email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] Approval → {email}: {e}")


def send_denial_email(email: str) -> None:
    """Send demo denial email."""
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATED] Denial → {email}")
        return
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": "Update on your FieldForce request",
            "html": DENIAL_HTML.format(
                contact_url=settings.APP_URL + "/#contact",
            ),
        })
        logger.info(f"[EMAIL SENT] Denial → {email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] Denial → {email}: {e}")


def send_demo_received_email(email: str) -> None:
    """Instant confirmation when a demo request is submitted."""
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATED] Demo received → {email}")
        return
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": "We received your FieldForce demo request ✅",
            "html": DEMO_RECEIVED_HTML.format(email=email),
        })
        logger.info(f"[EMAIL SENT] Demo received → {email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] Demo received → {email}: {e}")


_PASSWORD_RESET_HTML = """
<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
  <h2 style="color:#d4a84b;margin-bottom:8px;">Reset your password</h2>
  <p style="color:#64748b;margin-top:0;">
    We received a request to reset the password for your FieldForce account.
    This link is valid for <strong>15 minutes</strong>.
  </p>
  <a href="{reset_url}" style="display:inline-block;margin-top:16px;padding:14px 28px;
     background:#d4a84b;color:#000;font-weight:700;border-radius:12px;text-decoration:none;">
    Reset Password
  </a>
  <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
    If you did not request a password reset, you can safely ignore this email.
  </p>
</div>
"""


def send_password_reset_email(email: str, reset_token: str) -> None:
    """Send password-reset link email."""
    reset_url = f"{settings.APP_URL}/reset-password?token={reset_token}"
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATED] Password reset → {email}  URL: {reset_url}")
        return
    try:
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": "Reset your FieldForce password",
            "html": _PASSWORD_RESET_HTML.format(reset_url=reset_url),
        })
        logger.info(f"[EMAIL SENT] Password reset → {email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] Password reset → {email}: {e}")

def send_daily_report_email(email: str, pdf_path: str, date_str: str) -> None:
    """Send daily activity report PDF to supervisor."""
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL SIMULATED] Daily report → {email} with attachment {pdf_path}")
        return
    try:
        import base64
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()
        
        pdf_b64 = base64.b64encode(pdf_data).decode("utf-8")
        
        resend.Emails.send({
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [email],
            "subject": f"Daily Merchandising Report - {date_str}",
            "html": f"<p>Please find attached the daily merchandising activity report for {date_str}.</p>",
            "attachments": [
                {
                    "filename": f"daily_report_{date_str}.pdf",
                    "content": pdf_b64
                }
            ]
        })
        logger.info(f"[EMAIL SENT] Daily report → {email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] Daily report → {email}: {e}")


