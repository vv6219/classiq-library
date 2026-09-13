import sqlite3
from collections import defaultdict

conn = sqlite3.connect('DispatchEngine/dispatchengine.db')
cur = conn.cursor()

# Query all execution runs with their scenario order count
query = """
SELECT r.run_id, r.scenario_id, r.wave_id, s.order_count, s.fleet_size, r.operational_mode, r.total_makespan_sec, r.created_datetime
FROM execution_runs r
JOIN scenarios s ON r.scenario_id = s.scenario_id
ORDER BY s.order_count, r.created_datetime DESC
"""

rows = cur.execute(query).fetchall()
print(f"Total runs before deduplication: {len(rows)}")

by_order_count = defaultdict(list)
for r in rows:
    run_id, scen_id, wave_id, order_count, fleet, mode, makespan, created = r
    by_order_count[order_count].append(r)

runs_to_keep = []
runs_to_delete = []

for order_count in sorted(by_order_count.keys()):
    rlist = by_order_count[order_count]
    # Keep the latest run (rlist[0] since sorted by created_datetime DESC)
    # However, if there are multiple modes (e.g. QUANTUM vs CLASSICAL), let's check:
    # We saw earlier that ALL runs are QUANTUM.
    # For order count 60, let's see if RUN-7D42F06D or latest is preferred:
    # Actually, let's keep the latest completed run for each order count:
    keep = rlist[0]
    # But wait, is RUN-7D42F06D the canonical benchmark scenario?
    # If rlist has RUN-7D42F06D, let's see if keeping the latest run or the benchmark is better.
    # The latest run for 60 orders is RUN-39D6EFAF (created 2026-09-13 14:32:21).
    runs_to_keep.append(keep[0])
    for drop in rlist[1:]:
        runs_to_delete.append(drop[0])
    print(f"Order Count {order_count}: KEEP {keep[0]} (makespan: {keep[6]}, created: {keep[7]}), DELETE {len(rlist)-1} duplicates")

print(f"\nTotal runs to keep: {len(runs_to_keep)}")
print(f"Total runs to delete: {len(runs_to_delete)}")
