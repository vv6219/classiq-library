"""Gate 2: 3D Packing, LIFO Acyclicity, and Center-of-Mass Margin Validation."""

from __future__ import annotations
from DispatchEngine.gates.base_gate import BaseValidationGate, GateValidationResult
from DispatchEngine.contracts.tier2_dto import PackPlanDTO, LIFOExtractionDAGDTO


class Gate2PackingValidation(BaseValidationGate):
    """Asserts IsAcyclic(G_LIFO) and CoM stability and contact support >= 75%."""

    def __init__(self, min_support_ratio: float = 0.75, min_com_margin_m: float = 0.05):
        self.min_support_ratio = min_support_ratio
        self.min_com_margin_m = min_com_margin_m

    def validate_packing(self, pack_plan: PackPlanDTO, lifo_dag: LIFOExtractionDAGDTO) -> GateValidationResult:
        if not lifo_dag.is_acyclic:
            return GateValidationResult(
                is_valid=False,
                gate_name="Gate 2 (LIFO DAG Acyclicity)",
                failure_reason=f"Cyclic LIFO extraction graph detected on vehicle {pack_plan.vehicle_id}",
                violation_metrics={"vehicle_id": pack_plan.vehicle_id, "precedence_edges": lifo_dag.precedence_edges},
            )

        if pack_plan.support_ratio < self.min_support_ratio:
            return GateValidationResult(
                is_valid=False,
                gate_name="Gate 2 (Contact Support Ratio)",
                failure_reason=f"Support ratio {pack_plan.support_ratio:.2f} < {self.min_support_ratio:.2f}",
                violation_metrics={"support_ratio": pack_plan.support_ratio},
            )

        if pack_plan.com_margin_distance_m < self.min_com_margin_m:
            return GateValidationResult(
                is_valid=False,
                gate_name="Gate 2 (CoM Stability Margin)",
                failure_reason=f"CoM margin {pack_plan.com_margin_distance_m:.3f}m < {self.min_com_margin_m:.3f}m",
                violation_metrics={"com_margin": pack_plan.com_margin_distance_m},
            )

        return GateValidationResult(is_valid=True, gate_name="Gate 2 (3D Packing & Mechanics)")

    def validate(self, artifact: tuple[PackPlanDTO, LIFOExtractionDAGDTO]) -> GateValidationResult:
        return self.validate_packing(artifact[0], artifact[1])
