"""Deep Classiq Quantum Circuit Profiler and Telemetry Inspector."""

from __future__ import annotations
import numpy as np
from typing import Dict, Any
from DispatchEngine.contracts.quantum_dto import QAOAResultsDTO


class ClassiqCircuitInvestigator:
    """Profiles gate depth, 2-qubit CX overhead, and QAOA convergence."""

    @staticmethod
    def inspect_qaoa_results(results: QAOAResultsDTO) -> Dict[str, Any]:
        bitstrings = results.sampled_bitstrings
        total_shots = sum(bitstrings.values())

        # Compute Shannon Entropy
        probs = [count / total_shots for count in bitstrings.values() if count > 0]
        entropy = -sum(p * np.log2(p) for p in probs)

        # Top bitstring
        top_state = max(bitstrings.items(), key=lambda x: x[1])

        return {
            "circuit_width_qubits": results.circuit_width,
            "circuit_depth": results.circuit_depth,
            "cx_gate_count": results.cx_gate_count,
            "shannon_entropy": float(entropy),
            "dominant_bitstring": top_state[0],
            "dominant_shots": top_state[1],
            "approximation_ratio": results.approximation_ratio,
            "execution_latency_ms": results.execution_latency_ms,
        }
