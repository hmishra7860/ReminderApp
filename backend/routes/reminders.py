from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database.db import get_db
from models.models import Reminder, User
from models.schemas import ReminderCreate, ReminderResponse, ReminderUpdate
from routes.auth import get_current_user

router = APIRouter()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(payload: ReminderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = Reminder(**payload.model_dump(), user_id=current_user.id)
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.get("", response_model=List[ReminderResponse])
async def list_reminders(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Reminder).where(Reminder.user_id == current_user.id).order_by(Reminder.date, Reminder.time))
    return result.scalars().all()


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(reminder_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = await db.get(Reminder, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    if reminder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this reminder")   
    return reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: int, payload: ReminderUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = await db.get(Reminder, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    if reminder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this reminder")   
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(reminder_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = await db.get(Reminder, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    if reminder.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the owner of this reminder")
    await db.delete(reminder)
    await db.commit()
