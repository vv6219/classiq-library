"""Data models supporting both SQLAlchemy ORM and lightweight dataclass records."""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List

try:
    from sqlalchemy import (
        Column,
        String,
        Integer,
        Float,
        Boolean,
        DateTime,
        ForeignKey,
        JSON,
    )
    from sqlalchemy.orm import declarative_base, relationship

    Base = declarative_base()

    class ScenarioRecord(Base):
        __tablename__ = "scenarios"

        scenario_id = Column(String(64), primary_key=True)
        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        name = Column(String(128), nullable=False)
        random_seed = Column(Integer, nullable=False)
        order_count = Column(Integer, nullable=False)
        fleet_size = Column(Integer, nullable=False)
        depot_count = Column(Integer, nullable=False)
        chute_count = Column(Integer, nullable=False)
        is_mock_data = Column(Boolean, default=True, nullable=False)
        topology_metadata = Column(JSON, nullable=False)

        orders = relationship("OrderRecord", back_populates="scenario", cascade="all, delete-orphan")
        runs = relationship("ExecutionRunRecord", back_populates="scenario")

    class OrderRecord(Base):
        __tablename__ = "orders"

        id = Column(Integer, primary_key=True, autoincrement=True)
        scenario_id = Column(String(64), ForeignKey("scenarios.scenario_id"), nullable=False)
        order_id = Column(String(64), nullable=False, index=True)
        sku_id = Column(String(64), nullable=False)
        depot_id = Column(String(32), nullable=False)
        aisle_id = Column(String(32), nullable=False)
        pickup_x = Column(Float, nullable=False)
        pickup_y = Column(Float, nullable=False)
        pickup_z = Column(Float, nullable=False)
        drop_chute_id = Column(String(32), nullable=False)
        mass_kg = Column(Float, nullable=False)
        volume_m3 = Column(Float, nullable=False)
        open_window_start = Column(Float, nullable=False)
        drop_deadline = Column(Float, nullable=False)
        is_atomic = Column(Boolean, default=True)
        hazard_class = Column(String(32), default="NONE")

        scenario = relationship("ScenarioRecord", back_populates="orders")

    class ExecutionRunRecord(Base):
        __tablename__ = "execution_runs"

        run_id = Column(String(64), primary_key=True)
        scenario_id = Column(String(64), ForeignKey("scenarios.scenario_id"), nullable=False)
        wave_id = Column(String(64), nullable=False, index=True)
        timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
        operational_mode = Column(String(32), nullable=False)
        algorithm_ranks_used = Column(JSON, nullable=False)
        total_makespan_sec = Column(Float, nullable=False)
        total_distance_km = Column(Float, nullable=False)
        chute_variance = Column(Float, nullable=False)
        sla_violations_count = Column(Integer, default=0)
        total_solve_latency_sec = Column(Float, nullable=False)
        falsification_ratio_phi = Column(Float, nullable=False)
        is_falsified = Column(Boolean, default=False)

        scenario = relationship("ScenarioRecord", back_populates="runs")
        tier_results = relationship("TierExecutionRecord", back_populates="run", cascade="all, delete-orphan")
        quantum_telemetry = relationship("QuantumTelemetryRecord", back_populates="run", uselist=False)

    class TierExecutionRecord(Base):
        __tablename__ = "tier_executions"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False)
        tier_number = Column(Integer, nullable=False)
        algorithm_rank = Column(String(64), nullable=False)
        latency_ms = Column(Float, nullable=False)
        iterations_count = Column(Integer, default=1)
        status = Column(String(32), nullable=False)
        benders_cuts_generated = Column(JSON, nullable=True)
        output_summary = Column(JSON, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="tier_results")

    class QuantumTelemetryRecord(Base):
        __tablename__ = "quantum_telemetry"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False)
        job_id = Column(String(64), nullable=False, index=True)
        backend_name = Column(String(64), nullable=False)
        circuit_width_qubits = Column(Integer, nullable=False)
        circuit_depth = Column(Integer, nullable=False)
        cx_gate_count = Column(Integer, nullable=False)
        sampled_bitstrings_count = Column(Integer, nullable=False)
        variational_energy = Column(Float, nullable=False)
        quantum_speedup_ratio = Column(Float, nullable=True)
        execution_time_ms = Column(Float, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="quantum_telemetry")

except ImportError:
    Base = None

    @dataclass
    class ScenarioRecord:
        scenario_id: str
        name: str
        random_seed: int
        order_count: int
        fleet_size: int
        depot_count: int
        chute_count: int
        is_mock_data: bool
        topology_metadata: Dict[str, Any]
        created_at: Optional[str] = None

    @dataclass
    class OrderRecord:
        scenario_id: str
        order_id: str
        sku_id: str
        depot_id: str
        aisle_id: str
        pickup_x: float
        pickup_y: float
        pickup_z: float
        drop_chute_id: str
        mass_kg: float
        volume_m3: float
        open_window_start: float
        drop_deadline: float
        is_atomic: bool = True
        hazard_class: str = "NONE"

    @dataclass
    class ExecutionRunRecord:
        run_id: str
        scenario_id: str
        wave_id: str
        operational_mode: str
        algorithm_ranks_used: Dict[str, str]
        total_makespan_sec: float
        total_distance_km: float
        chute_variance: float
        total_solve_latency_sec: float
        falsification_ratio_phi: float
        is_falsified: bool = False
        sla_violations_count: int = 0
        timestamp: Optional[str] = None

    @dataclass
    class TierExecutionRecord:
        run_id: str
        tier_number: int
        algorithm_rank: str
        latency_ms: float
        status: str
        output_summary: Dict[str, Any]
        iterations_count: int = 1
        benders_cuts_generated: Optional[List[Any]] = None

    @dataclass
    class QuantumTelemetryRecord:
        run_id: str
        job_id: str
        backend_name: str
        circuit_width_qubits: int
        circuit_depth: int
        cx_gate_count: int
        sampled_bitstrings_count: int
        variational_energy: float
        execution_time_ms: float
        quantum_speedup_ratio: Optional[float] = None
