import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL environment variable is missing. Cannot connect to the database entity.")
    sys.exit(1)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

#DATABASE_URL = os.getenv(
#    "DATABASE_URL",
#   "postgresql+asyncpg://rcal:rcalpass@postgres:5432/remindercal",
#)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
