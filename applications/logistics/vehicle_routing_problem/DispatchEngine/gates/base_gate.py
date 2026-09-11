"""Abstract base class for invariant validation gates."""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Tuple, Optional, Any, Dict
from dataclasses import dataclass


@dataclass(frozen=True)
class GateValidationResult:
    is_valid: bool
    gate_name: str
    failure_reason: Optional[str] = None
    violation_metrics: Optional[Dict[str, Any]] = None


class BaseValidationGate(ABC):
    @abstractmethod
    def validate(self, artifact: Any) -> GateValidationResult:
        """Evaluate mathematical invariant assertions on artifact."""
        ...
