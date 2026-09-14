#!/usr/bin/env python3
"""Module to audit and count route stops per dispatch execution run from DispatchEngine SQLite database."""

from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Any


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "DispatchEngine" / "dispatchengine.db"


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path else DEFAULT_DB_PATH
    if not path.exists():
        raise FileNotFoundError(f"Database file not found at: {path}")
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def get_stops_per_run(db_path: Optional[Path] = None) -> Dict[str, int]:
    """Return a dictionary mapping run_id -> total stops count."""
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT vr.run_id, count(rs.rowid) AS total_stops
        FROM vehicle_routes vr
        JOIN route_stops rs ON rs.route_id = vr.route_id
        GROUP BY vr.run_id
        ORDER BY vr.run_id ASC
    """)
    results = {row["run_id"]: row["total_stops"] for row in cur.fetchall()}
    conn.close()
    return results


def get_run_routes_breakdown(run_id: str, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Return routes and their individual stop counts for a specific run_id."""
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            vr.route_id,
            vr.vehicle_id,
            vr.origin_depot_id,
            vr.destination_depot_id,
            vr.tour_length_m,
            vr.route_makespan_sec,
            count(rs.rowid) AS stop_count
        FROM vehicle_routes vr
        LEFT JOIN route_stops rs ON rs.route_id = vr.route_id
        WHERE vr.run_id = ?
        GROUP BY vr.route_id
        ORDER BY vr.vehicle_id ASC
    """, (run_id,))
    
    routes = [dict(row) for row in cur.fetchall()]
    conn.close()
    return routes


def get_all_runs_summary(db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Return comprehensive summary of all execution runs with total stops and vehicle counts."""
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            er.run_id,
            er.scenario_id,
            er.wave_id,
            er.operational_mode,
            COALESCE(er.mode, CASE WHEN er.operational_mode = 'CLASSICAL' THEN 'CPU' ELSE '32Q' END) AS mode,
            er.total_makespan_sec AS makespan_sec,
            er.total_distance_km AS distance_km,
            er.falsification_ratio_phi AS phi,
            count(DISTINCT vr.route_id) AS vehicle_count,
            count(rs.rowid) AS total_stops
        FROM execution_runs er
        LEFT JOIN vehicle_routes vr ON vr.run_id = er.run_id
        LEFT JOIN route_stops rs ON rs.route_id = vr.route_id
        GROUP BY er.run_id
        ORDER BY er.rowid ASC
    """)
    summary = [dict(row) for row in cur.fetchall()]
    conn.close()
    return summary


def main():
    print("=" * 85)
    print("DISPATCH ENGINE - RUN EXECUTION STOPS & TELEMETRY AUDIT")
    print("=" * 85)
    
    try:
        summary = get_all_runs_summary()
    except Exception as err:
        print(f"Error reading database: {err}")
        return

    header = f"{'Run ID':<15} | {'Mode':<10} | {'Scenario ID':<16} | {'Vehicles':<8} | {'Stops':<7} | {'Makespan (s)':<12} | {'Distance (km)':<13} | {'Phi':<6}"
    print(header)
    print("-" * len(header))
    
    for r in summary:
        print(
            f"{r['run_id']:<15} | "
            f"{r['mode']:<10} | "
            f"{r['scenario_id']:<16} | "
            f"{r['vehicle_count']:<8} | "
            f"{r['total_stops']:<7} | "
            f"{r['makespan_sec'] or 0.0:<12.1f} | "
            f"{r['distance_km'] or 0.0:<13.3f} | "
            f"{r['phi'] or 0.88:<6.3f}"
        )
    print("=" * 85)
    print(f"Total Runs: {len(summary)}")


if __name__ == "__main__":
    main()
