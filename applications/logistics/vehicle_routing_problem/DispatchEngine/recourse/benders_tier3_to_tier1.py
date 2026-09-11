"""Analytical Benders Cut generator: Tier 3 (Routing) -> Tier 1 (Batching)."""

from __future__ import annotations
import uuid
from typing import List, Tuple
from DispatchEngine.contracts.benders_dto import RoutingBendersCutDTO
from DispatchEngine.contracts.tier3_dto import VehicleRouteDTO


class Tier3ToTier1BendersCutGenerator:
    """Generates subtour cut sum_{i,j in V_crit} x_ij^k <= |V_crit| - 1."""

    @staticmethod
    def generate_cut(route: VehicleRouteDTO, max_shift_sec: float = 28800.0) -> RoutingBendersCutDTO:
        crit_nodes = tuple(s.node_id for s in route.stops if s.stop_type == "PICKUP")
        deficit = max(0.0, route.total_shift_duration_sec - max_shift_sec)

        return RoutingBendersCutDTO(
            cut_id=f"CUT-T3T1-{uuid.uuid4().hex[:8].upper()}",
            vehicle_id=route.vehicle_id,
            critical_subtour_node_ids=crit_nodes,
            violation_type="SHIFT_LIMIT_EXCEEDED" if deficit > 0 else "BATTERY_DEPLETED",
            deficit_amount=deficit,
        )
