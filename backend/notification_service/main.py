"""
BookEase — Notification Service
Listens to the Redis queue and sends email notifications.
"""
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
import smtplib
import redis
import json
import os
import logging
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="BookEase Notification Service", version="1.0.0")
Instrumentator().instrument(app).expose(app)

redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.mailtrap.io")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@bookease.app")


# ─── Email templates ──────────────────────────────────────────
def send_email(to: str, subject: str, body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


def booking_confirmed_email(event: dict) -> str:
    return f"""
    <h2>Your booking is confirmed! 🎉</h2>
    <p>Hi {event['customer_name']},</p>
    <p>Your appointment has been confirmed for <strong>{event['appointment_date']}</strong> at <strong>{event['appointment_time']}</strong>.</p>
    <p>Booking ID: #{event['booking_id']}</p>
    <p>See you soon!</p>
    <p>— The BookEase Team</p>
    """


def booking_cancelled_email(event: dict) -> str:
    return f"""
    <h2>Booking cancelled</h2>
    <p>Hi {event['customer_name']},</p>
    <p>Your booking #{event['booking_id']} has been cancelled.</p>
    <p>To rebook, visit our app anytime.</p>
    <p>— The BookEase Team</p>
    """


# ─── Queue worker ─────────────────────────────────────────────
def process_notifications():
    """Blocking loop — runs in background thread, pops events from Redis."""
    logger.info("Notification worker started, listening on 'notification_queue'...")
    while True:
        try:
            # BLPOP blocks until a message arrives (timeout 0 = block forever)
            _, raw = redis_client.blpop("notification_queue", timeout=0)
            event = json.loads(raw)
            event_type = event.get("type")

            if event_type == "booking_confirmed":
                send_email(
                    to=event["customer_email"],
                    subject="Your booking is confirmed — BookEase",
                    body=booking_confirmed_email(event),
                )
            elif event_type == "booking_cancelled":
                send_email(
                    to=event["customer_email"],
                    subject="Booking cancelled — BookEase",
                    body=booking_cancelled_email(event),
                )
            else:
                logger.warning(f"Unknown event type: {event_type}")

        except Exception as e:
            logger.error(f"Worker error: {e}")


@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=process_notifications, daemon=True)
    thread.start()


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "notification"}
