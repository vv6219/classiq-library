"""Tier 1 Master Batching & Allocation DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, Optional
from pydantic import Field
from DispatchEngine.contracts.base import StrictImmutableDTO


class OrderLineDTO(StrictImmutableDTO):
    order_id: str
    sku_id: str
    depot_id: str
    aisle_id: str
    pickup_node_id: str
    drop_chute_id: str
    pickup_pos: Tuple[float, float, float]
    mass_kg: float = Field(ge=0.0)
    dimensions_m: Tuple[float, float, float]
    volume_m3: float = Field(ge=0.0)
    slot_requirement: int = Field(default=1, ge=1)
    open_window_start: float = Field(ge=0.0)
    drop_deadline: float = Field(ge=0.0)
    is_atomic: bool = True
    hazard_class: str = "NONE"
    sla_priority: float = Field(default=1.0, ge=0.0, le=1.0)


class DepotStateDTO(StrictImmutableDTO):
    depot_id: str
    location: Tuple[float, float, float]
    max_throughput_out: int
    max_throughput_in: int
    current_inventory: int


class OrderPoolDTO(StrictImmutableDTO):
    wave_id: str
    orders: Tuple[OrderLineDTO, ...]
    depots: Tuple[DepotStateDTO, ...]


class VehicleBatchDTO(StrictImmutableDTO):
    vehicle_id: str
    assigned_depot_id: str
    order_ids: Tuple[str, ...]
    total_mass_kg: float
    total_volume_m3: float
    total_slots: int


class BatchPlanDTO(StrictImmutableDTO):
    wave_id: str
    batches: Tuple[VehicleBatchDTO, ...]
    split_fractions: Dict[str, Dict[str, float]]   # order_id -> {vehicle_id: y_io^k}
    projected_chute_inflow: Dict[str, float]       # chute_id -> items/sec
    sla_confidence_score: float = Field(ge=0.0, le=1.0)
    quantum_kernel_used: bool = False
