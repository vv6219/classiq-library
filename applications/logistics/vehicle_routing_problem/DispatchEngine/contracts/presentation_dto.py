"""Presentation Engine & Simulator Data DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, Optional, List
from DispatchEngine.contracts.base import StrictImmutableDTO


class AMRVisualStateDTO(StrictImmutableDTO):
    vehicle_id: str
    x_m: float
    y_m: float
    heading_deg: float
    linear_velocity_mps: float
    angular_velocity_radps: float
    battery_soc_percent: float
    current_payload_kg: float
    payload_tote_count: int
    is_throttled_by_hri: bool
    swept_corridor_polygon: Tuple[Tuple[float, float], ...]


class ChuteVisualStateDTO(StrictImmutableDTO):
    chute_id: str
    current_queue_volume: float
    max_capacity_volume: float
    fill_ratio: float
    active_technicians: Tuple[str, ...]


class HumanZoneVisualStateDTO(StrictImmutableDTO):
    zone_id: str
    is_occupied: bool
    active_workers_count: int
    throttled_velocity_limit_mps: float


class SimulationFrameDTO(StrictImmutableDTO):
    frame_sequence_id: int
    simulated_timestamp_sec: float
    active_vehicles: Tuple[AMRVisualStateDTO, ...]
    consolidation_chutes: Tuple[ChuteVisualStateDTO, ...]
    human_shared_zones: Tuple[HumanZoneVisualStateDTO, ...]
    total_fleet_energy_kwh: float
    active_conflicts_count: int


class DashboardHUDDTO(StrictImmutableDTO):
    wave_id: str
    operational_mode: str
    total_makespan_sec: float
    fleet_distance_km: float
    chute_balance_variance: float
    pack_density_percent: float
    hri_throttle_events: int
    quantum_speedup_ratio: Optional[float] = None
    quantum_fidelity: Optional[float] = None
    falsification_ratio_phi: float


class AlgorithmBenchmarkComparisonDTO(StrictImmutableDTO):
    scenario_id: str
    algorithms_evaluated: Tuple[str, ...]
    makespan_by_algo: Dict[str, float]
    distance_by_algo: Dict[str, float]
    chute_variance_by_algo: Dict[str, float]
    latency_by_algo: Dict[str, float]
    improvement_makespan_percent: float
    improvement_distance_percent: float
