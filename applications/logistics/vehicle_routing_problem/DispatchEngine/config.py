"""Global Engine Configuration, Latency Quotas, and Penalty Hyperparameters."""

from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import os


@dataclass(frozen=True)
class LatencyQuotas:
    tier1_batching_max_sec: float = 15.0
    tier2_containerization_max_sec: float = 3.0
    tier3_routing_max_sec: float = 10.0
    tier4_kinematics_max_sec: float = 0.250
    quantum_qpu_timeout_sec: float = 8.0
    quantum_queue_threshold_sec: float = 5.0


@dataclass(frozen=True)
class AugmentedLagrangianConfig:
    alpha_initial: float = 1.0       # Makespan penalty
    beta_initial: float = 2.0        # Soft window delay penalty
    gamma_initial: float = 5.0       # Split-picking dispersion penalty
    lambda_initial: float = 1.5      # Chute surge penalty
    kappa_growth: float = 0.15       # Penalty escalation factor on breach
    zeta_decay: float = 0.05         # Penalty relaxation factor on satisfaction
    epsilon_tol: float = 1e-4        # Constraint violation tolerance


@dataclass(frozen=True)
class PhysicalFacilityConfig:
    facility_length_m: float = 150.0
    facility_width_m: float = 100.0
    facility_height_m: float = 12.0
    aisle_width_narrow_m: float = 1.8
    aisle_width_standard_m: float = 3.0
    default_chassis_radius_m: float = 0.65
    wheelbase_width_m: float = 0.90
    gravity_acceleration_mps2: float = 9.80665
    v_max_amr_mps: float = 2.0
    v_safe_hri_mps: float = 0.8
    a_max_amr_mps2: float = 1.0
    emergency_decel_mps2: float = 2.5
    min_headway_sec: float = 1.5
    min_node_clearance_sec: float = 2.0
    battery_min_soc: float = 0.15
    battery_charge_rate_per_sec: float = 0.005
    energy_tare_rate_per_m: float = 0.0001
    energy_load_rate_per_kg_m: float = 0.00002


@dataclass(frozen=True)
class DatabaseConfig:
    sqlite_db_path: Path = field(default_factory=lambda: Path(__file__).resolve().parent / "dispatchengine.db")
    echo_sql: bool = False
    pool_size: int = 5
    max_overflow: int = 10


@dataclass(frozen=True)
class QuantumEngineConfig:
    max_circuit_width: int = 32
    optimization_parameter: str = "depth"
    p_layers_qaoa: int = 2
    default_shots: int = 1024
    preferred_backend: str = "classiq_simulator"
    enable_quantum_acceleration: bool = True


@dataclass(frozen=True)
class EngineConfig:
    latency: LatencyQuotas = field(default_factory=LatencyQuotas)
    lagrangian: AugmentedLagrangianConfig = field(default_factory=AugmentedLagrangianConfig)
    facility: PhysicalFacilityConfig = field(default_factory=PhysicalFacilityConfig)
    db: DatabaseConfig = field(default_factory=DatabaseConfig)
    quantum: QuantumEngineConfig = field(default_factory=QuantumEngineConfig)
    falsification_verification_code: str = "lmn"


DEFAULT_CONFIG = EngineConfig()
