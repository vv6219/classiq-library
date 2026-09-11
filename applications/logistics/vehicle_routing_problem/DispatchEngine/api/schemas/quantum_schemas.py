"""Pydantic schemas for Classiq quantum co-processor hooks, fidelity, QAOA, and telemetry."""

from __future__ import annotations
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SwapTestRequest(BaseModel):
    vector_a: List[float] = Field(
        default=[0.3, 0.4, 0.5, 0.6],
        title="Feature Vector A",
        description="Normalized classical feature vector encoding order SKU spatial and physical attributes.",
        example=[0.3, 0.4, 0.5, 0.6],
    )
    vector_b: List[float] = Field(
        default=[0.32, 0.38, 0.49, 0.61],
        title="Feature Vector B",
        description="Normalized classical feature vector for comparative state overlap.",
        example=[0.32, 0.38, 0.49, 0.61],
    )
    shots: int = Field(
        default=2048,
        ge=128,
        le=65536,
        title="Measurement Shots",
        description="Quantum circuit execution sample shots.",
        example=2048,
    )


class SwapTestResponse(BaseModel):
    state_fidelity: float = Field(..., title="Quantum State Fidelity |<A|B>|^2", example=0.9982)
    quantum_distance: float = Field(..., title="Quantum F-Means Distance Metric", example=0.0600)
    shots_evaluated: int = Field(..., title="Shots Count", example=2048)
    circuit_depth: int = Field(..., title="Circuit Depth", example=14)
    qubits_used: int = Field(..., title="Qubit Count", example=5)
    execution_time_ms: float = Field(..., title="Execution Duration (ms)", example=3.2)


class QuantumDistanceMatrixRequest(BaseModel):
    features: List[List[float]] = Field(
        default=[[0.1, 0.2], [0.3, 0.4], [0.8, 0.9]],
        title="Feature Vectors List",
        description="Collection of order feature vectors.",
    )
    shots: int = Field(default=1024, ge=128, title="Shots per Element")


class QuantumDistanceMatrixResponse(BaseModel):
    dimension: int = Field(..., title="Matrix Dimension (N x N)", example=3)
    distance_matrix: List[List[float]] = Field(..., title="Quantum Kernel Distance Matrix")
    total_circuits_simulated: int = Field(..., title="Total Pairwise Quantum Circuits", example=6)


class QAOASubtourRequest(BaseModel):
    cost_matrix: List[List[float]] = Field(
        default=[
            [0.0, 12.5, 18.2, 9.4],
            [12.5, 0.0, 14.1, 11.0],
            [18.2, 14.1, 0.0, 15.6],
            [9.4, 11.0, 15.6, 0.0],
        ],
        title="Cost Matrix (N x N)",
        description="Inter-node distance / travel time metric across cluster nodes.",
    )
    p_steps: int = Field(default=2, ge=1, le=10, title="QAOA Alternating Operator Depth (p)", example=2)
    shots: int = Field(default=2048, ge=256, title="Sampling Shots", example=2048)


class QAOASubtourResponse(BaseModel):
    optimal_sequence: List[int] = Field(..., title="Optimal Subtour Node Permutation", example=[0, 3, 1, 2, 0])
    subtour_cost: float = Field(..., title="Total Route Subtour Cost", example=50.1)
    best_bitstring: str = Field(..., title="Measured Bitstring", example="100110")
    variational_energy: float = Field(..., title="Hamiltonian Expectation Energy <H_C>", example=-42.85)
    shannon_entropy: float = Field(..., title="Bitstring Distribution Shannon Entropy", example=2.14)
    circuit_width_qubits: int = Field(..., title="Qubit Width", example=16)
    circuit_depth: int = Field(..., title="Synthesized Circuit Depth", example=48)
    cx_gate_count: int = Field(..., title="Two-Qubit CX Gates Count", example=64)


class QuantumCircuitProfileResponse(BaseModel):
    job_id: str = Field(..., title="Classiq Job ID", example="JOB-QC-9921")
    backend_name: str = Field(..., title="Target Quantum Hardware / Simulator", example="classiq_simulator")
    circuit_width_qubits: int = Field(..., title="Qubit Count", example=16)
    circuit_depth: int = Field(..., title="Circuit Depth", example=48)
    cx_gate_count: int = Field(..., title="Entangling CX Gates", example=64)
    sampled_bitstrings_count: int = Field(..., title="Sampled Bitstrings", example=2048)
    variational_energy: float = Field(..., title="Variational Energy", example=-42.85)
    execution_time_ms: float = Field(..., title="Execution Time (ms)", example=12.4)
