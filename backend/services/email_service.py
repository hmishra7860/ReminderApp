"""
Email notification service.
Configured via environment variables:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
import logging
from models.models import User

logger = logging.getLogger(__name__)

def _send(to: str, subject: str, html: str, user: User) -> bool:
    if not user.smtp_user or not user.smtp_pass or not user.smtp_host:
        logger.warning(f"SMTP credentials not configured for user {user.email} – email not sent.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ReminderCal <{user.from_email or user.smtp_user}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        
        with smtplib.SMTP(user.smtp_host, user.smtp_port or 587) as server:
            server.starttls()
            server.login(user.smtp_user, user.smtp_pass)
            server.sendmail(user.from_email or user.smtp_user, to, msg.as_string())
            
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False

def send_reminder_email(user: User, title: str, description: str, reminder_date: date, reminder_time: str = "") -> bool:
    subject = f"⏰ Reminder: {title}"
    time_str = f" at {reminder_time}" if reminder_time else ""
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px">
      <div style="background:#2563EB;color:#fff;padding:20px 28px;border-radius:10px;margin-bottom:24px">
        <h1 style="margin:0;font-size:20px">⏰ ReminderCal</h1>
      </div>
      <h2 style="color:#0f172a">{title}</h2>
      <p style="color:#475569">{description or 'You have an upcoming reminder.'}</p>
      <p style="background:#EFF6FF;border-left:4px solid #2563EB;padding:12px 16px;border-radius:0 8px 8px 0;color:#1e40af">
        📅 {reminder_date.strftime('%B %d, %Y')}{time_str}
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
      <p style="color:#94a3b8;font-size:12px">This reminder was sent by ReminderCal.</p>
    </div>"""
    return _send(user.email, subject, html, user)


def send_birthday_email(user: User, to_email: str, name: str, age: int) -> bool:
    subject = f"🎂 Happy Birthday, {name}!"
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fdf2f8;padding:32px;border-radius:12px">
      <div style="background:#EC4899;color:#fff;padding:20px 28px;border-radius:10px;margin-bottom:24px">
        <h1 style="margin:0;font-size:20px">🎂 ReminderCal</h1>
      </div>
      <h2 style="color:#0f172a">Happy Birthday, {name}! 🎉</h2>
      <p style="color:#475569;font-size:16px">Wishing you a wonderful {age}{'st' if age%10==1 and age!=11 else 'nd' if age%10==2 and age!=12 else 'rd' if age%10==3 and age!=13 else 'th'} birthday!</p>
      <p style="background:#FDF2F8;border-left:4px solid #EC4899;padding:12px 16px;border-radius:0 8px 8px 0;color:#9d174d">
        May this year bring you joy, health, and everything you wish for! 🥳
      </p>
      <hr style="border:none;border-top:1px solid #fce7f3;margin:24px 0"/>
      <p style="color:#94a3b8;font-size:12px">Sent by ReminderCal • Birthday Wishes</p>
    </div>"""
    return _send(to_email, subject, html, user)
