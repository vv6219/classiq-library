"""Tier 3 Route Sequencing Under Open Windows DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, List
from pydantic import Field
from DispatchEngine.contracts.base import StrictImmutableDTO


class RouteStopDTO(StrictImmutableDTO):
    stop_index: int
    node_id: str
    stop_type: str                   # 'DEPOT_START', 'PICKUP', 'DROP', 'CHARGE', 'DEPOT_END'
    location: Tuple[float, float, float]
    arrival_time_sec: float
    departure_time_sec: float
    accumulated_mass_kg: float
    accumulated_volume_m3: float
    battery_soc_percent: float = Field(ge=0.0, le=1.0)
    lateness_penalty_sec: float = Field(default=0.0, ge=0.0)


class VehicleRouteDTO(StrictImmutableDTO):
    vehicle_id: str
    assigned_depot_start: str
    assigned_depot_end: str
    stops: Tuple[RouteStopDTO, ...]
    total_distance_m: float
    total_lateness_sec: float
    total_shift_duration_sec: float
    min_battery_soc: float = Field(ge=0.0, le=1.0)


class RoutingScheduleDTO(StrictImmutableDTO):
    wave_id: str
    routes: Tuple[VehicleRouteDTO, ...]
    fleet_makespan_sec: float
    total_fleet_distance_km: float
    total_delay_penalty: float
    qaoa_subtours_optimized: int = 0
