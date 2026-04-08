import sqlite3
import os
import uuid
import time
from pathlib import Path

DB_PATH = Path.home() / ".morpheus" / "engine.db"

class MorpheusMemory:
    """
    SQLite Persistence Layer for the MORPHEUS Execution Engine.
    Tracks all unsealing sessions to measure physiological override progress.
    """
    def __init__(self):
        self._ensure_db()
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _ensure_db(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    def _init_tables(self):
        with self.conn:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    mode TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    duration_sec INTEGER NOT NULL,
                    axiom_used TEXT,
                    manifestation_notes TEXT
                )
            ''')
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_mode ON sessions(mode)")

    def log_session(self, mode: str, duration_sec: int, axiom_used: str = "", notes: str = ""):
        session_id = str(uuid.uuid4())
        timestamp = int(time.time())
        with self.conn:
            self.conn.execute(
                "INSERT INTO sessions (id, mode, timestamp, duration_sec, axiom_used, manifestation_notes) VALUES (?, ?, ?, ?, ?, ?)",
                (session_id, mode, timestamp, duration_sec, axiom_used, notes)
            )
        return session_id

    def get_stats(self) -> dict:
        cursor = self.conn.cursor()
        
        # Total sessions per mode
        cursor.execute("SELECT mode, COUNT(*) as count FROM sessions GROUP BY mode")
        mode_counts = {row['mode']: row['count'] for row in cursor.fetchall()}
        
        # Total overrides (all sessions combined)
        total = sum(mode_counts.values())

        # Last session
        cursor.execute("SELECT mode, timestamp FROM sessions ORDER BY timestamp DESC LIMIT 1")
        last_row = cursor.fetchone()
        last_session = None
        if last_row:
            from datetime import datetime
            dt = datetime.fromtimestamp(last_row['timestamp'])
            last_session = f"{last_row['mode']} at {dt.strftime('%Y-%m-%d %H:%M:%S')}"
            
        # Recent insights (last 5 notes where not empty)
        cursor.execute("SELECT timestamp, manifestation_notes FROM sessions WHERE manifestation_notes != '' ORDER BY timestamp DESC LIMIT 5")
        insights = []
        for row in cursor.fetchall():
            dt = datetime.fromtimestamp(row['timestamp']).strftime('%m-%d')
            insights.append(f"[{dt}] {row['manifestation_notes']}")

        return {
            "total_overrides": total,
            "mode_breakdown": mode_counts,
            "last_session": last_session,
            "recent_insights": insights
        }

    def close(self):
        self.conn.close()

if __name__ == "__main__":
    mem = MorpheusMemory()
    mem._init_tables()
    print(f"MORPHEUS Memory initialized at {DB_PATH}")
