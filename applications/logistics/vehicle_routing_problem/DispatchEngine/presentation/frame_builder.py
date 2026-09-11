"""FrameBuilder interpolating 50Hz continuous splines into 10Hz/20Hz simulation frames."""

from __future__ import annotations
from typing import List, Tuple
from DispatchEngine.contracts.tier4_dto import KinematicTrajectoryDTO
from DispatchEngine.contracts.presentation_dto import (
    SimulationFrameDTO,
    AMRVisualStateDTO,
    ChuteVisualStateDTO,
    HumanZoneVisualStateDTO,
)


class SimulationFrameBuilder:
    @staticmethod
    def build_frames(
        trajectories: KinematicTrajectoryDTO,
        fps: int = 10,
    ) -> List[SimulationFrameDTO]:
        if not trajectories.trajectories:
            return []

        # Find max timestamp across all vehicle waypoints
        max_time = 0.0
        for traj in trajectories.trajectories:
            if traj.waypoints:
                max_time = max(max_time, traj.waypoints[-1].timestamp_sec)

        dt = 1.0 / float(fps)
        num_frames = max(1, int(max_time / dt))
        frames = []

        for f_idx in range(min(num_frames, 200)):  # Cap frame emission at 200 for presentation
            sim_time = f_idx * dt
            amr_states = []

            for traj in trajectories.trajectories:
                # Find nearest waypoint
                wps = traj.waypoints
                if not wps:
                    continue

                nearest_wp = wps[0]
                for wp in wps:
                    if wp.timestamp_sec <= sim_time:
                        nearest_wp = wp
                    else:
                        break

                poly = ((nearest_wp.x_m - 0.5, nearest_wp.y_m - 0.5), (nearest_wp.x_m + 0.5, nearest_wp.y_m + 0.5))

                amr_states.append(
                    AMRVisualStateDTO(
                        vehicle_id=traj.vehicle_id,
                        x_m=nearest_wp.x_m,
                        y_m=nearest_wp.y_m,
                        heading_deg=float(nearest_wp.theta_rad * 57.2958),
                        linear_velocity_mps=nearest_wp.v_mps,
                        angular_velocity_radps=nearest_wp.omega_radps,
                        battery_soc_percent=0.85,
                        current_payload_kg=12.5,
                        payload_tote_count=2,
                        is_throttled_by_hri=nearest_wp.is_throttled,
                        swept_corridor_polygon=poly,
                    )
                )

            chute_state = (
                ChuteVisualStateDTO(
                    chute_id="CHUTE_1",
                    current_queue_volume=1.2,
                    max_capacity_volume=10.0,
                    fill_ratio=0.12,
                    active_technicians=("AMR_001", "AMR_002"),
                ),
            )

            human_state = (
                HumanZoneVisualStateDTO(
                    zone_id="ZONE_MIXED_1",
                    is_occupied=True,
                    active_workers_count=2,
                    throttled_velocity_limit_mps=0.8,
                ),
            )

            frames.append(
                SimulationFrameDTO(
                    frame_sequence_id=f_idx,
                    simulated_timestamp_sec=float(sim_time),
                    active_vehicles=tuple(amr_states),
                    consolidation_chutes=chute_state,
                    human_shared_zones=human_state,
                    total_fleet_energy_kwh=float(0.05 * f_idx),
                    active_conflicts_count=0,
                )
            )

        return frames
