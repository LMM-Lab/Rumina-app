import asyncio
import csv
import os
import sys
from pathlib import Path

import asyncpg

DB_DSN = os.getenv("DATABASE_URL", "postgresql://rumina:rumina@db:5432/rumina")
OUT_CSV = Path(__file__).parent / "logs" / "single_turns.csv"


async def export_single_turns():
    print(f"[DEBUG] DB_DSN = {DB_DSN}", file=sys.stderr)

    async with asyncpg.create_pool(dsn=DB_DSN) as pool:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM single_turns ORDER BY timestamp_utc"
            )

    if not rows:
        print("[INFO] No data to export.", file=sys.stderr)
        return

    # rows は Record のままだと後で参照しづらいので dict へ
    records = [dict(r) for r in rows]
    headers = list(records[0].keys())

    print(f"[DEBUG] First 2 rows: {records[:2]}", file=sys.stderr)
    print(f"[DEBUG] Total rows  : {len(records)}", file=sys.stderr)

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

    print(f"Exported {len(records)} rows to {OUT_CSV}")


if __name__ == "__main__":
    asyncio.run(export_single_turns())
