import unittest
import numpy as np

from wms_quantum_optimization_pipeline import OrderLocation
from wms_quantum_fmeans import (
    QuantumFMeans,
    quantum_fidelity_distance,
    entropy_rebalance_clusters,
    fuzzy_route_cluster_pipeline,
)


class TestQuantumFMeans(unittest.TestCase):

    def setUp(self):
        self.orders = [
            OrderLocation(2.0, 5.0, 1.0, 11.0, 13.0, 0.9, 0.2),
            OrderLocation(3.0, 4.0, 1.5, 8.0, 10.0, 0.7, 0.3),
            OrderLocation(8.0, 7.0, 1.0, 15.0, 14.0, 0.8, 0.5),
            OrderLocation(9.0, 6.0, 2.0, 10.0, 12.0, 0.6, 0.4),
            OrderLocation(14.0, 10.0, 1.8, 18.0, 18.0, 0.9, 0.7),
            OrderLocation(15.0, 9.0, 1.5, 14.0, 16.0, 0.8, 0.6),
            OrderLocation(18.0, 14.0, 2.1, 12.0, 17.0, 0.95, 0.8),
            OrderLocation(12.0, 18.0, 1.2, 16.0, 18.0, 0.7, 0.9),
            OrderLocation(21.0, 8.0, 1.4, 9.0, 11.0, 0.6, 0.5),
            OrderLocation(24.0, 12.0, 1.9, 14.0, 15.0, 0.8, 0.7),
        ]

    def test_quantum_fidelity_distance(self):
        a = np.array([1.0, 0.0, 0.0])
        b = np.array([1.0, 0.0, 0.0])
        c = np.array([0.0, 1.0, 0.0])
        self.assertAlmostEqual(quantum_fidelity_distance(a, b), 0.0, places=5)
        self.assertAlmostEqual(quantum_fidelity_distance(a, c), 1.0, places=5)

    def test_membership_probabilities_sum_to_one(self):
        k = 3
        qfcm = QuantumFMeans(n_clusters=k, m=2.0)
        qfcm.fit(self.orders)
        U = qfcm.membership_matrix_
        self.assertIsNotNone(U)
        self.assertEqual(U.shape, (len(self.orders), k))
        for row in U:
            self.assertAlmostEqual(float(np.sum(row)), 1.0, places=5)
            self.assertTrue(np.all(row >= 0.0))
            self.assertTrue(np.all(row <= 1.0))

    def test_entropy_and_rebalance(self):
        k = 3
        qfcm = QuantumFMeans(n_clusters=k, m=2.0)
        qfcm.fit(self.orders)
        entropies = qfcm.get_cluster_entropy()
        self.assertEqual(len(entropies), len(self.orders))
        self.assertTrue(np.all(entropies >= 0.0))

        rebalanced = entropy_rebalance_clusters(
            self.orders, qfcm.membership_matrix_, k_batches=k, vehicle_capacity=50.0
        )
        self.assertEqual(len(rebalanced), len(self.orders))

    def test_fuzzy_route_cluster_pipeline(self):
        pipeline = fuzzy_route_cluster_pipeline(
            self.orders, k_batches=3, vehicle_capacity=80.0, m=2.0
        )
        self.assertIn("centers", pipeline)
        self.assertIn("cluster_labels", pipeline)
        self.assertIn("memberships", pipeline)
        self.assertIn("entropies", pipeline)
        self.assertIn("route_blocks", pipeline)
        self.assertEqual(len(pipeline["cluster_labels"]), len(self.orders))


if __name__ == "__main__":
    unittest.main()
