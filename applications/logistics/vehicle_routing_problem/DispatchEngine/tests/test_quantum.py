"""Unit tests for Classiq Quantum Co-Processor Subsystem."""

import unittest
import numpy as np
from DispatchEngine.quantum.kernels import compute_classical_swap_fidelity, compute_quantum_distance_matrix
from DispatchEngine.quantum.qaoa_circuits import solve_qaoa_subtour
from DispatchEngine.quantum.investigator import ClassiqCircuitInvestigator


class TestQuantum(unittest.TestCase):
    def test_swap_test_fidelity(self):
        vec_a = [0.2, 0.5, 0.8]
        vec_b = [0.2, 0.5, 0.8]
        fid_identical = compute_classical_swap_fidelity(vec_a, vec_b)
        self.assertTrue(np.isclose(fid_identical, 1.0, atol=1e-3))

        vec_c = [0.9, 0.1, 0.0]
        fid_different = compute_classical_swap_fidelity(vec_a, vec_c)
        self.assertTrue(fid_different < 1.0)

    def test_qaoa_subtour_investigator(self):
        dist_mat = np.array([
            [0.0, 5.0, 10.0],
            [5.0, 0.0, 4.0],
            [10.0, 4.0, 0.0],
        ])
        qaoa_res = solve_qaoa_subtour(dist_mat)
        self.assertEqual(qaoa_res.circuit_width, 3)
        self.assertGreaterEqual(qaoa_res.approximation_ratio, 0.85)

        investigation = ClassiqCircuitInvestigator.inspect_qaoa_results(qaoa_res)
        self.assertIn("shannon_entropy", investigation)
        self.assertEqual(investigation["circuit_width_qubits"], 3)


if __name__ == "__main__":
    unittest.main()
