"""Strategy state machine selecting operational mode and algorithm ranks."""

from __future__ import annotations
from typing import Dict, Tuple
from DispatchEngine.common_types import OperationalMode, AlgorithmRank, TierNumber
from DispatchEngine.strategy.context_engine import SystemContextState


class AlgorithmSelectorEngine:
    @staticmethod
    def select_mode_and_ranks(context: SystemContextState) -> Tuple[OperationalMode, Dict[int, AlgorithmRank]]:
        if context.flag_hri_triggered:
            return OperationalMode.EMERGENCY_RECEDE, {
                TierNumber.TIER_1_BATCHING: AlgorithmRank.FROZEN,
                TierNumber.TIER_2_CONTAINERIZATION: AlgorithmRank.FROZEN,
                TierNumber.TIER_3_ROUTING: AlgorithmRank.FROZEN,
                TierNumber.TIER_4_KINEMATICS: AlgorithmRank.RANK_2_DNMPC,
            }

        if context.order_count > 10000 or context.compute_budget_sec <= 5.0:
            return OperationalMode.AGILITY, {
                TierNumber.TIER_1_BATCHING: AlgorithmRank.RANK_3_KMEANS_PP,
                TierNumber.TIER_2_CONTAINERIZATION: AlgorithmRank.RANK_2_DUAL_GA,
                TierNumber.TIER_3_ROUTING: AlgorithmRank.RANK_2_ASYM_ALNS,
                TierNumber.TIER_4_KINEMATICS: AlgorithmRank.RANK_1_PBS_SIPP,
            }

        if context.flag_quantum_ready:
            return OperationalMode.QUANTUM, {
                TierNumber.TIER_1_BATCHING: AlgorithmRank.RANK_1Q_QUANTUM_FCM,
                TierNumber.TIER_2_CONTAINERIZATION: AlgorithmRank.RANK_1_CPSAT_MISOCP,
                TierNumber.TIER_3_ROUTING: AlgorithmRank.RANK_1Q_QAOA_ROUTING,
                TierNumber.TIER_4_KINEMATICS: AlgorithmRank.RANK_1_PBS_SIPP,
            }

        return OperationalMode.NORMAL, {
            TierNumber.TIER_1_BATCHING: AlgorithmRank.RANK_1_FCM_DR_SAA,
            TierNumber.TIER_2_CONTAINERIZATION: AlgorithmRank.RANK_1_CPSAT_MISOCP,
            TierNumber.TIER_3_ROUTING: AlgorithmRank.RANK_1_HGS_ADC,
            TierNumber.TIER_4_KINEMATICS: AlgorithmRank.RANK_1_PBS_SIPP,
        }
