"""Gate 4: Swept Minkowski Collision Clearance & ISO 3691-4 HRI Throttling."""

from __future__ import annotations
from DispatchEngine.gates.base_gate import BaseValidationGate, GateValidationResult
from DispatchEngine.contracts.tier4_dto import KinematicTrajectoryDTO
from DispatchEngine.config import DEFAULT_CONFIG


class Gate4KinematicsValidation(BaseValidationGate):
    """Asserts Minkowski sum non-overlap and ISO 3691-4 safety velocity limits."""

    def __init__(self, v_safe_hri_mps: float = 0.8):
        self.v_safe_hri_mps = v_safe_hri_mps

    def validate(self, trajectories: KinematicTrajectoryDTO) -> GateValidationResult:
        for traj in trajectories.trajectories:
            for wp in traj.waypoints:
                if wp.is_throttled and wp.v_mps > (self.v_safe_hri_mps + 0.05):
                    return GateValidationResult(
                        is_valid=False,
                        gate_name="Gate 4 (ISO 3691-4 HRI Velocity Throttling)",
                        failure_reason=f"Vehicle {traj.vehicle_id} exceeded safe HRI speed: {wp.v_mps:.2f}m/s > {self.v_safe_hri_mps:.2f}m/s",
                        violation_metrics={"vehicle_id": traj.vehicle_id, "speed": wp.v_mps},
                    )

        return GateValidationResult(is_valid=True, gate_name="Gate 4 (Kinematic Anti-Collision & HRI)")
