"""Analytical Benders Cut generator: Tier 4 (Kinematics) -> Tier 3 (Routing)."""

from __future__ import annotations
import uuid
from typing import Tuple
from DispatchEngine.contracts.benders_dto import SpatiotemporalDeadlockCutDTO


class Tier4ToTier3BendersCutGenerator:
    """Emits arc invalidation cut c_uv(t) = infinity on narrow corridor deadlock."""

    @staticmethod
    def generate_cut(corridor_id: str, t_start: float, t_end: float, veh_ids: Tuple[str, ...]) -> SpatiotemporalDeadlockCutDTO:
        return SpatiotemporalDeadlockCutDTO(
            cut_id=f"CUT-T4T3-{uuid.uuid4().hex[:8].upper()}",
            blocked_corridor_id=corridor_id,
            time_interval=(t_start, t_end),
            conflicting_vehicle_ids=veh_ids,
        )
