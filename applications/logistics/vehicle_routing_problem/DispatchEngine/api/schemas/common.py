"""Common API envelopes, error structures, and pagination models."""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Generic, TypeVar, Optional, List, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponseEnvelope(BaseModel, Generic[T]):
    status: str = Field(
        default="success",
        title="Status Code",
        description="Outcome of the API request ('success' or 'error').",
        example="success",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        title="Response Timestamp",
        description="ISO 8601 UTC timestamp of response generation.",
        example="2026-09-12T00:00:00.000000Z",
    )
    trace_id: str = Field(
        default="00000000000000000000000000000000",
        title="Distributed Trace ID",
        description="128-bit hexadecimal trace identifier for OpenTelemetry correlation.",
        example="4bf92f3577b34da6a3ce929d0e0e4736",
    )
    execution_time_ms: float = Field(
        default=0.0,
        ge=0.0,
        title="Execution Latency (ms)",
        description="Server-side processing duration in milliseconds.",
        example=14.5,
    )
    data: Optional[T] = Field(
        default=None,
        title="Payload",
        description="Response data container payload.",
    )
    error: Optional[Dict[str, Any]] = Field(
        default=None,
        title="Error Container",
        description="Details when status is 'error', following RFC 7807 problem details format.",
    )


class PaginationMeta(BaseModel):
    page: int = Field(default=1, ge=1, title="Current Page Number", example=1)
    page_size: int = Field(default=50, ge=1, le=1000, title="Page Size Limit", example=50)
    total_count: int = Field(default=0, ge=0, title="Total Elements Count", example=200)
    total_pages: int = Field(default=1, ge=1, title="Total Pages Count", example=4)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(default_factory=list, title="Page Items")
    pagination: PaginationMeta = Field(..., title="Pagination Metadata")
