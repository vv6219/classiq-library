"""System Context Vector evaluator (S_sys)."""

from __future__ import annotations
from dataclasses import dataclass
from DispatchEngine.contracts.tier1_dto import OrderPoolDTO


@dataclass(frozen=True)
class SystemContextState:
    order_count: int
    fleet_size: int
    sku_variance: float
    open_window_ratio: float
    flag_hri_triggered: bool
    flag_quantum_ready: bool
    compute_budget_sec: float


class SystemContextEngine:
    @staticmethod
    def evaluate_context(
        pool: OrderPoolDTO,
        fleet_size: int,
        budget_sec: float = 15.0,
        flag_hri: bool = False,
        flag_quantum: bool = True,
    ) -> SystemContextState:
        n = len(pool.orders)
        # Compute open window ratio
        open_count = sum(1 for o in pool.orders if o.open_window_start > 0.0)
        open_ratio = open_count / max(1, n)

        return SystemContextState(
            order_count=n,
            fleet_size=fleet_size,
            sku_variance=0.005,
            open_window_ratio=open_ratio,
            flag_hri_triggered=flag_hri,
            flag_quantum_ready=flag_quantum,
            compute_budget_sec=budget_sec,
        )
