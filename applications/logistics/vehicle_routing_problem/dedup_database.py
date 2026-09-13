import sqlite3
import shutil
from pathlib import Path

db_file = Path('DispatchEngine/dispatchengine.db')
backup_file = Path('DispatchEngine/dispatchengine.db.bak')

print(f"Creating backup: {backup_file}")
shutil.copy2(db_file, backup_file)

conn = sqlite3.connect(str(db_file))
cur = conn.cursor()

# Enable foreign keys
cur.execute("PRAGMA foreign_keys = ON;")

# Canonical distinct run per order count
canonical_runs = {
    5: 'RUN-24762C2F',
    8: 'RUN-9A551FDE',
    15: 'RUN-DFF68DB1',
    20: 'RUN-73F5EC70',
    25: 'RUN-7BE4A77D',
    60: 'RUN-7D42F06D',
    80: 'RUN-933D5052',
    101: 'RUN-00CE0A36',
    150: 'RUN-48A114D5',
}

runs_to_keep = set(canonical_runs.values())
print("Canonical runs to keep:", runs_to_keep)

# Verify all canonical runs exist in execution_runs
existing_runs = set(r[0] for r in cur.execute("SELECT run_id FROM execution_runs").fetchall())
missing = runs_to_keep - existing_runs
if missing:
    print(f"Warning: missing runs: {missing}")
    # If any is missing, check why
    for m in missing:
        alt = cur.execute("SELECT run_id FROM execution_runs WHERE run_id LIKE ? OR scenario_id LIKE ?", (f"%{m}%", f"%{m}%")).fetchall()
        print(f"Alts for {m}: {alt}")

all_runs_query = "SELECT run_id, wave_id, scenario_id FROM execution_runs"
all_runs = cur.execute(all_runs_query).fetchall()
print(f"Total existing runs in DB: {len(all_runs)}")

runs_to_delete = [r[0] for r in all_runs if r[0] not in runs_to_keep]
waves_to_delete = [r[1] for r in all_runs if r[0] not in runs_to_keep and r[1]]
print(f"Runs to delete: {len(runs_to_delete)}")
print(f"Waves to delete: {len(waves_to_delete)}")

# 1. Update produced_reports to point to RUN-7D42F06D
cur.execute("UPDATE produced_reports SET run_id = 'RUN-7D42F06D' WHERE run_id != 'RUN-7D42F06D';")
print("Updated produced_reports to link to canonical run.")

# 2. Get route_ids to delete
placeholders = ','.join('?' for _ in runs_to_delete)
routes_query = f"SELECT route_id FROM vehicle_routes WHERE run_id IN ({placeholders})"
routes_to_delete = [r[0] for r in cur.execute(routes_query, runs_to_delete).fetchall()]
print(f"Vehicle routes to delete: {len(routes_to_delete)}")

# 3. Delete from route_stops
if routes_to_delete:
    r_placeholders = ','.join('?' for _ in routes_to_delete)
    del_stops = cur.execute(f"DELETE FROM route_stops WHERE route_id IN ({r_placeholders})", routes_to_delete).rowcount
    print(f"Deleted {del_stops} route_stops.")

# 4. Delete from vehicle_routes
del_routes = cur.execute(f"DELETE FROM vehicle_routes WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_routes} vehicle_routes.")

# 5. Delete from tier_executions
del_tiers = cur.execute(f"DELETE FROM tier_executions WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_tiers} tier_executions.")

# 6. Delete from quantum_telemetry
del_q = cur.execute(f"DELETE FROM quantum_telemetry WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_q} quantum_telemetry.")

# 7. Delete from container_placements
del_cp = cur.execute(f"DELETE FROM container_placements WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_cp} container_placements.")

# 8. Delete from lifo_dependencies
del_lifo = cur.execute(f"DELETE FROM lifo_dependencies WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_lifo} lifo_dependencies.")

