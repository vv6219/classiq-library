"""Tier 2 3D Containerization & Physical Mechanics DTOs."""

from __future__ import annotations
from typing import Tuple, Dict
from pydantic import Field
from DispatchEngine.contracts.base import StrictImmutableDTO


class ItemPlacementDTO(StrictImmutableDTO):
    order_id: str
    position_m: Tuple[float, float, float]       # [x, y, z]
    orientation_index: int = Field(ge=0, le=5)  # 6 orthogonal rotations
    bounding_box_m: Tuple[float, float, float]   # Effective [l, w, h]


class PackPlanDTO(StrictImmutableDTO):
    vehicle_id: str
    batch_id: str
    placements: Tuple[ItemPlacementDTO, ...]
    center_of_mass: Tuple[float, float, float]
    support_ratio: float = Field(ge=0.0, le=1.0) # >= 0.75
    com_margin_distance_m: float
    total_packed_volume_m3: float
    volumetric_efficiency: float = Field(ge=0.0, le=1.0)


class LIFOExtractionDAGDTO(StrictImmutableDTO):
    vehicle_id: str
    nodes: Tuple[str, ...]
    precedence_edges: Tuple[Tuple[str, str], ...] # (p, q): p extracted before q
    is_acyclic: bool = True
