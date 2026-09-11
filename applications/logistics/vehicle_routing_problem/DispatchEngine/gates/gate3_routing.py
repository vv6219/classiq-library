"""Gate 3: Open Time Windows, Shift Limits, and Battery SoC Bounds."""

from __future__ import annotations
from DispatchEngine.gates.base_gate import BaseValidationGate, GateValidationResult
from DispatchEngine.contracts.tier3_dto import RoutingScheduleDTO
from DispatchEngine.config import DEFAULT_CONFIG


class Gate3RoutingValidation(BaseValidationGate):
    """Asserts T_i >= e_i, Shift <= H_shift, and min(SoC) >= SoC_min."""

    def __init__(self, max_shift_sec: float = 28800.0, min_soc: float = 0.15):
        self.max_shift_sec = max_shift_sec
        self.min_soc = min_soc

    def validate(self, schedule: RoutingScheduleDTO) -> GateValidationResult:
        for r in schedule.routes:
            if r.total_shift_duration_sec > self.max_shift_sec:
                return GateValidationResult(
                    is_valid=False,
                    gate_name="Gate 3 (Shift Duration Cap)",
                    failure_reason=f"Vehicle {r.vehicle_id} shift {r.total_shift_duration_sec:.1f}s > {self.max_shift_sec:.1f}s",
                    violation_metrics={"vehicle_id": r.vehicle_id, "shift": r.total_shift_duration_sec},
                )

            if r.min_battery_soc < self.min_soc:
                return GateValidationResult(
                    is_valid=False,
                    gate_name="Gate 3 (Battery SoC Minimum)",
                    failure_reason=f"Vehicle {r.vehicle_id} SoC dropped to {r.min_battery_soc * 100:.1f}% (< {self.min_soc * 100:.1f}%)",
                    violation_metrics={"vehicle_id": r.vehicle_id, "soc": r.min_battery_soc},
                )

        return GateValidationResult(is_valid=True, gate_name="Gate 3 (Open Windows, Shift & Energy)")