# 9. Delete from gate_validations
del_gate = cur.execute(f"DELETE FROM gate_validations WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_gate} gate_validations.")

# 10. Delete from chute_flow_dynamics
del_chute = cur.execute(f"DELETE FROM chute_flow_dynamics WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_chute} chute_flow_dynamics.")

# 11. Delete from telemetry_events
if waves_to_delete:
    w_placeholders = ','.join('?' for _ in waves_to_delete)
    del_telem = cur.execute(f"DELETE FROM telemetry_events WHERE wave_id IN ({w_placeholders})", waves_to_delete).rowcount
    print(f"Deleted {del_telem} telemetry_events.")

# 12. Delete from execution_runs
del_runs = cur.execute(f"DELETE FROM execution_runs WHERE run_id IN ({placeholders})", runs_to_delete).rowcount
print(f"Deleted {del_runs} execution_runs.")

# 13. Clean up orphaned test scenarios with 0 runs
kept_scenarios = set(r[0] for r in cur.execute("SELECT DISTINCT scenario_id FROM execution_runs").fetchall())
# Also keep benchmark scenarios
benchmark_scenarios = {'SCEN-7D42F06D', 'SCEN-00CE0A36', 'SCEN-7BE4A77D', 'SCEN-A5777BBF', 'SCEN-C478110A', 'SCEN-08AD80F2', 'SCEN-1B64274B', 'SCEN-EF6DBAE3', 'SCEN-45C0E700', 'SCEN-CLIENT-GEN-999', 'SCEN-D148745B', 'SCEN-48A114D5'}
all_keep_scen = kept_scenarios | benchmark_scenarios

scen_to_delete = cur.execute(f"SELECT scenario_id FROM scenarios WHERE scenario_id NOT IN ({','.join('?' for _ in all_keep_scen)})", list(all_keep_scen)).fetchall()
scen_ids_to_delete = [s[0] for s in scen_to_delete]
if scen_ids_to_delete:
    s_placeholders = ','.join('?' for _ in scen_ids_to_delete)
    del_orders = cur.execute(f"DELETE FROM orders WHERE scenario_id IN ({s_placeholders})", scen_ids_to_delete).rowcount
    del_scen = cur.execute(f"DELETE FROM scenarios WHERE scenario_id IN ({s_placeholders})", scen_ids_to_delete).rowcount
    print(f"Deleted {del_scen} orphaned scenarios and {del_orders} orphaned orders.")

conn.commit()

# Run VACUUM to shrink file and optimize
print("Running VACUUM...")
cur.execute("VACUUM;")
conn.close()

print("\n--- Verification of remaining database ---")
conn = sqlite3.connect(str(db_file))
cur = conn.cursor()

tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall() if r[0] != 'sqlite_sequence']
for t in tables:
    cnt = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {cnt} rows")

print("\nRemaining Execution Runs:")
remaining = cur.execute("""
SELECT r.run_id, r.scenario_id, s.order_count, s.fleet_size, r.total_makespan_sec, r.total_distance_km
FROM execution_runs r
LEFT JOIN scenarios s ON r.scenario_id = s.scenario_id
ORDER BY s.order_count
""").fetchall()
for rem in remaining:
    print(f"  Run: {rem[0]} | Scen: {rem[1]} | Orders: {rem[2]} | Fleet: {rem[3]} | Makespan: {rem[4]}s | Dist: {rem[5]}km")

conn.close()

# Copy to web_simulator/public/dispatchengine.db and dist
public_db = Path('web_simulator/public/dispatchengine.db')
if public_db.parent.exists():
    shutil.copy2(db_file, public_db)
    print(f"\nSynced to {public_db} ({public_db.stat().st_size} bytes)")

dist_db = Path('web_simulator/dist/dispatchengine.db')
if dist_db.parent.exists():
    shutil.copy2(db_file, dist_db)
    print(f"Synced to {dist_db} ({dist_db.stat().st_size} bytes)")

print("\nDeduplication completed successfully!")
