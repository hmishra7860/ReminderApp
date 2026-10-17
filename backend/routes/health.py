from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat()}


@router.get("/")
async def root():
    return {"message": "ReminderCal API", "docs": "/docs"}
