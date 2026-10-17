"""
Background scheduler – runs daily checks and sends emails.
Start alongside the FastAPI app using APScheduler.
"""
import logging
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database.db import AsyncSessionLocal
from models.models import Birthday, NotificationLog, Reminder
from services.email_service import send_birthday_email, send_reminder_email

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_reminders():
    print("=============================================")
    print("🚀 SCHEDULER TRIGGERED: Checking reminders...")
    print("=============================================")
    today = date.today()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Reminder).options(selectinload(Reminder.owner)).where(Reminder.date == today))
        reminders = result.scalars().all()
        
        # LOGGING: See how many reminders the system found
        logger.info(f"DEBUG: Found {len(reminders)} reminders for today.")
        
        for r in reminders:
            # NORMAL CODE: Using your original function name and loop variable
            success = send_reminder_email(r.owner, r.title, r.description, r.date, r.time)
            
            if success:
                logger.info(f"DEBUG: Reminder email for {r.title} passed to SMTP.")
                
                # Recurrence Rollover Logic
                if r.recurrence == "daily":
                    r.date = r.date + relativedelta(days=1)
                elif r.recurrence == "weekly":
                    r.date = r.date + relativedelta(weeks=1)
                elif r.recurrence == "monthly":
                    r.date = r.date + relativedelta(months=1)
                elif r.recurrence == "yearly":
                    r.date = r.date + relativedelta(years=1)
                else:
                    # One-time event, delete it
                    await db.delete(r)
                
                db.add(r)
            else:
                logger.error(f"DEBUG: Reminder email for {r.title} FAILED at SMTP.")
                
        # Commit all updates/deletes to PostgreSQL
        await db.commit()


async def check_birthdays():
    print("=============================================")
    print("🚀 SCHEDULER TRIGGERED: Checking birthdays...")
    print("=============================================")
    today = date.today()
    logger.info(f"DEBUG: Running birthday check for {today}")
    
    async with AsyncSessionLocal() as db:
        # Fetch birthdays with owner relationship
        result = await db.execute(select(Birthday).options(selectinload(Birthday.owner)))
        birthdays = result.scalars().all()
        
        if not birthdays:
            logger.info("DEBUG: No birthdays found in database.")

        for b in birthdays:
            dob = b.date_of_birth
            # Check if today is the birthday
            if dob.month == today.month and dob.day == today.day:
                age = today.year - dob.year
                logger.info(f"DEBUG: Found birthday for {b.name}, turning {age}")
                
                if b.email:
                    # Capture the result of the email send
                    sent = send_birthday_email(b.owner, b.email, b.name, age)
                    
                    if sent:
                        logger.info(f"DEBUG: Birthday email for {b.name} successfully sent to {b.email}")
                    else:
                        logger.error(f"DEBUG: Birthday email for {b.name} FAILED to send.")

                    # Log the attempt
                    log = NotificationLog(
                        birthday_id=b.id,
                        email=b.email,
                        status="sent" if sent else "failed",
                        message=f"Birthday wish for {b.name} (age {age})"
                    )
                    db.add(log)
                else:
                    logger.warning(f"DEBUG: Skipping {b.name} - No email address provided.")
        
        await db.commit()


def start_scheduler():
    if not scheduler.running:  # Prevents double-startup errors
        # ⚠️ FOR TESTING: Run BOTH every 1 minute
        scheduler.add_job(check_reminders, "interval", minutes=1, id="daily_reminders", replace_existing=True)
        scheduler.add_job(check_birthdays, "interval", minutes=1, id="daily_birthdays", replace_existing=True)
        scheduler.start()
    
    logger.info("Scheduler started — checking BOTH every 1 minute for testing.")

# --- USE THIS IN PRODUCTION INSTEAD ---
# def start_scheduler():
#     if not scheduler.running:
#         scheduler.add_job(check_reminders, "cron", hour=8, minute=0, id="daily_reminders", replace_existing=True)
#         scheduler.add_job(check_birthdays, "cron", hour=9, minute=0, id="daily_birthdays", replace_existing=True)
#         scheduler.start()
#     logger.info("Scheduler started — checks run at 08:00 and 09:00 daily.")