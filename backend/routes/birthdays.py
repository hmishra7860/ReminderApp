from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database.db import get_db
from models.models import Birthday, User
from models.schemas import BirthdayCreate, BirthdayResponse
from routes.auth import get_current_user

router = APIRouter()


@router.post("", response_model=BirthdayResponse, status_code=status.HTTP_201_CREATED)
async def create_birthday(payload: BirthdayCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    birthday = Birthday(**payload.model_dump())
    db.add(birthday)
    await db.commit()
    await db.refresh(birthday)
    return birthday


@router.get("", response_model=List[BirthdayResponse])
async def list_birthdays(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Birthday).order_by(Birthday.name))
    return result.scalars().all()


@router.get("/{birthday_id}", response_model=BirthdayResponse)
async def get_birthday(birthday_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    birthday = await db.get(Birthday, birthday_id)
    if not birthday:
        raise HTTPException(status_code=404, detail="Birthday not found")
    return birthday


@router.delete("/{birthday_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_birthday(birthday_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    birthday = await db.get(Birthday, birthday_id)
    if not birthday:
        raise HTTPException(status_code=404, detail="Birthday not found")
    await db.delete(birthday)
    await db.commit()
