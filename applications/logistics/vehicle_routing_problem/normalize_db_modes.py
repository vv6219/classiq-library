import sqlite3
import shutil
import os

db_path = os.path.abspath('DispatchEngine/dispatchengine.db')
pub_db = os.path.abspath('web_simulator/public/dispatchengine.db')
dist_db = os.path.abspath('web_simulator/dist/dispatchengine.db')

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Set all CPU/Classical runs
cur.execute("UPDATE execution_runs SET operational_mode = 'CLASSICAL', mode = 'CPU' WHERE mode = 'CPU' OR operational_mode = 'CLASSICAL'")

# Set all Quantum/32Q runs
cur.execute("UPDATE execution_runs SET operational_mode = 'QUANTUM', mode = '32Q' WHERE mode IN ('QUANTUM', '32Q') OR operational_mode = 'QUANTUM'")

conn.commit()
cur.execute("SELECT run_id, operational_mode, mode FROM execution_runs")
rows = cur.fetchall()
print(f"Total runs in execution_runs: {len(rows)}")
for r in rows:
    print(" ", r)
conn.close()

shutil.copy2(db_path, pub_db)
if os.path.exists(os.path.dirname(dist_db)):
    shutil.copy2(db_path, dist_db)
print("Successfully synced to public and dist databases!")
