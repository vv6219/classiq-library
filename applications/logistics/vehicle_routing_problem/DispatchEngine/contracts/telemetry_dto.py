"""Telemetry & Sensor Hardware Stream DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, Optional
from DispatchEngine.contracts.base import StrictImmutableDTO


class FleetTelemetryUpdate(StrictImmutableDTO):
    vehicle_id: str
    timestamp_sec: float
    x_m: float
    y_m: float
    theta_rad: float
    v_mps: float
    omega_radps: float
    battery_soc: float
    fault_code: int = 0


class ZoneOccupancyEvent(StrictImmutableDTO):
    zone_id: str
    timestamp_sec: float
    is_human_detected: bool
    workers_present: int


class ASRSHoistRegistryDTO(StrictImmutableDTO):
    hoist_id: str
    current_rack_z: float
    is_extracting: bool
    spur_id: int
    queue_occupancy: int
