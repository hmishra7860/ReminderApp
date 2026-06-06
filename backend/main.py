from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from routes import reminders, birthdays, health, auth

from database.db import engine, Base
from routes import reminders, birthdays, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="ReminderCal API",
    description="Backend API for ReminderCal — reminders & birthday notifications",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",       # For Docker Nginx
        "http://localhost:3000",  # For local testing
    ],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ────────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(reminders.router, prefix="/reminders", tags=["Reminders"])
app.include_router(birthdays.router, prefix="/birthdays", tags=["Birthdays"])
app.include_router(health.router, tags=["Health"])

# ─── Prometheus metrics ────────────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app)
