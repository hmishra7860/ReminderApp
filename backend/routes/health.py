from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(datetime.timezone.utc).isoformat()}


@router.get("/")
async def root():
    return {"message": "ReminderCal API", "docs": "/docs"}
