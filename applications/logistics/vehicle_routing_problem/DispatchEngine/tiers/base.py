"""Abstract base class for tier solvers across the four-tier hierarchy."""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Any
from DispatchEngine.common_types import AlgorithmRank

InputDTO = TypeVar("InputDTO")
OutputDTO = TypeVar("OutputDTO")


class BaseTierSolver(ABC, Generic[InputDTO, OutputDTO]):
    def __init__(self, rank: AlgorithmRank, timeout_sec: float):
        self.rank = rank
        self.timeout_sec = timeout_sec

    @abstractmethod
    def validate_input(self, data: InputDTO) -> bool:
        """Validate prerequisites before execution."""
        ...

    @abstractmethod
    def solve(self, data: InputDTO) -> OutputDTO:
        """Execute core optimization solver."""
        ...

    @abstractmethod
    def fallback(self, data: InputDTO, failure_reason: str) -> OutputDTO:
        """Execute deterministic step-down fallback solver on failure/timeout."""
        ...
