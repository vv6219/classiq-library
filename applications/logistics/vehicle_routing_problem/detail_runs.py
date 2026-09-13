import sqlite3

conn = sqlite3.connect('DispatchEngine/dispatchengine.db')
cur = conn.cursor()

# Check runs for 60 orders
runs_60 = cur.execute("""
SELECT r.run_id, r.scenario_id, r.total_makespan_sec, r.total_distance_km, r.created_datetime, r.timestamp
FROM execution_runs r
JOIN scenarios s ON r.scenario_id = s.scenario_id
WHERE s.order_count = 60
ORDER BY r.created_datetime DESC
""").fetchall()

print(f"Total runs for 60 orders: {len(runs_60)}")
print("First 5 (latest):")
for r in runs_60[:5]:
    print(r)
print("Last 5 (oldest):")
for r in runs_60[-5:]:
    print(r)

# Check all order counts and their runs
all_order_counts = cur.execute("""
SELECT DISTINCT s.order_count
FROM execution_runs r
JOIN scenarios s ON r.scenario_id = s.scenario_id
ORDER BY s.order_count
""").fetchall()

print("\n--- Distinct order counts with runs ---")
for (oc,) in all_order_counts:
    runs = cur.execute("""
    SELECT r.run_id, r.scenario_id, r.operational_mode, r.total_makespan_sec, r.created_datetime
    FROM execution_runs r
    JOIN scenarios s ON r.scenario_id = s.scenario_id
    WHERE s.order_count = ?
    ORDER BY r.created_datetime DESC
    """, (oc,)).fetchall()
    print(f"Order Count {oc}: {len(runs)} runs")
    for r in runs[:3]:
        print("   ", r)
    if len(runs) > 3:
        print(f"   ... and {len(runs)-3} older duplicate runs")
