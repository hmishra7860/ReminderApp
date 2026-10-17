from datetime import IST, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(IST).isoformat()}


@router.get("/")
async def root():
    return {"message": "ReminderCal API", "docs": "/docs"}
