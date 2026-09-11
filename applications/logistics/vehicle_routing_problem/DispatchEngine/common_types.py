"""Core Types, Physical Units, and Mathematical Enums for DispatchEngine."""

from __future__ import annotations
from enum import Enum, auto
from typing import NamedTuple, Tuple, List, Dict, Any, Union


class OperationalMode(str, Enum):
    NORMAL = "NORMAL"
    AGILITY = "AGILITY"
    DEGRADED_RECOVERY = "DEGRADED_RECOVERY"
    EMERGENCY_RECEDE = "EMERGENCY_RECEDE"
    HIGH_THROUGHPUT = "HIGH_THROUGHPUT"
    QUANTUM = "QUANTUM"


class TierNumber(int, Enum):
    TIER_1_BATCHING = 1
    TIER_2_CONTAINERIZATION = 2
    TIER_3_ROUTING = 3
    TIER_4_KINEMATICS = 4


class AlgorithmRank(str, Enum):
    # Tier 1
    RANK_1Q_QUANTUM_FCM = "RANK_1Q_QUANTUM_FCM"
    RANK_1_FCM_DR_SAA = "RANK_1_FCM_DR_SAA"
    RANK_2_NSGA3 = "RANK_2_NSGA3"
    RANK_3_KMEANS_PP = "RANK_3_KMEANS_PP"
    
    # Tier 2
    RANK_1_CPSAT_MISOCP = "RANK_1_CPSAT_MISOCP"
    RANK_2_DUAL_GA = "RANK_2_DUAL_GA"
    RANK_3_ACTION_DRL = "RANK_3_ACTION_DRL"
    
    # Tier 3
    RANK_1Q_QAOA_ROUTING = "RANK_1Q_QAOA_ROUTING"
    RANK_1_HGS_ADC = "RANK_1_HGS_ADC"
    RANK_2_ASYM_ALNS = "RANK_2_ASYM_ALNS"
    RANK_3_BPC_PULSE = "RANK_3_BPC_PULSE"
    
    # Tier 4
    RANK_1_PBS_SIPP = "RANK_1_PBS_SIPP"
    RANK_2_DNMPC = "RANK_2_DNMPC"
    RANK_3_CCBS_CL = "RANK_3_CCBS_CL"
    
    FROZEN = "FROZEN"


class HazardClass(str, Enum):
    NONE = "NONE"
    HAZ_A = "HAZ_A"
    HAZ_B = "HAZ_B"
    FLAMMABLE = "FLAMMABLE"
    CORROSIVE = "CORROSIVE"


class StopType(str, Enum):
    DEPOT_START = "DEPOT_START"
    PICKUP = "PICKUP"
    DROP = "DROP"
    CHARGE = "CHARGE"
    DEPOT_END = "DEPOT_END"


class Point3D(NamedTuple):
    x: float
    y: float
    z: float


class Dimensions3D(NamedTuple):
    length: float
    width: float
    height: float


class Pose2D(NamedTuple):
    x: float
    y: float
    theta: float
