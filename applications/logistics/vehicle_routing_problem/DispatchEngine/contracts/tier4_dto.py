"""Tier 4 Kinematic Deconfliction & Continuous HRI DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, List
from pydantic import Field
from DispatchEngine.contracts.base import StrictImmutableDTO


class SplineWaypointDTO(StrictImmutableDTO):
    timestamp_sec: float
    x_m: float
    y_m: float
    theta_rad: float
    v_mps: float
    omega_radps: float
    is_throttled: bool = False


class VehicleParametricTrajectoryDTO(StrictImmutableDTO):
    vehicle_id: str
    waypoints: Tuple[SplineWaypointDTO, ...]
    swept_bounding_radii: Tuple[float, ...]
    max_lateral_acceleration_mps2: float


class SweptCorridorReservationDTO(StrictImmutableDTO):
    reservation_id: str
    vehicle_id: str
    corridor_id: str
    time_interval: Tuple[float, float]               # [t_start, t_end]
    swept_polygon_vertices: Tuple[Tuple[float, float], ...]


class KinematicTrajectoryDTO(StrictImmutableDTO):
    wave_id: str
    trajectories: Tuple[VehicleParametricTrajectoryDTO, ...]
    reservations: Tuple[SweptCorridorReservationDTO, ...]
    detected_conflicts_resolved: int = 0
    hri_velocity_throttling_events: int = 0
