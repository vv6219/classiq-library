import sqlite3
from collections import defaultdict

conn = sqlite3.connect('DispatchEngine/dispatchengine.db')
cur = conn.cursor()

query = """
SELECT r.run_id, r.scenario_id, s.order_count, s.fleet_size, r.operational_mode, r.total_makespan_sec, r.total_distance_km, r.created_datetime
FROM execution_runs r
LEFT JOIN scenarios s ON r.scenario_id = s.scenario_id
ORDER BY s.order_count, r.operational_mode, r.created_datetime DESC
"""

rows = cur.execute(query).fetchall()
print(f"Total execution runs: {len(rows)}")

by_order_count = defaultdict(list)
by_order_and_mode = defaultdict(list)
by_scenario = defaultdict(list)

for row in rows:
    run_id, scenario_id, order_count, fleet_size, mode, makespan, dist, created = row
    by_order_count[order_count].append(row)
    by_order_and_mode[(order_count, mode)].append(row)
    by_scenario[scenario_id].append(row)

print("\n--- Count of runs per order_count ---")
for oc, rlist in sorted(by_order_count.items(), key=lambda x: (x[0] is None, x[0])):
    print(f"Orders: {oc} -> {len(rlist)} runs")

print("\n--- Count of runs per (order_count, operational_mode) ---")
for (oc, mode), rlist in sorted(by_order_and_mode.items(), key=lambda x: (x[0][0] is None, x[0][0], x[0][1])):
    print(f"Orders: {oc}, Mode: {mode} -> {len(rlist)} runs")

print("\n--- Scenarios and run counts ---")
scen_query = """
SELECT s.scenario_id, s.order_count, s.fleet_size, s.name, count(r.run_id) as run_count
FROM scenarios s
LEFT JOIN execution_runs r ON s.scenario_id = r.scenario_id
GROUP BY s.scenario_id, s.order_count, s.fleet_size, s.name
ORDER BY s.order_count
"""
for row in cur.execute(scen_query).fetchall():
    print(f"Scen: {row[0]}, Orders: {row[1]}, Fleet: {row[2]}, Name: {row[3]}, Runs: {row[4]}")
