"""Unit tests for GraphVisualizer generating publication-grade vector figures."""

import unittest
from DispatchEngine.presentation.graph_visualizer import GraphVisualizer


class TestGraphVisualizer(unittest.TestCase):
    def test_all_graphs_generation(self):
        # 1. Spatial Routing Graph
        depots = [{"id": "D1", "x": 5.0, "y": 5.0}, {"id": "D2", "x": 50.0, "y": 30.0}]
        chutes = [{"id": "C1", "x": 5.0, "y": 30.0}, {"id": "C2", "x": 50.0, "y": 5.0}]
        orders = [{"pickup_pos": {"x": 12.0, "y": 15.0}, "hazard_class": "NONE"}]
        routes = [{"vehicle_id": 1, "stops": [{"pos_x": 5.0, "pos_y": 5.0}, {"pos_x": 12.0, "pos_y": 15.0}]}]
        fig1 = GraphVisualizer.render_spatial_routing_network(depots, orders, chutes, routes)
        self.assertIsNotNone(fig1)
        bytes1 = GraphVisualizer.figure_to_bytes(fig1, fmt="png")
        self.assertGreater(len(bytes1), 1000)

        # 2. 3D LIFO DAG
        nodes = [{"order_id": "ORD-001", "extraction_sequence": 1, "support_surface_ratio": 0.88}]
        edges = []
        fig2 = GraphVisualizer.render_lifo_dag(nodes, edges)
        self.assertIsNotNone(fig2)
        bytes2 = GraphVisualizer.figure_to_bytes(fig2, fmt="png")
        self.assertGreater(len(bytes2), 1000)

        # 3. Chute Accumulation
        ch_data = {"C1": [(0.0, 0.0), (10.0, 1.2), (20.0, 2.1)]}
        fig3 = GraphVisualizer.render_chute_accumulation(ch_data)
        self.assertIsNotNone(fig3)
        bytes3 = GraphVisualizer.figure_to_bytes(fig3, fmt="png")
        self.assertGreater(len(bytes3), 1000)

        # 4. Velocity Curves
        trajs = {"AMR-1": [(0.0, 0.0, False), (10.0, 1.4, False), (20.0, 0.38, True)]}
        fig4 = GraphVisualizer.render_kinematic_velocity_profiles(trajs)
        self.assertIsNotNone(fig4)
        bytes4 = GraphVisualizer.figure_to_bytes(fig4, fmt="png")
        self.assertGreater(len(bytes4), 1000)

        # 5. Quantum QAOA Landscape
        fig5 = GraphVisualizer.render_quantum_qaoa_landscape()
        self.assertIsNotNone(fig5)
        bytes5 = GraphVisualizer.figure_to_bytes(fig5, fmt="png")
        self.assertGreater(len(bytes5), 1000)

        # 6. Benders Convergence
        fig6 = GraphVisualizer.render_benders_convergence([1, 2, 3], [850.0, 920.0, 949.0], [1100.0, 990.0, 949.0])
        self.assertIsNotNone(fig6)
        bytes6 = GraphVisualizer.figure_to_bytes(fig6, fmt="png")
        self.assertGreater(len(bytes6), 1000)


if __name__ == "__main__":
    unittest.main()
