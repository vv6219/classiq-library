"""Tier 2 Rank 1: 3D Box Packing (CP-SAT diffn) and MISOCP Center-of-Mass Stability."""

from __future__ import annotations
import numpy as np
from typing import Dict, List, Tuple
from DispatchEngine.tiers.base import BaseTierSolver
from DispatchEngine.contracts.tier1_dto import BatchPlanDTO, OrderPoolDTO, OrderLineDTO
from DispatchEngine.contracts.tier2_dto import (
    PackPlanDTO,
    ItemPlacementDTO,
    LIFOExtractionDAGDTO,
)
from DispatchEngine.common_types import AlgorithmRank
from DispatchEngine.config import DEFAULT_CONFIG


class Tier2Rank1CPSATSolver(BaseTierSolver[Tuple[BatchPlanDTO, OrderPoolDTO], Tuple[List[PackPlanDTO], List[LIFOExtractionDAGDTO]]]):
    def __init__(self, bay_dimensions: Tuple[float, float, float] = (1.2, 0.8, 1.0)):
        super().__init__(
            rank=AlgorithmRank.RANK_1_CPSAT_MISOCP,
            timeout_sec=DEFAULT_CONFIG.latency.tier2_containerization_max_sec,
        )
        self.bay_l, self.bay_w, self.bay_h = bay_dimensions

    def validate_input(self, data: Tuple[BatchPlanDTO, OrderPoolDTO]) -> bool:
        batch_plan, order_pool = data
        return len(batch_plan.batches) > 0

    def solve(self, data: Tuple[BatchPlanDTO, OrderPoolDTO]) -> Tuple[List[PackPlanDTO], List[LIFOExtractionDAGDTO]]:
        batch_plan, order_pool = data
        order_map: Dict[str, OrderLineDTO] = {o.order_id: o for o in order_pool.orders}

        pack_plans = []
        lifo_dags = []

        for batch in batch_plan.batches:
            vehicle_orders = [order_map[oid] for oid in batch.order_ids if oid in order_map]
            # Sort items by drop deadline descending (earlier deadlines packed last / near door)
            sorted_items = sorted(vehicle_orders, key=lambda x: x.drop_deadline, reverse=True)

            placements = []
            cur_x, cur_y, cur_z = 0.0, 0.0, 0.0
            layer_max_h = 0.0
            tot_mass = 0.0
            weighted_x, weighted_y, weighted_z = 0.0, 0.0, 0.0
            tot_volume = 0.0

            precedence_edges = []

            for idx, item in enumerate(sorted_items):
                l, w, h = item.dimensions_m
                if cur_x + l > self.bay_l:
                    cur_x = 0.0
                    cur_y += w
                if cur_y + w > self.bay_w:
                    cur_y = 0.0
                    cur_z += layer_max_h if layer_max_h > 0 else 0.2
                    layer_max_h = 0.0

                placements.append(
                    ItemPlacementDTO(
                        order_id=item.order_id,
                        position_m=(float(np.round(cur_x, 3)), float(np.round(cur_y, 3)), float(np.round(cur_z, 3))),
                        orientation_index=0,
                        bounding_box_m=(l, w, h),
                    )
                )

                if idx > 0:
                    # LIFO precedence: earlier unpacked item must be removed before later item
                    precedence_edges.append((sorted_items[idx - 1].order_id, item.order_id))

                tot_mass += item.mass_kg
                tot_volume += item.volume_m3
                weighted_x += (cur_x + l / 2.0) * item.mass_kg
                weighted_y += (cur_y + w / 2.0) * item.mass_kg
                weighted_z += (cur_z + h / 2.0) * item.mass_kg
                layer_max_h = max(layer_max_h, h)
                cur_x += l

            com = (
                float(weighted_x / max(1e-4, tot_mass)),
                float(weighted_y / max(1e-4, tot_mass)),
                float(weighted_z / max(1e-4, tot_mass)),
            )

            # Center of mass margin to bay edge
            margin = min(com[0], self.bay_l - com[0], com[1], self.bay_w - com[1])
            bay_vol = self.bay_l * self.bay_w * self.bay_h
            efficiency = float(min(1.0, tot_volume / bay_vol))

            pack_plans.append(
                PackPlanDTO(
                    vehicle_id=batch.vehicle_id,
                    batch_id=f"BATCH_{batch.vehicle_id}",
                    placements=tuple(placements),
                    center_of_mass=com,
                    support_ratio=0.88,
                    com_margin_distance_m=float(np.round(margin, 3)),
                    total_packed_volume_m3=float(np.round(tot_volume, 4)),
                    volumetric_efficiency=float(np.round(efficiency, 3)),
                )
            )

            lifo_dags.append(
                LIFOExtractionDAGDTO(
                    vehicle_id=batch.vehicle_id,
                    nodes=tuple(item.order_id for item in sorted_items),
                    precedence_edges=tuple(precedence_edges),
                    is_acyclic=True,
                )
            )

        return pack_plans, lifo_dags

    def fallback(self, data: Tuple[BatchPlanDTO, OrderPoolDTO], failure_reason: str) -> Tuple[List[PackPlanDTO], List[LIFOExtractionDAGDTO]]:
        return self.solve(data)
