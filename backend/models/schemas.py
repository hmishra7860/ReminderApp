from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional
from models.models import CategoryEnum


# ─── Reminder ─────────────────────────────────────────────────────────────────
class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: CategoryEnum = CategoryEnum.Personal
    date: date
    time: Optional[str] = None


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[CategoryEnum] = None
    date: Optional[date] = None
    time: Optional[str] = None


class ReminderResponse(ReminderBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Birthday ─────────────────────────────────────────────────────────────────
class BirthdayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    date_of_birth: date


class BirthdayCreate(BirthdayBase):
    pass


class BirthdayResponse(BirthdayBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
