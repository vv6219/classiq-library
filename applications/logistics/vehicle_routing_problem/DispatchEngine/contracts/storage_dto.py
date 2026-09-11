"""Storage & Mock Persistence DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, Any, Optional
from datetime import datetime
from DispatchEngine.contracts.base import StrictImmutableDTO


class MockConfigDTO(StrictImmutableDTO):
    scenario_name: str
    num_orders: int
    num_technicians: int
    num_depots: int
    num_chutes: int
    seed: int = 42
    scale_label: str = "MEDIUM"
    archetype: str = "UNIFORM_RANDOM"
    hazard_ratio: float = 0.1


class ScenarioMetaDTO(StrictImmutableDTO):
    scenario_id: str
    name: str
    created_at: str
    order_count: int
    fleet_size: int
    depot_count: int
    is_mock: bool = True


class RunSnapshotDTO(StrictImmutableDTO):
    run_id: str
    scenario_id: str
    wave_id: str
    operational_mode: str
    total_makespan_sec: float
    total_distance_km: float
    chute_variance: float
    solve_latency_sec: float
    falsification_ratio_phi: float
    is_falsified: bool
