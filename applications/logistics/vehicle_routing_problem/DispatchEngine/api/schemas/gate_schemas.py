"""Pydantic schemas for Invariant Validation Gates 1 through 4 and analytical Benders recourse."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class BendersCutSchema(BaseModel):
    cut_id: str = Field(..., title="Cut ID", example="CUT_T2_T1_001")
    source_tier: int = Field(..., title="Originating Subproblem Tier", example=2)
    target_tier: int = Field(..., title="Target Master Problem Tier", example=1)
    cut_type: str = Field(..., title="Cut Formulation", example="FEASIBILITY")
    violation_code: str = Field(..., title="Invariant Violation Identifier", example="ERR_BAY_VOLUME_EXCEEDED")
    mathematical_formulation: str = Field(..., title="Linear Benders Inequality String")


class GateValidationRequest(BaseModel):
    gate_number: int = Field(..., ge=1, le=4, title="Gate Number (1, 2, 3, or 4)", example=1)
    scenario_id: Optional[str] = Field(default=None, title="Scenario ID for Context Lookup")
    validation_payload: Dict[str, Any] = Field(default_factory=dict, title="Tier Solution Data Payload to Validate")


class GateValidationResponse(BaseModel):
    gate_number: int = Field(..., title="Gate Number", example=1)
    gate_name: str = Field(..., title="Formal Invariant Gate Name", example="Gate 1: Capacity & Chute Balance")
    is_valid: bool = Field(..., title="Invariant Validation Result", example=True)
    violation_codes: List[str] = Field(default_factory=list, title="Detected Violation Codes")
    metrics: Dict[str, float] = Field(default_factory=dict, title="Calculated Physical & Balance Metrics")
    recommended_benders_cut: Optional[BendersCutSchema] = Field(default=None, title="Synthesized Benders Recourse Cut")
