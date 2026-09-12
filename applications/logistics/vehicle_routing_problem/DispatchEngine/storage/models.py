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
        Text,
    )
    from sqlalchemy.orm import declarative_base, relationship

    Base = declarative_base()

    class ScenarioRecord(Base):
        __tablename__ = "scenarios"

        scenario_id = Column(String(64), primary_key=True)
        created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        name = Column(String(128), nullable=False)
        archetype = Column(String(64), default="PARETO_HOT_ZONE", nullable=False)
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
        dim_l = Column(Float, default=0.4, nullable=False)
        dim_w = Column(Float, default=0.3, nullable=False)
        dim_h = Column(Float, default=0.2, nullable=False)
        open_window_start = Column(Float, nullable=False)
        drop_deadline = Column(Float, nullable=False)
        is_atomic = Column(Boolean, default=True)
        hazard_class = Column(String(32), default="NONE")
        sla_priority = Column(Integer, default=1)

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
        verification_code = Column(String(32), default="lmn", nullable=False)

        scenario = relationship("ScenarioRecord", back_populates="runs")
        tier_results = relationship("TierExecutionRecord", back_populates="run", cascade="all, delete-orphan")
        quantum_telemetry = relationship("QuantumTelemetryRecord", back_populates="run", uselist=False)
        routes = relationship("VehicleRouteRecord", back_populates="run", cascade="all, delete-orphan")
        placements = relationship("ContainerPlacementRecord", back_populates="run", cascade="all, delete-orphan")
        lifo_edges = relationship("LIFODependencyRecord", back_populates="run", cascade="all, delete-orphan")
        gate_validations = relationship("GateValidationRecord", back_populates="run", cascade="all, delete-orphan")
        chute_flows = relationship("ChuteFlowRecord", back_populates="run", cascade="all, delete-orphan")

    class VehicleRouteRecord(Base):
        __tablename__ = "vehicle_routes"

        route_id = Column(String(64), primary_key=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False, index=True)
        vehicle_id = Column(String(32), nullable=False)
        origin_depot_id = Column(String(32), nullable=False)
        destination_depot_id = Column(String(32), nullable=False)
        tour_length_m = Column(Float, nullable=False)
        route_makespan_sec = Column(Float, nullable=False)
        total_carried_mass_kg = Column(Float, nullable=False)
        total_carried_volume_m3 = Column(Float, nullable=False)
        volume_utilization_pct = Column(Float, nullable=False)
        battery_consumed_pct = Column(Float, nullable=False)
        stops_count = Column(Integer, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="routes")
        stops = relationship("RouteStopRecord", back_populates="route", cascade="all, delete-orphan")

    class RouteStopRecord(Base):
        __tablename__ = "route_stops"

        stop_id = Column(String(64), primary_key=True)
        route_id = Column(String(64), ForeignKey("vehicle_routes.route_id"), nullable=False, index=True)
        stop_sequence = Column(Integer, nullable=False)
        location_type = Column(String(32), nullable=False)  # DEPOT, PICKUP, DROP_CHUTE
        location_id = Column(String(64), nullable=False)
        pos_x = Column(Float, nullable=False)
        pos_y = Column(Float, nullable=False)
        pos_z = Column(Float, nullable=False)
        arrival_time_sec = Column(Float, nullable=False)
        departure_time_sec = Column(Float, nullable=False)
        service_duration_sec = Column(Float, nullable=False)
        action = Column(String(32), nullable=False)  # PICKUP, DROP, REPLENISH
        order_ids_json = Column(JSON, nullable=False)

        route = relationship("VehicleRouteRecord", back_populates="stops")

    class ContainerPlacementRecord(Base):
        __tablename__ = "container_placements"

        placement_id = Column(String(64), primary_key=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False, index=True)
        vehicle_id = Column(String(32), nullable=False)
        order_id = Column(String(64), nullable=False)
        sku_id = Column(String(64), nullable=False)
        pos_x = Column(Float, nullable=False)
        pos_y = Column(Float, nullable=False)
        pos_z = Column(Float, nullable=False)
        dim_l = Column(Float, nullable=False)
        dim_w = Column(Float, nullable=False)
        dim_h = Column(Float, nullable=False)
        mass_kg = Column(Float, nullable=False)
        extraction_sequence = Column(Integer, nullable=False)
        support_surface_ratio = Column(Float, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="placements")

    class LIFODependencyRecord(Base):
        __tablename__ = "lifo_dependencies"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False, index=True)
        vehicle_id = Column(String(32), nullable=False)
        blocking_order_id = Column(String(64), nullable=False)
        blocked_order_id = Column(String(64), nullable=False)
        contact_area_m2 = Column(Float, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="lifo_edges")

    class GateValidationRecord(Base):
        __tablename__ = "gate_validations"

        validation_id = Column(String(64), primary_key=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False, index=True)
        gate_number = Column(Integer, nullable=False)
        gate_name = Column(String(64), nullable=False)
        status = Column(String(32), nullable=False)  # PASS, FAIL, RECOURSE
        falsification_ratio_phi = Column(Float, nullable=True)
        verification_code = Column(String(32), default="lmn", nullable=False)
        violations_count = Column(Integer, default=0)
        details_json = Column(JSON, nullable=False)
        timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

        run = relationship("ExecutionRunRecord", back_populates="gate_validations")

    class TelemetryEventRecord(Base):
        __tablename__ = "telemetry_events"

        event_id = Column(Integer, primary_key=True, autoincrement=True)
        timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
        log_level = Column(String(16), nullable=False, index=True)
        logger_name = Column(String(64), nullable=False)
        trace_id = Column(String(64), nullable=False, index=True)
        span_id = Column(String(64), nullable=False)
        wave_id = Column(String(64), nullable=True)
        vehicle_id = Column(String(32), nullable=True)
        message = Column(Text, nullable=False)
        attributes_json = Column(JSON, nullable=True)
        error_stack = Column(Text, nullable=True)

    class ChuteFlowRecord(Base):
        __tablename__ = "chute_flow_dynamics"

        id = Column(Integer, primary_key=True, autoincrement=True)
        run_id = Column(String(64), ForeignKey("execution_runs.run_id"), nullable=False, index=True)
        chute_id = Column(String(32), nullable=False)
        time_sec = Column(Float, nullable=False)
        accumulated_volume_m3 = Column(Float, nullable=False)
        inflow_rate_m3_s = Column(Float, nullable=False)
        clearance_status = Column(String(32), default="NORMAL")

        run = relationship("ExecutionRunRecord", back_populates="chute_flows")

    class AlgorithmBenchmarkRecord(Base):
        __tablename__ = "algorithm_benchmarks"

        benchmark_id = Column(String(64), primary_key=True)
        scenario_id = Column(String(64), ForeignKey("scenarios.scenario_id"), nullable=False)
        timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
        fifo_makespan_sec = Column(Float, nullable=False)
        kmeans_makespan_sec = Column(Float, nullable=False)
        sc_qfcm_makespan_sec = Column(Float, nullable=False)
        classiq_makespan_sec = Column(Float, nullable=False)
        makespan_improvement_pct = Column(Float, nullable=False)
        distance_improvement_pct = Column(Float, nullable=False)
        falsification_ratio_phi = Column(Float, nullable=False)
        verification_code = Column(String(32), default="lmn", nullable=False)

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
        archetype: str = "PARETO_HOT_ZONE"
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
        dim_l: float = 0.4
        dim_w: float = 0.3
        dim_h: float = 0.2
        is_atomic: bool = True
        hazard_class: str = "NONE"
        sla_priority: int = 1

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
        verification_code: str = "lmn"
        timestamp: Optional[str] = None

    @dataclass
    class VehicleRouteRecord:
        route_id: str
        run_id: str
        vehicle_id: str
        origin_depot_id: str
        destination_depot_id: str
        tour_length_m: float
        route_makespan_sec: float
        total_carried_mass_kg: float
        total_carried_volume_m3: float
        volume_utilization_pct: float
        battery_consumed_pct: float
        stops_count: int

    @dataclass
    class RouteStopRecord:
        stop_id: str
        route_id: str
        stop_sequence: int
        location_type: str
        location_id: str
        pos_x: float
        pos_y: float
        pos_z: float
        arrival_time_sec: float
        departure_time_sec: float
        service_duration_sec: float
        action: str
        order_ids_json: List[str]

    @dataclass
    class ContainerPlacementRecord:
        placement_id: str
        run_id: str
        vehicle_id: str
        order_id: str
        sku_id: str
        pos_x: float
        pos_y: float
        pos_z: float
        dim_l: float
        dim_w: float
        dim_h: float
        mass_kg: float
        extraction_sequence: int
        support_surface_ratio: float

    @dataclass
    class LIFODependencyRecord:
        run_id: str
        vehicle_id: str
        blocking_order_id: str
        blocked_order_id: str
        contact_area_m2: float

    @dataclass
    class GateValidationRecord:
        validation_id: str
        run_id: str
        gate_number: int
        gate_name: str
        status: str
        details_json: Dict[str, Any]
        falsification_ratio_phi: Optional[float] = None
        verification_code: str = "lmn"
        violations_count: int = 0
        timestamp: Optional[str] = None

    @dataclass
    class TelemetryEventRecord:
        timestamp: str
        log_level: str
        logger_name: str
        trace_id: str
        span_id: str
        message: str
        wave_id: Optional[str] = None
        vehicle_id: Optional[str] = None
        attributes_json: Optional[Dict[str, Any]] = None
        error_stack: Optional[str] = None

    @dataclass
    class ChuteFlowRecord:
        run_id: str
        chute_id: str
        time_sec: float
        accumulated_volume_m3: float
        inflow_rate_m3_s: float
        clearance_status: str = "NORMAL"

    @dataclass
    class AlgorithmBenchmarkRecord:
        benchmark_id: str
        scenario_id: str
        fifo_makespan_sec: float
        kmeans_makespan_sec: float
        sc_qfcm_makespan_sec: float
        classiq_makespan_sec: float
        makespan_improvement_pct: float
        distance_improvement_pct: float
        falsification_ratio_phi: float
        verification_code: str = "lmn"
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
