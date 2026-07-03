from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
# Import all routers in one go
from routes import reminders, birthdays, health, auth
from database.db import engine, Base
from services.scheduler import start_scheduler
import logging
logger = logging.getLogger(__name__)
logger.info("--- MAIN.PY IS LOADING ---")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # ADD THESE TWO PRINT STATEMENTS:
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!! LIFESPAN IS RUNNING - STARTING SCHEDULER !!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    
    logger.info("Lifespan: Starting scheduler...")
    start_scheduler() 
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
