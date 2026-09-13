import sqlite3
import shutil
from pathlib import Path

db_paths = [
    Path("DispatchEngine/dispatchengine.db"),
    Path("web_simulator/public/dispatchengine.db"),
]

for p in db_paths:
    if not p.exists():
        continue
    conn = sqlite3.connect(str(p))
    cur = conn.cursor()
    cols = [c[1] for c in cur.execute("PRAGMA table_info(execution_runs)").fetchall()]
    if "mode" not in cols:
        cur.execute("ALTER TABLE execution_runs ADD COLUMN mode TEXT NOT NULL DEFAULT '32Q'")
    
    # Set mode to 32Q for QUANTUM and CPU for CLASSICAL
    cur.execute("UPDATE execution_runs SET mode = '32Q' WHERE operational_mode = 'QUANTUM' OR mode = 'CPU/32Q'")
    cur.execute("UPDATE execution_runs SET mode = 'CPU' WHERE operational_mode = 'CLASSICAL'")
    conn.commit()

    print(f"Updated {p}:")
    for r in cur.execute("SELECT run_id, mode, operational_mode FROM execution_runs").fetchall():
        print(" ", r)
    conn.close()

dist_db = Path("web_simulator/dist/dispatchengine.db")
if dist_db.parent.exists():
    shutil.copy2("web_simulator/public/dispatchengine.db", str(dist_db))
    print("Copied to dist/dispatchengine.db")

print("Migration to 32Q / CPU completed.")
