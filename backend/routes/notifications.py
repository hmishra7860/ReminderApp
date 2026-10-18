from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from models.models import NotificationLog, Reminder, Birthday, User
from models.schemas import NotificationLogResponse
from routes.auth import get_current_user

router = APIRouter()

@router.get("", response_model=list[NotificationLogResponse])
async def list_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = (
        select(NotificationLog)
        .outerjoin(Reminder, NotificationLog.reminder_id == Reminder.id)
        .outerjoin(Birthday, NotificationLog.birthday_id == Birthday.id)
        .where(
            or_(
                Reminder.user_id == current_user.id,
                Birthday.user_id == current_user.id
            )
        )
        .order_by(NotificationLog.sent_at.desc())
        .limit(50)
    )
    result = await db.execute(query)
    return result.scalars().all()