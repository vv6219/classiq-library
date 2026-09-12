import os
import sys
import math

# Ensure repository root is on sys.path
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from DispatchEngine.presentation.graph_visualizer import GraphVisualizer

GRAPH_TYPES = [
    "spatial",
    "lifo",
    "chutes",
    "velocity",
    "qaoa",
    "benders",
    "packing_3d",
    "battery_soc",
    "spatiotemporal_heatmap",
]

def generate_figure(graph_type: str):
    if graph_type == "spatial":
        depots = [{"id": "D1", "x": 5.0, "y": 5.0}, {"id": "D2", "x": 50.0, "y": 30.0}]
        chutes = [{"id": "C1", "x": 5.0, "y": 30.0}, {"id": "C2", "x": 50.0, "y": 5.0}]
        orders = [{"pickup_pos": {"x": 10 + (i * 4) % 40, "y": 8 + (i * 3) % 22}, "hazard_class": "NONE"} for i in range(25)]
        routes = [{"vehicle_id": i + 1, "stops": [{"pos_x": 5 + i * 10 + j * 3, "pos_y": 5 + j * 4} for j in range(5)]} for i in range(4)]
        return GraphVisualizer.render_spatial_routing_network(depots, orders, chutes, routes)
    elif graph_type == "lifo":
        nodes = [{"order_id": f"ORD-{i:03d}", "extraction_sequence": (i % 3) + 1, "support_surface_ratio": 0.85} for i in range(9)]
        edges = [(f"ORD-{i:03d}", f"ORD-{i+1:03d}") for i in range(0, 8, 2)]
        return GraphVisualizer.render_lifo_dag(nodes, edges)
    elif graph_type == "chutes":
        pts1 = [(float(t), 2.5 * (1.0 - math.exp(-t / 30.0))) for t in range(0, 100, 5)]
        pts2 = [(float(t), 2.0 * (1.0 - math.exp(-t / 35.0))) for t in range(0, 100, 5)]
        return GraphVisualizer.render_chute_accumulation({"C1": pts1, "C2": pts2})
    elif graph_type == "velocity":
        t_pts = [(float(t), min(1.5, 1.4 * math.sin(t / 8.0) + 0.3 if not (35 <= t <= 55) else 0.38), 35 <= t <= 55) for t in range(0, 100, 2)]
        return GraphVisualizer.render_kinematic_velocity_profiles({"1": t_pts})
    elif graph_type == "qaoa":
        return GraphVisualizer.render_quantum_qaoa_landscape()
    elif graph_type == "benders":
        return GraphVisualizer.render_benders_convergence(
            [1, 2, 3, 4, 5],
            [820.0, 890.0, 930.0, 945.0, 949.3],
            [1150.0, 1020.0, 970.0, 955.0, 949.3]
        )
    elif graph_type == "packing_3d":
        return GraphVisualizer.render_3d_packing_diagram()
    elif graph_type == "battery_soc":
        return GraphVisualizer.render_battery_soc_trajectories()
    elif graph_type == "spatiotemporal_heatmap":
        return GraphVisualizer.render_spatiotemporal_heatmap()
    return None

def export_all_graphs(extra_run_ids=None):
    public_dir = os.path.join(repo_root, "web_simulator", "public", "api", "v1", "presentation", "runs")
    dist_dir = os.path.join(repo_root, "web_simulator", "dist", "api", "v1", "presentation", "runs")
    
    run_ids = ["RUN-ACTIVE-001", "RUN-001", "default"]
    if extra_run_ids:
        for rid in extra_run_ids:
            if rid and rid not in run_ids:
                run_ids.append(rid)
    
    # Generate bytes for each graph once
    graph_bytes = {}
    for g in GRAPH_TYPES:
        fig = generate_figure(g)
        if fig:
            b = GraphVisualizer.figure_to_bytes(fig, fmt="png", dpi=180)
            graph_bytes[g] = b
            print(f"[+] Rendered {g}: {len(b)} bytes")

    for base in [public_dir, dist_dir]:
        for r_id in run_ids:
            target_graphs_dir = os.path.join(base, r_id, "graphs")
            os.makedirs(target_graphs_dir, exist_ok=True)
            for g, b in graph_bytes.items():
                # Write both without extension and with .png extension
                with open(os.path.join(target_graphs_dir, g), "wb") as f:
                    f.write(b)
                with open(os.path.join(target_graphs_dir, f"{g}.png"), "wb") as f:
                    f.write(b)
        
        # Also create a top-level fallback /graphs/
        fallback_dir = os.path.join(base, "graphs")
        os.makedirs(fallback_dir, exist_ok=True)
        for g, b in graph_bytes.items():
            with open(os.path.join(fallback_dir, g), "wb") as f:
                f.write(b)
            with open(os.path.join(fallback_dir, f"{g}.png"), "wb") as f:
                f.write(b)

    print("[SUCCESS] All high-resolution graph assets exported to public and dist!")

if __name__ == "__main__":
    export_all_graphs()
