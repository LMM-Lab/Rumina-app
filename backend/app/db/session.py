# backend/db/session.py
from pathlib import Path

from asyncpg import Pool, create_pool
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_URL: str

    class Config:
        env_file = "/workspace/backend/app/db/.env"


settings = Settings()
_pool: Pool | None = None


async def get_pool() -> Pool:
    global _pool
    if _pool is None:
        _pool = await create_pool(dsn=settings.DB_URL, min_size=2, max_size=10)
    return _pool
