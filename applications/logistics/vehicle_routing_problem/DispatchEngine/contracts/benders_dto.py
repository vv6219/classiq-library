"""Analytical Benders Recourse Cut DTOs."""

from __future__ import annotations
from typing import Tuple, Dict
from DispatchEngine.contracts.base import StrictImmutableDTO


class PackingBendersCutDTO(StrictImmutableDTO):
    """Cut emitted by Tier 2 to Tier 1 when a sub-batch cannot be packed."""
    cut_id: str
    vehicle_id: str
    infeasible_order_ids: Tuple[str, ...]
    violation_type: str                  # 'OVERLAP', 'INSTABILITY_COM', 'LIFO_CYCLE'
    suggested_split_order_id: str


class RoutingBendersCutDTO(StrictImmutableDTO):
    """Cut emitted by Tier 3 to Tier 1 when a sequence breaches shift or battery."""
    cut_id: str
    vehicle_id: str
    critical_subtour_node_ids: Tuple[str, ...]
    violation_type: str                  # 'SHIFT_LIMIT_EXCEEDED', 'BATTERY_DEPLETED'
    deficit_amount: float


class SpatiotemporalDeadlockCutDTO(StrictImmutableDTO):
    """Cut emitted by Tier 4 to Tier 3 when an aisle encounters topological deadlock."""
    cut_id: str
    blocked_corridor_id: str
    time_interval: Tuple[float, float]
    conflicting_vehicle_ids: Tuple[str, ...]
