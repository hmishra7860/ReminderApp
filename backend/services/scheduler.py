"""
Background scheduler – runs daily checks and sends emails.
Start alongside the FastAPI app using APScheduler.
"""
import asyncio
import logging
from datetime import date
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database.db import AsyncSessionLocal
from models.models import Reminder, Birthday, NotificationLog
from services.email_service import send_reminder_email, send_birthday_email

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_reminders():
    """Send email for reminders due today."""
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Reminder).where(Reminder.date == today))
        reminders = result.scalars().all()
        for r in reminders:
            logger.info(f"Reminder due today: {r.title}")
            # TODO: get user email from authenticated session
            # send_reminder_email(user_email, r.title, r.description, r.date, r.time)


async def check_birthdays():
    """Send birthday wishes for birthdays today."""
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Birthday))
        birthdays = result.scalars().all()
        for b in birthdays:
            dob = b.date_of_birth
            if dob.month == today.month and dob.day == today.day:
                age = today.year - dob.year
                logger.info(f"Birthday today: {b.name} turns {age}")
                if b.email:
                    sent = send_birthday_email(b.email, b.name, age)
                    log = NotificationLog(
                        birthday_id=b.id,
                        email=b.email,
                        status="sent" if sent else "failed",
                        message=f"Birthday wish for {b.name} (age {age})",
                    )
                    db.add(log)
        await db.commit()


def start_scheduler():
    scheduler.add_job(check_reminders, "cron", hour=8, minute=0, id="daily_reminders")
    scheduler.add_job(check_birthdays, "cron", hour=9, minute=0, id="daily_birthdays")
    scheduler.start()
    logger.info("Scheduler started — checks run at 08:00 and 09:00 daily.")
