"""Database manager supporting native sqlite3 and optional SQLAlchemy."""

from __future__ import annotations
import sqlite3
from pathlib import Path
from typing import Optional, Any
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
                open_window_start REAL NOT NULL,
                drop_deadline REAL NOT NULL,
                is_atomic INTEGER NOT NULL,
                hazard_class TEXT,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id)
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
                FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id)
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
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id)
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
                FOREIGN KEY (run_id) REFERENCES execution_runs(run_id)
            );
        """)
        conn.commit()
        conn.close()

    @classmethod
    def close_session(cls, session_or_conn: Any):
        if session_or_conn is not None:
            try:
                session_or_conn.close()
            except Exception:
                pass
