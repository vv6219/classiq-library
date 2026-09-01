from __future__ import annotations

import argparse
from pathlib import Path
import sys

import matplotlib
# Default to Agg for headless and file saving, switch to interactive if --gui requested
if "--gui" in sys.argv or "--interactive" in sys.argv:
    try:
        matplotlib.use("TkAgg")
    except Exception:
        matplotlib.use("Agg")
else:
    matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import numpy as np

from wms_quantum_optimization_pipeline import OrderLocation, route_cluster_pipeline


def demo_orders() -> list[OrderLocation]:
    return [
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


def generate_test_orders(num_points: int = 100, seed: int = 42) -> list[OrderLocation]:
    rng = np.random.default_rng(seed)
    orders: list[OrderLocation] = []
    for _ in range(num_points):
        x = float(rng.uniform(0.0, 24.0))
        y = float(rng.uniform(0.0, 20.0))
        orders.append(
            OrderLocation(
                x=x,
                y=y,
                z=float(rng.uniform(0.5, 2.5)),
                weight=float(rng.uniform(5.0, 25.0)),
                volume=float(rng.uniform(6.0, 24.0)),
                sla_priority=float(rng.uniform(0.5, 1.0)),
                zone_class=float(rng.uniform(0.0, 1.0)),
            )
        )
    return orders


def build_cluster_routes(orders: list[OrderLocation], k_batches: int = 3):
    pipeline = route_cluster_pipeline(orders, k_batches=k_batches, vehicle_capacity=120.0)
    labels = np.asarray(pipeline["cluster_labels"])
    centers = np.asarray(pipeline["centers"])

    routes = {}
    for cluster_id in range(k_batches):
        members = np.where(labels == cluster_id)[0]
        if len(members) == 0:
            continue
        xs = np.array([orders[i].x for i in members], dtype=float)
        ys = np.array([orders[i].y for i in members], dtype=float)
        cx = float(np.mean(xs))
        cy = float(np.mean(ys))
        order = np.argsort(np.arctan2(ys - cy, xs - cx))
        route = members[order]
        routes[cluster_id] = route.tolist()

    return pipeline, routes


def _draw_warehouse(ax):
    ax.set_xlim(-1, 30)
    ax.set_ylim(-1, 25)
    ax.set_xlabel("Warehouse x")
    ax.set_ylabel("Warehouse y")
    ax.set_title("WMS Batch Picking / AGV Routing Simulator")


def plot_static_simulation(
    orders: list[OrderLocation],
    labels: np.ndarray,
    centers: np.ndarray,
    routes: dict[int, list[int]],
    save_path: str | None = None,
):
    fig, ax = plt.subplots(figsize=(10, 8))
    _draw_warehouse(ax)

    colors = ["tab:blue", "tab:orange", "tab:green", "tab:red", "tab:purple", "tab:brown"]
    depot = (0.0, 0.0)
    ax.scatter(*depot, color="black", marker="s", s=120, label="Depot")

    for cluster_id in range(len(centers)):
        members = np.where(labels == cluster_id)[0]
        if len(members) == 0:
            continue
        xs = np.array([orders[i].x for i in members], dtype=float)
        ys = np.array([orders[i].y for i in members], dtype=float)
        color = colors[cluster_id % len(colors)]
        ax.scatter(xs, ys, s=80, c=color, label=f"Cluster {cluster_id + 1}")

        if cluster_id not in routes:
            continue
        route = routes[cluster_id]
        path_x = [orders[route[0]].x, *[orders[i].x for i in route]]
        path_y = [orders[route[0]].y, *[orders[i].y for i in route]]
        path_x = [depot[0], *path_x]
        path_y = [depot[1], *path_y]
        ax.plot(path_x, path_y, linestyle="--", linewidth=2, color=color, alpha=0.8)
        ax.scatter([orders[i].x for i in route], [orders[i].y for i in route], s=50, facecolors="none", edgecolors=color)

    for idx, order in enumerate(orders):
        ax.annotate(f"{idx}", (order.x + 0.25, order.y + 0.25), fontsize=8)

    ax.legend(loc="upper right")
    fig.tight_layout()

    if save_path:
        fig.savefig(save_path, dpi=180)
        print(f"[+] Static simulation saved to: {Path(save_path).resolve()}")
    if matplotlib.get_backend().lower() != "agg":
        plt.show()
    plt.close(fig)


def animate_routes(
    orders: list[OrderLocation],
    labels: np.ndarray,
    centers: np.ndarray,
    routes: dict[int, list[int]],
    save_path: str | None = None,
):
    fig, ax = plt.subplots(figsize=(10, 8))
    _draw_warehouse(ax)
    colors = ["tab:blue", "tab:orange", "tab:green", "tab:red", "tab:purple", "tab:brown"]
    depot = (0.0, 0.0)

    all_route_points = []
    for cluster_id in sorted(routes):
        route = routes[cluster_id]
        path = [depot] + [(orders[i].x, orders[i].y) for i in route]
        all_route_points.append(path)

    frames = []
    for cluster_id, path in enumerate(all_route_points):
        color = colors[cluster_id % len(colors)]
        for step in range(1, len(path)):
            x_data = [p[0] for p in path[:step]]
            y_data = [p[1] for p in path[:step]]
            line, = ax.plot([], [], linestyle="--", linewidth=2, color=color, alpha=0.8)
            point, = ax.plot([], [], marker="o", linestyle="None", color=color)
            frames.append((line, point, x_data, y_data, cluster_id, step))

    scatter_map = {}
    for cluster_id in range(len(centers)):
        members = np.where(labels == cluster_id)[0]
        if len(members) == 0:
            continue
        xs = np.array([orders[i].x for i in members], dtype=float)
        ys = np.array([orders[i].y for i in members], dtype=float)
        color = colors[cluster_id % len(colors)]
        s = ax.scatter(xs, ys, s=80, c=color, alpha=0.85)
        scatter_map[cluster_id] = s

    ax.scatter(*depot, color="black", marker="s", s=120, label="Depot")
    ax.legend(loc="upper right")

    def update(frame):
        line, point, x_data, y_data, cluster_id, step = frame
        line.set_data(x_data, y_data)
        point.set_data([x_data[-1]], [y_data[-1]])
        return line, point

    anim = FuncAnimation(fig, update, frames=frames, blit=True, interval=350)
    if save_path:
        anim.save(save_path, writer="pillow", fps=8)
        print(f"[+] Animated simulation saved to: {Path(save_path).resolve()}")
    if matplotlib.get_backend().lower() != "agg":
        plt.show()
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description="Warehouse management quantum optimization visual simulator")
    parser.add_argument("--k-batches", type=int, default=4, help="Number of batch picking clusters / AGV routes")
    parser.add_argument("--animate", action="store_true", help="Generate animated route simulation (GIF)")
    parser.add_argument("--output", type=str, default=None, help="Output file path (e.g. wms_simulation.png or .gif)")
    parser.add_argument("--num-points", type=int, default=100, help="Number of order locations (0 for demo fixed orders)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for order generation")
    parser.add_argument("--gui", "--interactive", dest="gui", action="store_true", help="Display interactive GUI window")
    args = parser.parse_args()

    # Determine default output if not provided
    if args.output is None:
        args.output = "wms_simulation.gif" if args.animate else "wms_simulation.png"

    print("=" * 60)
    print("  WMS Quantum Optimization Visual Simulator")
    print("=" * 60)
    print(f"  * Orders count:      {args.num_points if args.num_points > 0 else 'Demo (10)'}")
    print(f"  * K batches/routes:  {args.k_batches}")
    print(f"  * Mode:              {'Animated (GIF)' if args.animate else 'Static Plot (PNG)'}")
    print(f"  * Output path:       {args.output}")
    print(f"  * GUI display:       {'Enabled' if args.gui else 'Headless/Save only'}")
    print("=" * 60)

    orders = generate_test_orders(num_points=args.num_points, seed=args.seed) if args.num_points > 0 else demo_orders()
    print(f"[*] Running Quantum K-Means & QAOA Routing Pipeline...")
    pipeline, routes = build_cluster_routes(orders, k_batches=args.k_batches)
    labels = np.asarray(pipeline["cluster_labels"])
    centers = np.asarray(pipeline["centers"])

    total_dist = 0.0
    depot = (0.0, 0.0)
    for c_id, r in routes.items():
        pts = [depot] + [(orders[i].x, orders[i].y) for i in r] + [depot]
        d = sum(np.hypot(pts[k+1][0] - pts[k][0], pts[k+1][1] - pts[k][1]) for k in range(len(pts)-1))
        total_dist += d
        print(f"  - Cluster {c_id + 1}: {len(r)} pick stops, route distance = {d:.2f} m")

    print(f"[*] Total AGV Fleet Distance: {total_dist:.2f} m")

    if args.animate:
        print("[*] Generating animated simulation...")
        animate_routes(orders, labels, centers, routes, save_path=args.output)
    else:
        print("[*] Generating static simulation plot...")
        plot_static_simulation(orders, labels, centers, routes, save_path=args.output)

    print("[OK] Simulation completed successfully!")


if __name__ == "__main__":
    main()
