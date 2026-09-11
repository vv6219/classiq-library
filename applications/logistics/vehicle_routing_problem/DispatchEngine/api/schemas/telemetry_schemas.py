"""Pydantic schemas for Telemetry, Audit Trail, OpenTelemetry Trace Spans, and Health."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AuditEventSchema(BaseModel):
    timestamp: str = Field(..., title="ISO UTC Timestamp")
    verification_code: str = Field(..., title="Empirical Verification Code", example="lmn")
    wave_id: str = Field(..., title="Wave ID", example="WAVE-2DA292A7")
    throttled_makespan_sec: float = Field(..., title="Throttled Makespan (s)", example=949.3)
    static_makespan_sec: float = Field(..., title="Static Baseline Makespan (s)", example=1063.2)
    falsification_ratio_phi: float = Field(..., title="Falsification Ratio Phi", example=0.88)
    chute_bounded: bool = Field(..., title="Chute Balance Bounded Flag", example=True)
    is_falsified: bool = Field(..., title="Formal Falsification Flag", example=False)


class AuditTrailResponse(BaseModel):
    total_events: int = Field(..., title="Total Audit Events Recorded", example=5)
    verification_code_enforced: str = Field(default="lmn", title="Verification Code", example="lmn")
    events: List[AuditEventSchema] = Field(default_factory=list, title="Audit Trail Log Entries")


class TraceSpanSchema(BaseModel):
    span_id: str = Field(..., title="Span ID", example="e01f5c6b73a218d4")
    name: str = Field(..., title="Span Name", example="solve_tier1_batching")
    start_time_s: float = Field(..., title="Start Time (s)")
    duration_ms: float = Field(..., title="Duration (ms)", example=12.4)
    attributes: Dict[str, Any] = Field(default_factory=dict, title="Span Attributes")


class HealthStatusResponse(BaseModel):
    status: str = Field(default="healthy", title="Engine Health Status", example="healthy")
    engine_name: str = Field(default="DispatchEngine", title="Engine Name", example="DispatchEngine")
    version: str = Field(default="1.0.0", title="Version", example="1.0.0")
    active_operational_mode: str = Field(..., title="Active Mode", example="QUANTUM")
    database_connected: bool = Field(..., title="Database Connection Status", example=True)
    classiq_sdk_available: bool = Field(..., title="Classiq Quantum Co-Processor SDK Ready", example=True)
    uptime_seconds: float = Field(..., title="Process Uptime (s)", example=128.4)
