import sqlite3
import shutil
import os

canonical_runs = (
    'RUN-24762C2F',
    'RUN-9A551FDE',
    'RUN-DFF68DB1',
    'RUN-73F5EC70',
    'RUN-7BE4A77D',
    'RUN-7D42F06D',
    'RUN-00CE0A36',
    'RUN-48A114D5',
)

db_path = os.path.abspath('DispatchEngine/dispatchengine.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Identify non-canonical runs or any run with 0 orders
cur.execute(f"SELECT run_id, wave_id FROM execution_runs WHERE run_id NOT IN {canonical_runs}")
runs_to_delete = cur.fetchall()
print(f"Deleting {len(runs_to_delete)} non-canonical / 0-order runs: {runs_to_delete}")

# Inspect all tables and dynamically delete by run_id, wave_id, or scenario_id
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
all_tables = [r[0] for r in cur.fetchall() if not r[0].startswith('sqlite_')]

for rid, wid in runs_to_delete:
    print(f"Purging records for run {rid} (wave: {wid})...")
    # route_stops first
    cur.execute("DELETE FROM route_stops WHERE route_id IN (SELECT route_id FROM vehicle_routes WHERE run_id = ?)", (rid,))
    
    for t in all_tables:
        if t in ['route_stops', 'execution_runs', 'scenarios', 'orders']:
            continue
        cur.execute(f"PRAGMA table_info({t})")
        cols = [c[1] for c in cur.fetchall()]
        if 'run_id' in cols:
            cur.execute(f"DELETE FROM {t} WHERE run_id = ?", (rid,))
        elif 'wave_id' in cols and wid:
            cur.execute(f"DELETE FROM {t} WHERE wave_id = ?", (wid,))

    cur.execute("DELETE FROM execution_runs WHERE run_id = ?", (rid,))

# 2. Check and delete 0-order / invalid scenarios
cur.execute("DELETE FROM orders WHERE scenario_id = 'SCEN-EEE20266'")
cur.execute("DELETE FROM scenarios WHERE scenario_id = 'SCEN-EEE20266'")
cur.execute("DELETE FROM scenarios WHERE scenario_id NOT IN (SELECT DISTINCT scenario_id FROM orders) OR order_count = 0")

# Delete algorithm_benchmarks for deleted scenarios
cur.execute("DELETE FROM algorithm_benchmarks WHERE scenario_id NOT IN (SELECT scenario_id FROM scenarios)")

# Also delete any route_stops where route_id is orphan
cur.execute("DELETE FROM route_stops WHERE route_id NOT IN (SELECT route_id FROM vehicle_routes)")

conn.commit()
cur.execute("VACUUM")
conn.commit()

cur.execute("PRAGMA table_info(execution_runs)")
run_cols = [c[1] for c in cur.fetchall()]
print(f"execution_runs columns: {run_cols}")

# Select all columns
cur.execute("SELECT * FROM execution_runs")
remaining_runs = cur.fetchall()
print(f"\nRemaining execution_runs ({len(remaining_runs)}):")
for r in remaining_runs:
    print(" ", r)

# Verify route_stops count for each run
cur.execute("""
    SELECT r.run_id, COUNT(DISTINCT s.stop_id) as stop_count
    FROM execution_runs r
    LEFT JOIN vehicle_routes v ON r.run_id = v.run_id
    LEFT JOIN route_stops s ON v.route_id = s.route_id
    GROUP BY r.run_id
""")
stop_counts = cur.fetchall()
print("\nStops per run:")
for sc in stop_counts:
    print(f"  Run {sc[0]}: {sc[1]} stops")

conn.close()

# Copy to web_simulator/public/dispatchengine.db and web_simulator/dist/dispatchengine.db
public_db = os.path.abspath('web_simulator/public/dispatchengine.db')
dist_db = os.path.abspath('web_simulator/dist/dispatchengine.db')

shutil.copyfile(db_path, public_db)
print(f"\nSynced to {public_db}")

if os.path.exists(os.path.dirname(dist_db)):
    shutil.copyfile(db_path, dist_db)
    print(f"Synced to {dist_db}")
