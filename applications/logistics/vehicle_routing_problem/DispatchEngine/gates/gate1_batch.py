"""Gate 1: Batch Capacity & SLA Reliability Validation."""

from __future__ import annotations
from DispatchEngine.gates.base_gate import BaseValidationGate, GateValidationResult
from DispatchEngine.contracts.tier1_dto import BatchPlanDTO


class Gate1BatchValidation(BaseValidationGate):
    """Asserts sum(q_i) <= Q_k and P(T <= L) >= 1 - epsilon."""

    def __init__(self, max_payload_mass_kg: float = 35.0, min_sla_confidence: float = 0.90):
        self.max_payload_mass_kg = max_payload_mass_kg
        self.min_sla_confidence = min_sla_confidence

    def validate(self, batch_plan: BatchPlanDTO) -> GateValidationResult:
        for b in batch_plan.batches:
            if b.total_mass_kg > self.max_payload_mass_kg:
                return GateValidationResult(
                    is_valid=False,
                    gate_name="Gate 1 (Batch Capacity)",
                    failure_reason=f"Vehicle {b.vehicle_id} overloaded: {b.total_mass_kg:.1f}kg > {self.max_payload_mass_kg:.1f}kg",
                    violation_metrics={"vehicle_id": b.vehicle_id, "mass": b.total_mass_kg},
                )

        if batch_plan.sla_confidence_score < self.min_sla_confidence:
            return GateValidationResult(
                is_valid=False,
                gate_name="Gate 1 (SLA Chance-Constraint)",
                failure_reason=f"SLA confidence {batch_plan.sla_confidence_score:.3f} below required {self.min_sla_confidence:.3f}",
                violation_metrics={"sla_score": batch_plan.sla_confidence_score},
            )

        return GateValidationResult(is_valid=True, gate_name="Gate 1 (Batch Capacity & SLA)")
