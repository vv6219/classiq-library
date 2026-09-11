"""Classiq Quantum Co-Processor DTOs."""

from __future__ import annotations
from typing import Tuple, Dict, Optional
from pydantic import Field
from DispatchEngine.contracts.base import StrictImmutableDTO


class QuantumCircuitSpecDTO(StrictImmutableDTO):
    circuit_name: str
    num_qubits: int = Field(le=32)
    p_layers: int = 2
    optimization_parameter: str = "depth"
    backend_target: str = "classiq_simulator"


class SwapTestFidelityDTO(StrictImmutableDTO):
    state_fidelity: float
    quantum_distance: float
    shots_evaluated: int = 2048
    circuit_depth: int = 14
    qubits_used: int = 5
    execution_time_ms: float = 3.2


class QuantumKernelMatrixDTO(StrictImmutableDTO):
    wave_id: str
    matrix_dimension: int
    fidelity_matrix: Tuple[Tuple[float, ...], ...]
    quantum_distance_matrix: Tuple[Tuple[float, ...], ...]
    shots_evaluated: int = 1024
    backend_used: str = "classiq_simulator"


class QAOAResultsDTO(StrictImmutableDTO):
    job_id: str
    circuit_width: int
    circuit_depth: int
    cx_gate_count: int
    sampled_bitstrings: Dict[str, int]
    optimal_gamma: Tuple[float, ...]
    optimal_beta: Tuple[float, ...]
    expected_hamiltonian_cost: float
    approximation_ratio: float = Field(default=0.85, ge=0.0, le=1.0)
    execution_latency_ms: float


class ClassiqTelemetryDTO(StrictImmutableDTO):
    backend_name: str
    queue_latency_sec: float
    qubit_fidelity_avg: float = 0.99
    is_qpu_online: bool = True
