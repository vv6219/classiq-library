"""Pydantic schemas for wave orchestration, dispatch schedules, and execution records."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from DispatchEngine.common_types import OperationalMode


class WaveDispatchRequest(BaseModel):
    scenario_id: Optional[str] = Field(
        default=None,
        title="Existing Scenario ID",
        description="ID of a pre-persisted scenario to solve. If null, a fresh scenario is generated using the inline configuration.",
        example="SCEN-D148745B",
    )
    num_orders: int = Field(
        default=80,
        ge=10,
        le=35000,
        title="Order Count",
        description="Orders count if generating dynamically.",
        example=80,
    )
    num_vehicles: int = Field(
        default=4,
        ge=1,
        le=100,
        title="Fleet Vehicles",
        description="Number of AMRs deployed.",
        example=4,
    )
    operational_mode: OperationalMode = Field(
        default=OperationalMode.QUANTUM,
        title="Operational Mode Override",
        description="Forces specific operational mode or allows automated context selection.",
        example=OperationalMode.QUANTUM,
    )
    seed: int = Field(
        default=42,
        title="RNG Seed",
        description="Random seed for repeatable synthetic dispatch.",
        example=42,
    )
    enable_benders_recourse: bool = Field(
        default=True,
        title="Enable Benders Recourse Loop",
        description="Enables feedback loops between Tier 2/3/4 and Tier 1 if capacity, LIFO, or time windows fail.",
        example=True,
    )


class VehicleRouteSummarySchema(BaseModel):
    vehicle_id: str = Field(..., title="Vehicle ID", example="AMR_01")
    origin_depot: str = Field(..., title="Depot ID", example="DEPOT_1")
    stops_count: int = Field(..., title="Total Stops", example=22)
    route_makespan_sec: float = Field(..., title="Makespan (s)", example=949.3)
    route_distance_km: float = Field(..., title="Distance (km)", example=1.85)
    carried_mass_kg: float = Field(..., title="Carried Mass (kg)", example=62.4)
    packed_volume_m3: float = Field(..., title="Packed Volume (m^3)", example=0.48)
    sla_violations: int = Field(default=0, title="SLA Violations", example=0)


class WaveDispatchResponse(BaseModel):
    run_id: str = Field(..., title="Execution Run ID", example="RUN-933D5052")
    scenario_id: str = Field(..., title="Scenario ID", example="SCEN-D148745B")
    wave_id: str = Field(..., title="Wave ID", example="WAVE-2DA292A7")
    operational_mode: str = Field(..., title="Active Mode", example="QUANTUM")
    algorithm_ranks_used: Dict[str, str] = Field(..., title="Algorithm Ranks per Tier")
    total_fleet_makespan_sec: float = Field(..., title="Fleet Makespan (s)", example=949.3)
    total_distance_km: float = Field(..., title="Total Fleet Distance (km)", example=3.706)
    chute_balance_variance: float = Field(..., title="Chute Balance Variance", example=0.45)
    total_solve_latency_sec: float = Field(..., title="Total Solution Latency (s)", example=0.14)
    falsification_ratio_phi: float = Field(..., title="Falsification Ratio Phi", example=0.88)
    is_falsified: bool = Field(..., title="Falsification Flag", example=False)
    routes: List[VehicleRouteSummarySchema] = Field(default_factory=list, title="Vehicle Routes")
