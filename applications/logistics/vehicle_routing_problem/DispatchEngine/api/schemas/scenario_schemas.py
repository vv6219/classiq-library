"""Pydantic schemas for warehouse scenarios, archetypes, and synthetic mock generation."""

from __future__ import annotations
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from DispatchEngine.storage.mock_generator import ScenarioArchetype


class MockScenarioCreateRequest(BaseModel):
    scenario_name: str = Field(
        default="Synthetic-Wave-01",
        title="Scenario Name",
        description="Unique descriptive identifier for the warehouse wave scenario.",
        example="Wave-2026-Pareto-ZoneA",
    )
    archetype: ScenarioArchetype = Field(
        default=ScenarioArchetype.PARETO_HOT_ZONE,
        title="Scenario Archetype",
        description="Spatial and temporal distribution pattern governing order arrivals, SKU locations, and congestion zones.",
        example=ScenarioArchetype.PARETO_HOT_ZONE,
    )
    num_orders: int = Field(
        default=80,
        ge=10,
        le=35000,
        title="Total Customer Orders",
        description="Number of distinct customer SKU picking lines generated in the order pool (supports 10 to 35,000).",
        example=80,
    )
    num_vehicles: int = Field(
        default=4,
        ge=1,
        le=100,
        title="Active AMRs (Fleet Size)",
        description="Number of Autonomous Mobile Robots available for dispatch.",
        example=4,
    )
    num_depots: int = Field(
        default=2,
        ge=1,
        le=10,
        title="Depot Count",
        description="Number of replenishment/dispatch depots situated across the warehouse perimeter.",
        example=2,
    )
    num_chutes: int = Field(
        default=2,
        ge=1,
        le=10,
        title="Consolidation Chute Count",
        description="Number of packing and consolidation chutes receiving picked items.",
        example=2,
    )
    hazard_ratio: float = Field(
        default=0.10,
        ge=0.0,
        le=1.0,
        title="Hazardous Materials Ratio",
        description="Fraction of orders classified under FLAMMABLE, CORROSIVE, HAZ_A, or HAZ_B chemical classes.",
        example=0.10,
    )
    seed: int = Field(
        default=42,
        title="Deterministic Pseudorandom Seed",
        description="RNG seed ensuring exact replication of warehouse topologies and order coordinates.",
        example=42,
    )


class PresetScenarioCreateRequest(BaseModel):
    preset_name: str = Field(
        default="pareto-cluster-200",
        title="Canonical Preset Name",
        description="Name of predefined benchmark scenario preset ('small-smoke-40', 'pareto-cluster-200', 'hazmat-heavy-500', 'surge-deadline-1000', 'enterprise-35k').",
        example="pareto-cluster-200",
    )


class Point3DSchema(BaseModel):
    x: float = Field(..., title="X Coordinate (m)", example=25.5)
    y: float = Field(..., title="Y Coordinate (m)", example=40.0)
    z: float = Field(..., title="Z Coordinate (m)", example=1.8)


class Dimensions3DSchema(BaseModel):
    length: float = Field(..., title="Length (m)", example=0.35)
    width: float = Field(..., title="Width (m)", example=0.25)
    height: float = Field(..., title="Height (m)", example=0.15)


class OrderLineSchema(BaseModel):
    order_id: str = Field(..., title="Order ID", example="ORD_00001")
    sku_id: str = Field(..., title="SKU ID", example="SKU_4912")
    depot_id: str = Field(..., title="Origin Depot ID", example="DEPOT_1")
    aisle_id: str = Field(..., title="Aisle ID", example="AISLE_03")
    pickup_pos: Point3DSchema = Field(..., title="3D Pickup Coordinates (m)")
    drop_chute_id: str = Field(..., title="Destination Chute ID", example="CHUTE_1")
    mass_kg: float = Field(..., gt=0.0, title="Mass (kg)", example=4.5)
    volume_m3: float = Field(..., gt=0.0, title="Volume (m^3)", example=0.0131)
    dimensions_m: Dimensions3DSchema = Field(..., title="3D Dimensions (m)")
    open_window_start: float = Field(..., ge=0.0, title="Earliest Open Time (s)", example=12.0)
    drop_deadline: float = Field(..., ge=0.0, title="Hard Delivery Deadline (s)", example=420.0)
    hazard_class: str = Field(..., title="Hazard Category", example="NONE")
    sla_priority: float = Field(..., ge=0.0, le=1.0, title="SLA Priority Weight", example=0.85)


class ScenarioDetailResponse(BaseModel):
    scenario_id: str = Field(..., title="Scenario ID", example="SCEN-D148745B")
    name: str = Field(..., title="Scenario Name", example="Wave-2026-Pareto-ZoneA")
    archetype: str = Field(default="PARETO_HOT_ZONE", title="Archetype", example="PARETO_HOT_ZONE")
    created_at: str = Field(..., title="Creation Timestamp")
    random_seed: int = Field(..., title="Seed", example=42)
    order_count: int = Field(..., title="Total Orders", example=80)
    fleet_size: int = Field(..., title="Fleet AMRs", example=4)
    depot_count: int = Field(..., title="Depot Count", example=2)
    chute_count: int = Field(..., title="Chute Count", example=2)
    is_mock: bool = Field(default=True, title="Mock Flag", example=True)


class ArchetypeInfoResponse(BaseModel):
    archetype_key: str = Field(..., title="Archetype Identifier", example="PARETO_HOT_ZONE")
    title: str = Field(..., title="Archetype Display Name", example="Pareto Hot Zone (80/20)")
    description: str = Field(..., title="Distribution Physics & Characteristics")
    stress_target: str = Field(..., title="Targeted Optimization Stress Tier")
