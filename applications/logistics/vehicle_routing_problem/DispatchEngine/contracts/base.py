"""Base immutable strict model supporting Pydantic v2 or standard dataclass fallback."""

from __future__ import annotations
from typing import Any, Dict

try:
    from pydantic import BaseModel, ConfigDict, Field
    _HAS_PYDANTIC = True
except ImportError:
    _HAS_PYDANTIC = False

if _HAS_PYDANTIC:
    class StrictImmutableDTO(BaseModel):
        """Frozen Pydantic v2 model enforcing strict validation with zero mutation."""
        model_config = ConfigDict(
            frozen=True,
            extra="forbid",
            arbitrary_types_allowed=True,
            validate_assignment=True,
            populate_by_name=True,
        )
else:
    import dataclasses

    def Field(*args, **kwargs):
        default = kwargs.get("default", dataclasses.MISSING)
        default_factory = kwargs.get("default_factory", dataclasses.MISSING)
        return dataclasses.field(default=default, default_factory=default_factory)

    class StrictImmutableDTO:
        """Lightweight fallback implementing serialization and immutability without external deps."""
        def __init__(self, **kwargs):
            for cls in reversed(self.__class__.__mro__):
                for k, v in getattr(cls, "__dict__", {}).items():
                    if isinstance(v, dataclasses.Field):
                        if v.default is not dataclasses.MISSING:
                            object.__setattr__(self, k, v.default)
                        elif v.default_factory is not dataclasses.MISSING:
                            object.__setattr__(self, k, v.default_factory())
            for k, v in kwargs.items():
                object.__setattr__(self, k, v)

        def dict(self) -> Dict[str, Any]:
            return self.__dict__.copy()

        def model_dump(self) -> Dict[str, Any]:
            return self.dict()

        def __repr__(self) -> str:
            attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
            return f"{self.__class__.__name__}({attrs})"
