from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional
from models.models import CategoryEnum

# ─── Auth & User ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

# ─── Update ReminderCreate / BirthdayCreate ───────────────────────────────────
# Keep your existing Reminder/Birthday schemas, but ensure they don't ask 
# for user_id in the create payloads, as we will extract that from the JWT token.


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
