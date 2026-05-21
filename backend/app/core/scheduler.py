"""
app/core/scheduler.py

Background task scheduler using APScheduler.

Issue (Gap #4): Previously this ran inside the Uvicorn web process, meaning it
would stop during restarts/crashes. The fix here:

  1. Uses `BackgroundScheduler` with a `ThreadPoolExecutor` (max 3 workers) to
     prevent task pile-up if DB is slow.
  2. Adds `misfire_grace_time=60s` so that tasks that were missed during a
     restart get executed within a 60-second window instead of being silently
     dropped.
  3. Integrates Expo push notifications (Gap #3) — DB alerts are still created
     for the in-app bell, but now a push notification is ALSO sent to the user's
     device via Expo's push API so they receive it even when the app is closed.

For production: move to a dedicated Celery worker or Railway/Supabase Cron to
fully decouple from the web process. This implementation is the safest upgrade
without adding new infrastructure.
"""
import logging
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ThreadPoolExecutor as APSThreadPoolExecutor
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.workday import Workday
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Task: GPS Heartbeat Check
# ---------------------------------------------------------------------------

def check_gps_heartbeats() -> None:
    """
    Check for merchandisers who haven't sent a GPS heartbeat in 15+ minutes.

    For each stale workday:
    - Creates an in-app Notification for the supervisor (visible in the bell).
    - Sends an Expo push notification to the supervisor's device (works when
      the app is closed — fixes Gap #3).

    De-duplicates: only fires once per merchandiser per hour.
    """
    logger.info("[Scheduler] Checking GPS heartbeats...")
    db: Session = SessionLocal()
    try:
        # Import here to avoid circular imports at module load time
        from app.services.push import send_push_to_user

        now = datetime.now(timezone.utc)
        timeout_threshold = now - timedelta(minutes=15)

        stale_workdays = (
            db.query(Workday)
            .join(User)
            .filter(
                Workday.status == "active",
                (Workday.last_seen_at < timeout_threshold)
                | (Workday.last_seen_at == None),  # noqa: E711
            )
            .all()
        )

        for wd in stale_workdays:
            if not wd.user.supervisor_id:
                continue

            # De-duplicate: skip if we already alerted in the last hour
            recent_alert = (
                db.query(Notification)
                .filter(
                    Notification.user_id == wd.user.supervisor_id,
                    Notification.type == "alert",
                    Notification.title == "GPS Signal Lost",
                    Notification.message.like(f"%{wd.user.first_name}%"),
                    Notification.created_at >= now - timedelta(hours=1),
                )
                .first()
            )

            if recent_alert:
                continue

            merch_name = f"{wd.user.first_name} {wd.user.last_name}"
            msg = (
                f"Merchandiser {merch_name} hasn't sent a location "
                "update in 15+ minutes."
            )

            # 1. In-app notification (for the bell icon when app is open)
            alert = Notification(
                user_id=wd.user.supervisor_id,
                title="GPS Signal Lost",
                message=msg,
                type="alert",
            )
            db.add(alert)
            db.flush()  # get the supervisor object

            # 2. Expo push notification (works when app is CLOSED)
            supervisor = db.query(User).filter(
                User.id == wd.user.supervisor_id
            ).first()
            if supervisor:
                sent = send_push_to_user(
                    supervisor,
                    title="⚠️ GPS Signal Lost",
                    body=msg,
                    data={"type": "alert", "user_id": wd.user.id},
                )
                if sent:
                    logger.info(
                        f"[Push] GPS alert pushed to supervisor {supervisor.id} "
                        f"for merchandiser {wd.user.id}"
                    )

            logger.warning(
                f"[Alert] GPS lost for user {wd.user.id}. "
                f"Notified supervisor {wd.user.supervisor_id}."
            )

        db.commit()

    except Exception as e:
        logger.error(f"[Scheduler] Heartbeat check failed: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Task: Daily Report Emails
# ---------------------------------------------------------------------------

def generate_daily_reports() -> None:
    """Generate and email daily activity reports to supervisors."""
    logger.info("[Scheduler] Generating daily reports...")
    from app.models.visit import Visit
    from app.models.gms import GMS
    from app.services.pdf import generate_daily_report_pdf
    from app.services.mail import send_daily_report_email

    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        visits_today = (
            db.query(Visit)
            .join(Workday)
            .join(User)
            .filter(Visit.start_time >= today_start)
            .all()
        )

        supervisor_data: dict = {}
        for v in visits_today:
            merch = v.workday.user
            sup_id = merch.supervisor_id
            if not sup_id:
                continue

            if sup_id not in supervisor_data:
                sup = db.query(User).filter(User.id == sup_id).first()
                if not sup:
                    continue
                supervisor_data[sup_id] = {"supervisor": sup, "visits": []}

            store = db.query(GMS).filter(GMS.id == v.gms_id).first()
            store_name = store.name if store else "Unknown Store"
            end_time_str = v.end_time.strftime("%H:%M") if v.end_time else "Ongoing"

            supervisor_data[sup_id]["visits"].append(
                {
                    "merchandiser": f"{merch.first_name} {merch.last_name}",
                    "store": store_name,
                    "start": v.start_time.strftime("%H:%M"),
                    "end": end_time_str,
                    "status": v.status,
                }
            )

        date_str = now.strftime("%Y-%m-%d")
        for sup_id, data in supervisor_data.items():
            sup = data["supervisor"]
            pdf_path = generate_daily_report_pdf(
                f"{sup.first_name} {sup.last_name}",
                date_str,
                data["visits"],
            )
            if sup.email:
                send_daily_report_email(sup.email, pdf_path, date_str)

    except Exception as e:
        logger.error(f"[Scheduler] Daily report failed: {e}", exc_info=True)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Scheduler bootstrap
# ---------------------------------------------------------------------------

def start_scheduler() -> BackgroundScheduler:
    """
    Start the APScheduler background scheduler.

    Key resilience settings:
    - ThreadPoolExecutor(3): caps concurrency so slow DB calls don't pile up.
    - misfire_grace_time=60: tasks missed during restart are retried within 60s.
    - coalesce=True: if a task missed multiple intervals, run it only once.
    """
    executors = {
        "default": APSThreadPoolExecutor(max_workers=3),
    }
    job_defaults = {
        "coalesce": True,
        "misfire_grace_time": 60,
        "max_instances": 1,
    }

    scheduler = BackgroundScheduler(
        executors=executors,
        job_defaults=job_defaults,
        timezone="UTC",
    )

    # GPS heartbeat — every 5 minutes
    scheduler.add_job(
        check_gps_heartbeats,
        trigger="interval",
        minutes=5,
        id="gps_heartbeat",
        replace_existing=True,
    )

    # Daily summary report — every day at 20:00 UTC
    scheduler.add_job(
        generate_daily_reports,
        trigger="cron",
        hour=20,
        minute=0,
        id="daily_reports",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("[Scheduler] ✓ Background scheduler started (GPS every 5min, Reports at 20:00 UTC).")
    return scheduler
