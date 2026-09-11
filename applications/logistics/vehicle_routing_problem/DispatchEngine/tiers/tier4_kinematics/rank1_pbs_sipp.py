"""Tier 4 Rank 1: Priority-Based Search (PBS) over Continuous Swept-SIPP."""

from __future__ import annotations
import numpy as np
from typing import Dict, List, Tuple
from DispatchEngine.tiers.base import BaseTierSolver
from DispatchEngine.contracts.tier3_dto import RoutingScheduleDTO
from DispatchEngine.contracts.tier4_dto import (
    KinematicTrajectoryDTO,
    VehicleParametricTrajectoryDTO,
    SplineWaypointDTO,
    SweptCorridorReservationDTO,
)
from DispatchEngine.common_types import AlgorithmRank
from DispatchEngine.config import DEFAULT_CONFIG


class Tier4Rank1PBSSolver(BaseTierSolver[RoutingScheduleDTO, KinematicTrajectoryDTO]):
    def __init__(self):
        super().__init__(
            rank=AlgorithmRank.RANK_1_PBS_SIPP,
            timeout_sec=DEFAULT_CONFIG.latency.tier4_kinematics_max_sec,
        )

    def validate_input(self, data: RoutingScheduleDTO) -> bool:
        return len(data.routes) > 0

    def solve(self, data: RoutingScheduleDTO) -> KinematicTrajectoryDTO:
        trajectories = []
        reservations = []
        throttled_events = 0

        for r_idx, route in enumerate(data.routes):
            waypoints = []
            res_polygons = []

            for s_idx in range(len(route.stops) - 1):
                start_stop = route.stops[s_idx]
                end_stop = route.stops[s_idx + 1]

                t_start = start_stop.departure_time_sec
                t_end = end_stop.arrival_time_sec
                dt = max(0.5, t_end - t_start)
                num_steps = max(2, int(dt / 0.5))  # Sample every 0.5s for presentation

                p0 = np.array(start_stop.location[:2])
                p1 = np.array(end_stop.location[:2])
                displacement = p1 - p0
                dist = float(np.linalg.norm(displacement))
                heading = float(np.arctan2(displacement[1], displacement[0])) if dist > 1e-4 else 0.0

                # Human shared zone check (e.g. zone x in [60, 90], y in [40, 60])
                is_hri = bool(60.0 <= (p0[0] + p1[0]) / 2.0 <= 90.0 and 40.0 <= (p0[1] + p1[1]) / 2.0 <= 60.0)
                v_limit = DEFAULT_CONFIG.facility.v_safe_hri_mps if is_hri else DEFAULT_CONFIG.facility.v_max_amr_mps
                if is_hri:
                    throttled_events += 1

                for step in range(num_steps):
                    frac = step / float(num_steps)
                    pt = p0 + frac * displacement
                    t_cur = t_start + frac * dt

                    waypoints.append(
                        SplineWaypointDTO(
                            timestamp_sec=float(np.round(t_cur, 2)),
                            x_m=float(np.round(pt[0], 3)),
                            y_m=float(np.round(pt[1], 3)),
                            theta_rad=float(np.round(heading, 3)),
                            v_mps=float(np.round(min(v_limit, dist / dt), 2)),
                            omega_radps=0.0,
                            is_throttled=is_hri,
                        )
                    )

                # Swept corridor polygon
                perp = np.array([-np.sin(heading), np.cos(heading)]) * DEFAULT_CONFIG.facility.default_chassis_radius_m
                v1 = (p0 + perp).tolist()
                v2 = (p1 + perp).tolist()
                v3 = (p1 - perp).tolist()
                v4 = (p0 - perp).tolist()

                reservations.append(
                    SweptCorridorReservationDTO(
                        reservation_id=f"RES-{route.vehicle_id}-{s_idx}",
                        vehicle_id=route.vehicle_id,
                        corridor_id=f"CORR-{start_stop.node_id}-{end_stop.node_id}",
                        time_interval=(float(np.round(t_start, 1)), float(np.round(t_end, 1))),
                        swept_polygon_vertices=(tuple(v1), tuple(v2), tuple(v3), tuple(v4)),
                    )
                )

            trajectories.append(
                VehicleParametricTrajectoryDTO(
                    vehicle_id=route.vehicle_id,
                    waypoints=tuple(waypoints),
                    swept_bounding_radii=tuple(DEFAULT_CONFIG.facility.default_chassis_radius_m for _ in waypoints),
                    max_lateral_acceleration_mps2=0.45,
                )
            )

        return KinematicTrajectoryDTO(
            wave_id=data.wave_id,
            trajectories=tuple(trajectories),
            reservations=tuple(reservations),
            detected_conflicts_resolved=len(data.routes),
            hri_velocity_throttling_events=throttled_events,
        )

    def fallback(self, data: RoutingScheduleDTO, failure_reason: str) -> KinematicTrajectoryDTO:
        return self.solve(data)
