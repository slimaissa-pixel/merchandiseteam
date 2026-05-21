"""
app/services/push.py

Sends push notifications via Expo's Push Notification API.
Works even when the mobile app is closed/backgrounded.

Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/

Usage:
    from app.services.push import send_push_notification, send_push_to_user

    # Single token
    send_push_notification("ExponentPushToken[xxxx]", "GPS Lost", "John is offline")

    # From DB user object
    send_push_to_user(db_user, "Leave Approved", "Your leave has been approved.")
"""
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def is_valid_expo_token(token: Optional[str]) -> bool:
    if not token:
        return False
    return token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")


def send_push_notification(
    expo_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    sound: str = "default",
    badge: int = 1,
) -> bool:
    """
    Send a single push notification to an Expo push token.
    Returns True if Expo accepted the message, False otherwise.
    """
    if not is_valid_expo_token(expo_token):
        logger.warning(f"[Push] Invalid or missing Expo token: {expo_token!r} — skipping.")
        return False

    payload = {
        "to": expo_token,
        "title": title,
        "body": body,
        "sound": sound,
        "badge": badge,
        "data": data or {},
    }

    try:
        response = httpx.post(
            EXPO_PUSH_URL,
            json=payload,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
        result = response.json()
        ticket = result.get("data", [{}])
        if isinstance(ticket, list):
            ticket = ticket[0] if ticket else {}

        if ticket.get("status") == "error":
            logger.error(f"[Push] Expo returned error: {ticket.get('message')} — details: {ticket.get('details')}")
            return False

        logger.info(f"[Push] Sent to {expo_token[:30]}... title='{title}'")
        return True

    except httpx.TimeoutException:
        logger.warning("[Push] Expo push request timed out.")
        return False
    except Exception as e:
        logger.error(f"[Push] Unexpected error sending push notification: {e}")
        return False


def send_push_to_user(user, title: str, body: str, data: Optional[dict] = None) -> bool:
    """
    Convenience wrapper — sends a push notification to a User ORM object.
    Silently no-ops if the user has no registered Expo push token.
    """
    token = getattr(user, "expo_push_token", None)
    if not token:
        return False
    return send_push_notification(token, title, body, data)


def send_push_batch(tokens: list[str], title: str, body: str, data: Optional[dict] = None) -> int:
    """
    Send push notifications to multiple tokens.
    Returns count of successfully sent messages.
    Expo supports batching up to 100 messages per request.
    """
    valid_tokens = [t for t in tokens if is_valid_expo_token(t)]
    if not valid_tokens:
        return 0

    # Build batch payload (Expo accepts an array)
    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "badge": 1,
            "data": data or {},
        }
        for token in valid_tokens
    ]

    sent = 0
    # Expo limit: 100 per batch
    for i in range(0, len(messages), 100):
        batch = messages[i:i + 100]
        try:
            response = httpx.post(
                EXPO_PUSH_URL,
                json=batch,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )
            tickets = response.json().get("data", [])
            for ticket in tickets:
                if ticket.get("status") != "error":
                    sent += 1
        except Exception as e:
            logger.error(f"[Push] Batch send failed: {e}")

    logger.info(f"[Push] Batch complete — {sent}/{len(valid_tokens)} delivered.")
    return sent
