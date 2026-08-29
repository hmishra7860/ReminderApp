from pydantic import BaseModel, EmailStr, Field
from datetime import date as dt_date , datetime
from typing import Optional
from models.models import CategoryEnum
from enum import Enum

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
    date: dt_date
    time: Optional[str] = None
    recurrence: Optional[str] = None  # Default to "none" if not provided


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[CategoryEnum] = None
    date: Optional[dt_date] = None
    time: Optional[str] = None
    recurrence: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Birthday ─────────────────────────────────────────────────────────────────
class BirthdayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None
    date_of_birth: dt_date
    custom_message: Optional[str] = None


class BirthdayCreate(BirthdayBase):
    pass


class BirthdayResponse(BirthdayBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Add to backend/models/schemas.py
class UserSmtpUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_pass: Optional[str] = None
    from_email: Optional[str] = None

# Update UserResponse to return these fields to the frontend
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    from_email: Optional[str] = None
    # Intentionally excluding smtp_pass for security
    model_config = {"from_attributes": True}



#------------------------Recurrence Enum------------------------
# class RecurrenceEnum(str, Enum):
#     none = "none"
#     daily = "daily"
#     weekly = "weekly"
#     monthly = "monthly"
#     yearly = "yearly"

# class ReminderCreate(BaseModel):
#     title: str = Field(..., min_length=1, max_length=255)
#     description: Optional[str] = None
#     category: CategoryEnum = CategoryEnum.Personal
#     recurrence: RecurrenceEnum = RecurrenceEnum.none
#     date: date
#     time: Optional[str] = None

# class RemiderResponse(ReminderCreate):
#     id: int

#     class Config:
#         orm_mode = True 



