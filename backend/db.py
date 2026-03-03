import os
import aiosqlite

# Use persistent storage on Fly.io / HF Spaces, local file otherwise
if os.environ.get("FLY_APP_NAME") or os.environ.get("SPACE_ID"):
    DB_PATH = "/data/responses.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "responses.db")


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    return db


async def init_db():
    os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)
    db = await get_db()
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                email TEXT DEFAULT '',
                expertise TEXT,
                colorblind INTEGER DEFAULT 0,
                device TEXT,
                cb_redgreen TEXT DEFAULT '',
                cb_blueyellow TEXT DEFAULT '',
                trials TEXT,
                completed INTEGER DEFAULT 0
            )
        """)
        # Migrate existing DB if columns are missing
        for col, definition in [
            ("email",    "TEXT DEFAULT ''"),
            ("feedback", "TEXT DEFAULT ''"),
        ]:
            try:
                await db.execute(f"ALTER TABLE sessions ADD COLUMN {col} {definition}")
                await db.commit()
            except Exception:
                pass  # column already exists
        await db.execute("""
            CREATE TABLE IF NOT EXISTS responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                trial_index INTEGER,
                image_id TEXT,
                image_path TEXT,
                method TEXT,
                variant TEXT,
                dataset TEXT,
                base_id TEXT,
                label TEXT,
                response TEXT,
                correct INTEGER,
                response_time_ms INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()
    finally:
        await db.close()
