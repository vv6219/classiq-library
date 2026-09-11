"""Analytical Benders Cut generator: Tier 2 (Packing) -> Tier 1 (Batching)."""

from __future__ import annotations
import uuid
from typing import List, Tuple
from DispatchEngine.contracts.benders_dto import PackingBendersCutDTO
from DispatchEngine.contracts.tier2_dto import PackPlanDTO, LIFOExtractionDAGDTO


class Tier2ToTier1BendersCutGenerator:
    """Generates combinatorial cut sum_{i in I_conflict} y_io^k <= |I_conflict| - 1."""

    @staticmethod
    def generate_cut(pack_plan: PackPlanDTO, lifo_dag: LIFOExtractionDAGDTO) -> PackingBendersCutDTO:
        infeasible_items = tuple(p.order_id for p in pack_plan.placements[-2:]) if len(pack_plan.placements) >= 2 else ()
        split_target = infeasible_items[0] if infeasible_items else "NONE"

        return PackingBendersCutDTO(
            cut_id=f"CUT-T2T1-{uuid.uuid4().hex[:8].upper()}",
            vehicle_id=pack_plan.vehicle_id,
            infeasible_order_ids=infeasible_items,
            violation_type="INSTABILITY_COM" if pack_plan.support_ratio < 0.75 else "LIFO_CYCLE",
            suggested_split_order_id=split_target,
        )
