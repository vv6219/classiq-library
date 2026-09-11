"""Pydantic schemas for isolated step-through execution of Tiers 1 through 4."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Tier1BatchingRequest(BaseModel):
    scenario_id: Optional[str] = Field(default=None, title="Scenario ID")
    num_vehicles: int = Field(default=4, ge=1, title="Vehicle Fleet Count", example=4)
    use_quantum: bool = Field(default=True, title="Use Quantum-FCM Kernel", example=True)


class VehicleBatchSummarySchema(BaseModel):
    vehicle_id: str = Field(..., title="Vehicle ID", example="AMR_01")
    assigned_orders_count: int = Field(..., title="Assigned Orders Count", example=20)
    total_mass_kg: float = Field(..., title="Total Batch Mass (kg)", example=62.4)
    total_volume_m3: float = Field(..., title="Total Batch Volume (m^3)", example=0.48)
    assigned_chute_id: str = Field(..., title="Chute ID", example="CHUTE_1")


class Tier1BatchingResponse(BaseModel):
    wave_id: str = Field(..., title="Wave ID")
    batches: List[VehicleBatchSummarySchema] = Field(..., title="Vehicle Batches")
    chute_balance_variance: float = Field(..., title="Chute Balance Variance", example=0.45)
    algorithm_used: str = Field(..., title="Algorithm Used", example="RANK_1Q_QUANTUM_FCM")


class Tier2PackingRequest(BaseModel):
    batch_index: int = Field(default=0, ge=0, title="Vehicle Batch Index to Pack", example=0)
    bay_dimensions_m: List[float] = Field(default=[1.2, 0.8, 1.0], title="Vehicle Cargo Bay [L, W, H] (m)")


class PackedItemPlacementSchema(BaseModel):
    order_id: str = Field(..., title="Order ID", example="ORD_00001")
    corner_pos: List[float] = Field(..., title="Bottom-Front-Left Corner [x, y, z] (m)")
    dimensions_m: List[float] = Field(..., title="Item Dimensions [L, W, H] (m)")
    support_ratio: float = Field(..., title="Support Surface Contact Ratio", example=0.95)


class Tier2PackingResponse(BaseModel):
    vehicle_id: str = Field(..., title="Vehicle ID", example="AMR_01")
    total_packed_items: int = Field(..., title="Packed Items Count", example=20)
    volume_utilization_ratio: float = Field(..., title="Volume Utilization (0..1)", example=0.785)
    center_of_mass: List[float] = Field(..., title="Center of Mass [x, y, z] (m)")
    lifo_dag_edges_count: int = Field(..., title="LIFO Extraction Precedence Edges Count", example=18)
    is_acyclic: bool = Field(..., title="Acyclic LIFO Graph Flag", example=True)


class Tier3RoutingRequest(BaseModel):
    use_qaoa_subtour: bool = Field(default=True, title="Apply QAOA Subtour Optimization", example=True)


class Tier3RoutingResponse(BaseModel):
    total_fleet_makespan_sec: float = Field(..., title="Total Fleet Makespan (s)", example=949.3)
    total_distance_km: float = Field(..., title="Total Distance (km)", example=3.706)
    routes_count: int = Field(..., title="Generated Routes Count", example=4)


class Tier4KinematicsRequest(BaseModel):
    discretization_step_s: float = Field(default=0.1, gt=0.0, le=1.0, title="Time Step (s)", example=0.1)


class Tier4KinematicsResponse(BaseModel):
    total_trajectories_count: int = Field(..., title="Trajectories Count", example=4)
    time_horizon_sec: float = Field(..., title="Simulation Time Horizon (s)", example=949.3)
    corridor_reservations_count: int = Field(..., title="Swept Corridor Spatial Reservations", example=48)
    hri_speed_throttle_events: int = Field(..., title="Pedestrian Hazard Throttle Events", example=2)
