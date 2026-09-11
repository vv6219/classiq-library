"""Pydantic schemas for Executive Presentation Dashboard HUD, Simulation Frames, and Benchmarking."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class VehicleFrameStateSchema(BaseModel):
    vehicle_id: str = Field(..., title="AMR ID", example="AMR_01")
    pos_x: float = Field(..., title="X Position (m)", example=25.4)
    pos_y: float = Field(..., title="Y Position (m)", example=38.2)
    heading_rad: float = Field(..., title="Yaw Orientation (rad)", example=1.57)
    velocity_mps: float = Field(..., title="Linear Velocity (m/s)", example=1.2)
    battery_percent: float = Field(..., title="State of Charge (%)", example=98.5)
    current_action: str = Field(..., title="Operational State", example="TRANSIT_TO_PICKUP")
    carried_orders_count: int = Field(..., title="Orders On-Board", example=5)


class SimulationFrameSchema(BaseModel):
    timestamp_s: float = Field(..., title="Simulation Time (s)", example=12.4)
    frame_index: int = Field(..., title="Frame Sequence Index", example=124)
    active_vehicles: List[VehicleFrameStateSchema] = Field(default_factory=list, title="Fleet Poses")
    chute_queue_depths: Dict[str, int] = Field(default_factory=dict, title="Chute Queue Depths")
    pedestrian_hazard_active: bool = Field(default=False, title="HRI Hazard Active", example=False)


class SimulationFramesResponse(BaseModel):
    wave_id: str = Field(..., title="Wave ID", example="WAVE-2DA292A7")
    total_frames: int = Field(..., title="Total Frame Count", example=200)
    sampling_rate_hz: float = Field(default=10.0, title="Frequency (Hz)", example=10.0)
    duration_sec: float = Field(..., title="Duration (s)", example=20.0)
    frames: List[SimulationFrameSchema] = Field(default_factory=list, title="Animation Frames")


class DashboardHUDResponse(BaseModel):
    wave_id: str = Field(..., title="Wave ID", example="WAVE-2DA292A7")
    operational_mode: str = Field(..., title="Operational Mode", example="QUANTUM")
    total_fleet_makespan_sec: float = Field(..., title="Fleet Makespan (s)", example=949.3)
    total_distance_km: float = Field(..., title="Fleet Distance (km)", example=3.706)
    chute_balance_variance: float = Field(..., title="Chute Balance Variance", example=0.45)
    pack_volume_density_percent: float = Field(..., title="Cargo Bay Volume Utilization (%)", example=78.5)
    hri_throttle_events: int = Field(..., title="Human-Robot Congestion Throttles", example=2)
    falsification_ratio_phi: float = Field(..., title="Falsification Ratio Phi", example=0.88)
    simulation_frames_count: int = Field(..., title="Rendered Simulation Frames", example=200)


class BenchmarkRunRequest(BaseModel):
    scenario_id: Optional[str] = Field(default=None, title="Scenario ID (or generates dynamically)")
    num_orders: int = Field(default=40, ge=10, le=5000, title="Benchmark Orders Count", example=40)
    num_vehicles: int = Field(default=4, ge=1, le=50, title="Fleet AMR Count", example=4)
    seed: int = Field(default=42, title="Seed", example=42)


class BenchmarkComparisonResponse(BaseModel):
    scenario_id: str = Field(..., title="Scenario ID")
    algorithms_evaluated: List[str] = Field(..., title="Algorithms Evaluated")
    makespan_by_algo: Dict[str, float] = Field(..., title="Makespan by Algorithm (s)")
    distance_by_algo: Dict[str, float] = Field(..., title="Distance by Algorithm (km)")
    chute_variance_by_algo: Dict[str, float] = Field(..., title="Chute Variance by Algorithm")
    latency_by_algo: Dict[str, float] = Field(..., title="Latency by Algorithm (s)")
    improvement_makespan_percent: float = Field(..., title="Quantum Makespan Improvement (%)", example=21.4)
    improvement_distance_percent: float = Field(..., title="Quantum Distance Improvement (%)", example=21.8)


class RegressionTestRequest(BaseModel):
    baseline_run_id: str = Field(..., title="Baseline Run ID", example="RUN-933D5052")
    candidate_run_id: str = Field(..., title="Candidate Run ID", example="RUN-C094BAD5")
    threshold_percent: float = Field(default=5.0, gt=0.0, title="Degradation Threshold (%)", example=5.0)


class RegressionTestResponse(BaseModel):
    baseline_run_id: str = Field(..., title="Baseline Run ID")
    candidate_run_id: str = Field(..., title="Candidate Run ID")
    has_regressed: bool = Field(..., title="Regression Detected", example=False)
    makespan_delta_percent: float = Field(..., title="Makespan Delta (%)", example=-1.2)
    latency_delta_percent: float = Field(..., title="Latency Delta (%)", example=0.5)
