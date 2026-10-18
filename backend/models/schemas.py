from datetime import date as dt_date
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from models.models import CategoryEnum


# ─── Auth & User ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    enable_email_reminders: bool | None = None
    enable_birthday_emails: bool | None = None
    enable_daily_digest: bool | None = None
    reminder_timing: str | None = None

#class UserResponse(BaseModel):
#    id: int
#    full_name: str
#    email: EmailStr
#    created_at: datetime
#    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

# ─── Update ReminderCreate / BirthdayCreate ───────────────────────────────────
# Keep your existing Reminder/Birthday schemas, but ensure they don't ask 
# for user_id in the create payloads, as we will extract that from the JWT token.


# ─── Reminder ─────────────────────────────────────────────────────────────────
class ReminderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    category: CategoryEnum = CategoryEnum.Personal
    date: dt_date
    time: str | None = None
    recurrence: str | None = None  # Default to "none" if not provided


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category: CategoryEnum | None = None
    date: dt_date | None = None
    time: str | None = None
    recurrence: str | None = None

class ReminderResponse(ReminderBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Birthday ─────────────────────────────────────────────────────────────────
class BirthdayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str | None = None
    date_of_birth: dt_date
    custom_message: str | None = None


class BirthdayCreate(BirthdayBase):
    pass


class BirthdayResponse(BirthdayBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# Add to backend/models/schemas.py
class UserSmtpUpdate(BaseModel):
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_pass: str | None = None
    from_email: str | None = None

# Update UserResponse to return these fields to the frontend
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    from_email: str | None = None
    enable_email_reminders: bool = True
    enable_birthday_emails: bool = True
    enable_daily_digest: bool = False
    reminder_timing: str = "1 hour before"
    # Intentionally excluding smtp_pass for security
    model_config = {"from_attributes": True}


#------------------------Notifications---------------------------

class NotificationLogResponse(BaseModel):
    id: int
    reminder_id: int | None = None
    birthday_id: int | None = None
    email: str
    sent_at: datetime
    status: str
    message: str | None = None
    
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



