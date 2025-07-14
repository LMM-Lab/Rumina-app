from db.session import get_pool
from fastapi import APIRouter

router = APIRouter()


@router.get("/healthz")
async def health_check():
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchval("SELECT 1;")
    return {"db": result}


@router.get("/tables")
async def list_tables():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        """
        )
    return [
        {"schema": row["table_schema"], "name": row["table_name"]}
        for row in rows
    ]
