from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import date, datetime  # <-- Added datetime here
import logging
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database.db import AsyncSessionLocal
from models.models import Reminder, Birthday, NotificationLog
from services.email_service import send_birthday_email, send_reminder_email

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def check_reminders():
    today = date.today()
    # Get the current time formatted as HH:MM (e.g., "14:30")
    current_time_str = datetime.now().strftime("%H:%M")
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Reminder)
            .options(selectinload(Reminder.owner))
            .where(Reminder.date == today)
        )
        reminders = result.scalars().all()
        for r in reminders:
            # Send if the exact time matches, OR if no time is set and it is exactly 08:00 AM
            if r.time == current_time_str or (not r.time and current_time_str == "08:00"):
                logger.info(f"Sending scheduled reminder: {r.title} at {current_time_str}")
                send_reminder_email(r.owner, r.title, r.description, r.date, r.time)

async def check_birthdays():
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Birthday).options(selectinload(Birthday.owner)))
        birthdays = result.scalars().all()
        for b in birthdays:
            dob = b.date_of_birth
            if dob.month == today.month and dob.day == today.day:
                age = today.year - dob.year
                logger.info(f"Birthday today: {b.name} turns {age}")
                if b.email:
                    sent = send_birthday_email(b.owner, b.email, b.name, age)
                    # Log notification
                    log = NotificationLog(
                        user_id=b.owner.id,
                        type="birthday",
                        target_email=b.email,
                        status="sent" if sent else "failed"
                    )
                    db.add(log)
        await db.commit()

def start_scheduler():
    # 1. Reminders: Check every 1 minute so we catch the exact HH:MM times
    scheduler.add_job(check_reminders, "interval", minutes=1, id="exact_time_reminders", replace_existing=True)
    
    # 2. Birthdays: Revert to running just once a day at 09:00 AM
    scheduler.add_job(check_birthdays, "cron", hour=24, minute=0, id="daily_birthdays", replace_existing=True)
    
    scheduler.start()
    logger.info("Scheduler started — checking exact times for reminders.")