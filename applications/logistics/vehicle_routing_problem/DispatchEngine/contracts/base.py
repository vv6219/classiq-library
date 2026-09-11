"""Base immutable strict Pydantic v2 model."""

from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class StrictImmutableDTO(BaseModel):
    """Frozen Pydantic v2 model enforcing strict validation with zero mutation."""
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
        arbitrary_types_allowed=True,
        validate_assignment=True,
        populate_by_name=True,
    )
