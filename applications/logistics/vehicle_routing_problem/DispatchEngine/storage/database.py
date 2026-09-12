"""Database manager supporting native sqlite3 and optional SQLAlchemy."""

from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Optional, Any, Dict, List
from DispatchEngine.config import DEFAULT_CONFIG

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False


class DatabaseManager:
    _engine = None
    _session_factory = None
    _sqlite_conn = None

    @classmethod
    def get_connection(cls, db_path: Optional[Path] = None) -> sqlite3.Connection:
        path = db_path or DEFAULT_CONFIG.db.sqlite_db_path
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def get_session(cls, db_path: Optional[Path] = None) -> Any:
        if HAS_SQLALCHEMY:
            if cls._session_factory is None:
                path = db_path or DEFAULT_CONFIG.db.sqlite_db_path
                path.parent.mkdir(parents=True, exist_ok=True)
                db_url = f"sqlite:///{path}"
                cls._engine = create_engine(
                    db_url,
                    echo=DEFAULT_CONFIG.db.echo_sql,
                    connect_args={"check_same_thread": False},
                )
                cls._session_factory = sessionmaker(bind=cls._engine, autoflush=False, autocommit=False)
            return cls._session_factory()
        else:
            return cls.get_connection(db_path)

    @classmethod
    def init_schema(cls, db_path: Optional[Path] = None):
        """Create tables in SQLite directly or via SQLAlchemy metadata."""
        if HAS_SQLALCHEMY:
            try:
                from DispatchEngine.storage.models import Base
                if cls._engine is None:
                    cls.get_session(db_path)
                Base.metadata.create_all(cls._engine)
                return
            except Exception:
                pass

        # Native SQLite DDL
        conn = cls.get_connection(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                scenario_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                name TEXT NOT NULL,
                archetype TEXT NOT NULL DEFAULT 'PARETO_HOT_ZONE',
                random_seed INTEGER NOT NULL,
                order_count INTEGER NOT NULL,
                fleet_size INTEGER NOT NULL,
                depot_count INTEGER NOT NULL,
                chute_count INTEGER NOT NULL,
                is_mock_data INTEGER NOT NULL,
                topology_metadata TEXT NOT NULL
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id TEXT NOT NULL,
                order_id TEXT NOT NULL,
                sku_id TEXT NOT NULL,
                depot_id TEXT NOT NULL,
                aisle_id TEXT NOT NULL,
                pickup_x REAL NOT NULL,
                pickup_y REAL NOT NULL,
                pickup_z REAL NOT NULL,
                drop_chute_id TEXT NOT NULL,
                mass_kg REAL NOT NULL,
                volume_m3 REAL NOT NULL,
                dim_l REAL NOT NULL DEFAULT 0.4,
                dim_w REAL NOT NULL DEFAULT 0.3,
                dim_h REAL NOT NULL DEFAULT 0.2,
                open_window_start REAL NOT NULL,
                drop_deadline REAL NOT NULL,
                is_atomic INTEGER NOT NULL DEFAULT 1,
                hazard_class TEXT DEFAULT 'NONE',
                sla_priority INTEGER DEFAULT 1,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_runs (
                run_id TEXT PRIMARY KEY,
                scenario_id TEXT NOT NULL,
                wave_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                operational_mode TEXT NOT NULL,
                algorithm_ranks_used TEXT NOT NULL,
                total_makespan_sec REAL NOT NULL,
                total_distance_km REAL NOT NULL,
                chute_variance REAL NOT NULL,
                sla_violations_count INTEGER DEFAULT 0,
                total_solve_latency_sec REAL NOT NULL,
                falsification_ratio_phi REAL NOT NULL,
                is_falsified INTEGER DEFAULT 0,
                verification_code TEXT NOT NULL DEFAULT 'lmn',
                FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicle_routes (
                route_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                vehicle_id TEXT NOT NULL,
                origin_depot_id TEXT NOT NULL,
                destination_depot_id TEXT NOT NULL,
                tour_length_m REAL NOT NULL,
                route_makespan_sec REAL NOT NULL,
                total_carried_mass_kg REAL NOT NULL,
                total_carried_volume_m3 REAL NOT NULL,
                volume_utilization_pct REAL NOT NULL,
                battery_consumed_pct REAL NOT NULL,
                stops_count INTEGER NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS route_stops (
                stop_id TEXT PRIMARY KEY,
                route_id TEXT NOT NULL,
                stop_sequence INTEGER NOT NULL,
                location_type TEXT NOT NULL,
                location_id TEXT NOT NULL,
                pos_x REAL NOT NULL,
                pos_y REAL NOT NULL,
                pos_z REAL NOT NULL,
                arrival_time_sec REAL NOT NULL,
                departure_time_sec REAL NOT NULL,
                service_duration_sec REAL NOT NULL,
                action TEXT NOT NULL,
                order_ids_json TEXT NOT NULL,
                FOREIGN KEY (route_id) REFERENCES vehicle_routes(route_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS container_placements (
                placement_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                vehicle_id TEXT NOT NULL,
                order_id TEXT NOT NULL,
                sku_id TEXT NOT NULL,
                pos_x REAL NOT NULL,
                pos_y REAL NOT NULL,
                pos_z REAL NOT NULL,
                dim_l REAL NOT NULL,
                dim_w REAL NOT NULL,
                dim_h REAL NOT NULL,
                mass_kg REAL NOT NULL,
                extraction_sequence INTEGER NOT NULL,
                support_surface_ratio REAL NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lifo_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                vehicle_id TEXT NOT NULL,
                blocking_order_id TEXT NOT NULL,
                blocked_order_id TEXT NOT NULL,
                contact_area_m2 REAL NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS gate_validations (
                validation_id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                gate_number INTEGER NOT NULL,
                gate_name TEXT NOT NULL,
                status TEXT NOT NULL,
                falsification_ratio_phi REAL,
                verification_code TEXT NOT NULL DEFAULT 'lmn',
                violations_count INTEGER DEFAULT 0,
                details_json TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_events (
                event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                log_level TEXT NOT NULL,
                logger_name TEXT NOT NULL,
                trace_id TEXT NOT NULL,
                span_id TEXT NOT NULL,
                wave_id TEXT,
                vehicle_id TEXT,
                message TEXT NOT NULL,
                attributes_json TEXT,
                error_stack TEXT
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chute_flow_dynamics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                chute_id TEXT NOT NULL,
                time_sec REAL NOT NULL,
                accumulated_volume_m3 REAL NOT NULL,
                inflow_rate_m3_s REAL NOT NULL,
                clearance_status TEXT NOT NULL DEFAULT 'NORMAL',
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS algorithm_benchmarks (
                benchmark_id TEXT PRIMARY KEY,
                scenario_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                fifo_makespan_sec REAL NOT NULL,
                kmeans_makespan_sec REAL NOT NULL,
                sc_qfcm_makespan_sec REAL NOT NULL,
                classiq_makespan_sec REAL NOT NULL,
                makespan_improvement_pct REAL NOT NULL,
                distance_improvement_pct REAL NOT NULL,
                falsification_ratio_phi REAL NOT NULL,
                verification_code TEXT NOT NULL DEFAULT 'lmn',
                FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tier_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                tier_number INTEGER NOT NULL,
                algorithm_rank TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                iterations_count INTEGER DEFAULT 1,
                status TEXT NOT NULL,
                benders_cuts_generated TEXT,
                output_summary TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quantum_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                backend_name TEXT NOT NULL,
                circuit_width_qubits INTEGER NOT NULL,
                circuit_depth INTEGER NOT NULL,
                cx_gate_count INTEGER NOT NULL,
                sampled_bitstrings_count INTEGER NOT NULL,
                variational_energy REAL NOT NULL,
                quantum_speedup_ratio REAL,
                execution_time_ms REAL NOT NULL,
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
            );
        """)

        # Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_scenario ON orders(scenario_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_runs_scenario ON execution_runs(scenario_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_routes_run ON vehicle_routes(run_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stops_route ON route_stops(route_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_placements_run ON container_placements(run_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lifo_run ON lifo_dependencies(run_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_gates_run ON gate_validations(run_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_trace ON telemetry_events(trace_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_level ON telemetry_events(log_level);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chutes_run ON chute_flow_dynamics(run_id);")

        conn.commit()
        conn.close()

    @classmethod
    def close_session(cls, session_or_conn: Any):
        if session_or_conn is not None:
            try:
                session_or_conn.close()
            except Exception:
                pass
