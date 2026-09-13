import sqlite3
import json
from pathlib import Path

db_path = Path('DispatchEngine/dispatchengine.db')
print("DB Exists:", db_path.exists())
conn = sqlite3.connect(str(db_path))
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

for t in tables:
    if t == 'sqlite_sequence':
        continue
    cnt = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"Table '{t}': {cnt} rows")

# Let's inspect dispatch_runs / waves / orders
print("\n--- Columns in dispatch_runs / scenarios ---")
for t in tables:
    cur.execute(f"PRAGMA table_info({t});")
    cols = [r[1] for r in cur.fetchall()]
    print(f"{t}: {cols}")
