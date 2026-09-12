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

# Parameter domain limits, step sizes, units, and industrial default values
CONFIG_LIMITS_SPEC = {
    # Facility
    "facility_length_m": {"min": 50.0, "max": 500.0, "step": 10.0, "default": 150.0, "unit": "m", "category": "Facility"},
    "facility_width_m": {"min": 30.0, "max": 300.0, "step": 5.0, "default": 100.0, "unit": "m", "category": "Facility"},
    "facility_height_m": {"min": 6.0, "max": 24.0, "step": 1.0, "default": 12.0, "unit": "m", "category": "Facility"},
    "aisle_count": {"min": 2, "max": 30, "step": 1, "default": 10, "unit": "count", "category": "Facility"},
    "aisle_width_m": {"min": 1.5, "max": 4.5, "step": 0.1, "default": 3.0, "unit": "m", "category": "Facility"},
    "chute_buffer_capacity_m3": {"min": 1.0, "max": 20.0, "step": 0.5, "default": 5.0, "unit": "m³", "category": "Facility"},
    # Kinematics & ISO 3691-4
    "fleet_size": {"min": 1, "max": 16, "step": 1, "default": 4, "unit": "AMRs", "category": "Kinematics"},
    "v_max_amr_mps": {"min": 0.5, "max": 4.0, "step": 0.1, "default": 2.0, "unit": "m/s", "category": "Kinematics"},
    "v_safe_hri_mps": {"min": 0.2, "max": 1.2, "step": 0.05, "default": 0.4, "unit": "m/s", "category": "Kinematics"},
    "a_max_amr_mps2": {"min": 0.2, "max": 3.0, "step": 0.1, "default": 1.0, "unit": "m/s²", "category": "Kinematics"},
    "emergency_decel_mps2": {"min": 1.5, "max": 5.0, "step": 0.25, "default": 2.5, "unit": "m/s²", "category": "Kinematics"},
    "min_headway_sec": {"min": 0.5, "max": 4.0, "step": 0.1, "default": 1.5, "unit": "s", "category": "Kinematics"},
    "battery_capacity_kwh": {"min": 0.5, "max": 5.0, "step": 0.25, "default": 1.8, "unit": "kWh", "category": "Kinematics"},
    "battery_initial_soc": {"min": 20.0, "max": 100.0, "step": 5.0, "default": 95.0, "unit": "%", "category": "Kinematics"},
    "battery_min_soc": {"min": 5.0, "max": 30.0, "step": 1.0, "default": 15.0, "unit": "%", "category": "Kinematics"},
    "max_payload_mass_kg": {"min": 20.0, "max": 500.0, "step": 10.0, "default": 200.0, "unit": "kg", "category": "Kinematics"},
    "max_payload_volume_m3": {"min": 0.1, "max": 2.5, "step": 0.05, "default": 0.8, "unit": "m³", "category": "Kinematics"},
    # Orders
    "num_orders": {"min": 4, "max": 150, "step": 1, "default": 20, "unit": "orders", "category": "Orders"},
    "hazard_fraction": {"min": 0.0, "max": 60.0, "step": 5.0, "default": 15.0, "unit": "%", "category": "Orders"},
    "tight_deadline_fraction": {"min": 0.0, "max": 70.0, "step": 5.0, "default": 20.0, "unit": "%", "category": "Orders"},
    "time_window_span_sec": {"min": 60.0, "max": 1200.0, "step": 30.0, "default": 360.0, "unit": "s", "category": "Orders"},
    # Tiers 1-4 Solvers
    "fcm_fuzziness_m": {"min": 1.05, "max": 3.50, "step": 0.05, "default": 1.85, "unit": "value", "category": "Tier1"},
    "fcm_max_iter": {"min": 5, "max": 300, "step": 5, "default": 50, "unit": "iter", "category": "Tier1"},
    "bpp_support_ratio_min": {"min": 0.60, "max": 0.98, "step": 0.02, "default": 0.85, "unit": "ratio", "category": "Tier2"},
    "friction_coeff_mu": {"min": 0.20, "max": 0.90, "step": 0.05, "default": 0.45, "unit": "value", "category": "Tier2"},
    "bpp_time_limit_sec": {"min": 0.5, "max": 15.0, "step": 0.5, "default": 3.0, "unit": "s", "category": "Tier2"},
    "vrp_penalty_delay_beta": {"min": 0.2, "max": 15.0, "step": 0.2, "default": 2.0, "unit": "factor", "category": "Tier3"},
    "vrp_penalty_subtour_p": {"min": 10.0, "max": 500.0, "step": 10.0, "default": 100.0, "unit": "factor", "category": "Tier3"},
    "kinematics_step_dt": {"min": 0.02, "max": 0.50, "step": 0.02, "default": 0.10, "unit": "s", "category": "Tier4"},
    # Classiq Quantum
    "qaoa_p_layers": {"min": 1, "max": 5, "step": 1, "default": 2, "unit": "layers", "category": "Quantum"},
    "qaoa_shots": {"min": 256, "max": 16384, "step": 256, "default": 1024, "unit": "shots", "category": "Quantum"},
    "max_circuit_width": {"min": 8, "max": 64, "step": 2, "default": 32, "unit": "qubits", "category": "Quantum"},
    # Lagrangian
    "lagrangian_alpha": {"min": 0.1, "max": 10.0, "step": 0.1, "default": 1.0, "unit": "weight", "category": "Lagrangian"},
    "lagrangian_beta": {"min": 0.5, "max": 20.0, "step": 0.5, "default": 2.0, "unit": "weight", "category": "Lagrangian"},
    "lagrangian_gamma": {"min": 1.0, "max": 30.0, "step": 1.0, "default": 5.0, "unit": "weight", "category": "Lagrangian"},
    "lagrangian_lambda": {"min": 0.5, "max": 15.0, "step": 0.5, "default": 1.5, "unit": "weight", "category": "Lagrangian"},
}

