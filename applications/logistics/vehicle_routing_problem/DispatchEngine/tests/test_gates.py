"""Unit tests for Validation Gates 1 to 4."""

import unittest
from DispatchEngine.gates.gate1_batch import Gate1BatchValidation
from DispatchEngine.gates.gate2_packing import Gate2PackingValidation
from DispatchEngine.gates.gate3_routing import Gate3RoutingValidation
from DispatchEngine.gates.gate4_kinematics import Gate4KinematicsValidation
from DispatchEngine.contracts.tier1_dto import BatchPlanDTO, VehicleBatchDTO
from DispatchEngine.contracts.tier2_dto import PackPlanDTO, LIFOExtractionDAGDTO


class TestGates(unittest.TestCase):
    def test_gate1_valid(self):
        gate = Gate1BatchValidation(max_payload_mass_kg=35.0)
        batch = VehicleBatchDTO(
            vehicle_id="AMR_1",
            assigned_depot_id="DEPOT_1",
            order_ids=("ORD_1",),
            total_mass_kg=20.0,
            total_volume_m3=0.01,
            total_slots=1,
        )
        plan = BatchPlanDTO(
            wave_id="W1",
            batches=(batch,),
            split_fractions={},
            projected_chute_inflow={},
            sla_confidence_score=0.95,
        )
        res = gate.validate(plan)
        self.assertTrue(res.is_valid)

    def test_gate1_overload(self):
        gate = Gate1BatchValidation(max_payload_mass_kg=35.0)
        batch = VehicleBatchDTO(
            vehicle_id="AMR_1",
            assigned_depot_id="DEPOT_1",
            order_ids=("ORD_1",),
            total_mass_kg=45.0,  # Exceeds 35.0kg
            total_volume_m3=0.01,
            total_slots=1,
        )
        plan = BatchPlanDTO(
            wave_id="W1",
            batches=(batch,),
            split_fractions={},
            projected_chute_inflow={},
            sla_confidence_score=0.95,
        )
        res = gate.validate(plan)
        self.assertFalse(res.is_valid)
        self.assertIn("overloaded", res.failure_reason)

    def test_gate2_lifo_acyclic(self):
        gate = Gate2PackingValidation()
        pack = PackPlanDTO(
            vehicle_id="AMR_1",
            batch_id="B1",
            placements=(),
            center_of_mass=(0.5, 0.4, 0.2),
            support_ratio=0.85,
            com_margin_distance_m=0.15,
            total_packed_volume_m3=0.05,
            volumetric_efficiency=0.6,
        )
        lifo_dag = LIFOExtractionDAGDTO(
            vehicle_id="AMR_1",
            nodes=("O1", "O2"),
            precedence_edges=(("O1", "O2"),),
            is_acyclic=True,
        )
        res = gate.validate_packing(pack, lifo_dag)
        self.assertTrue(res.is_valid)


if __name__ == "__main__":
    unittest.main()
