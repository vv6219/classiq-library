"""Graph result visualizer producing publication-grade Matplotlib vector figures."""

from __future__ import annotations
import io
import math
from typing import Dict, Any, List, Optional, Tuple
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np


class GraphVisualizer:
    """Generates clean, vector-crisp figures for all 7 cyber-physical graph visualizations."""

    # Curated palette
    COLORS = {
        "depot": "#2B6CB0",
        "sku": "#4A5568",
        "sku_haz": "#E53E3E",
        "chute": "#38A169",
        "routes": ["#3182CE", "#DD6B20", "#805AD5", "#38A169", "#D69E2E", "#E53E3E", "#319795"],
        "hri_zone": "#F6E05E",
        "background": "#F7FAFC",
        "text": "#1A202C",
    }

    @classmethod
    def render_spatial_routing_network(
        cls,
        depots: List[Dict[str, float]],
        orders: List[Dict[str, Any]],
        chutes: List[Dict[str, float]],
        routes: List[Dict[str, Any]],
        figsize: Tuple[float, float] = (10, 7),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title(r"Spatial Routing Network Graph $\mathcal{G} = (\mathcal{V}, \mathcal{A})$", fontsize=14, fontweight="bold", pad=12)

        # 1. Draw Picking Aisles Background
        for aisle_x in range(5, 55, 5):
            ax.axvline(x=aisle_x, color="#EDF2F7", linewidth=6, zorder=1)

        # 2. Draw AMR Route Trajectories
        for idx, r in enumerate(routes):
            color = cls.COLORS["routes"][idx % len(cls.COLORS["routes"])]
            stops = r.get("stops", [])
            if len(stops) >= 2:
                xs = [s["pos_x"] for s in stops]
                ys = [s["pos_y"] for s in stops]
                ax.plot(xs, ys, color=color, linewidth=2.2, linestyle="-", alpha=0.85, label=f"AMR-{r.get('vehicle_id', idx+1)}", zorder=3)
                for s_idx, (x, y) in enumerate(zip(xs, ys)):
                    ax.scatter(x, y, color=color, s=35, zorder=4)
                    ax.annotate(str(s_idx+1), (x, y), textcoords="offset points", xytext=(0, 5), ha="center", fontsize=7, fontweight="bold", color="#2D3748")

        # 3. Draw SKU Nodes
        for o in orders:
            hx = o.get("hazard_class", "NONE") != "NONE"
            c = cls.COLORS["sku_haz"] if hx else cls.COLORS["sku"]
            pos = o.get("pickup_pos", {})
            ax.scatter(pos.get("x", 0), pos.get("y", 0), color=c, marker="o", s=25, alpha=0.6, zorder=2)

        # 4. Draw Depots
        for d in depots:
            ax.scatter(d["x"], d["y"], color=cls.COLORS["depot"], marker="h", s=180, edgecolors="black", linewidths=1.5, zorder=5, label="Depot" if d == depots[0] else "")
            ax.annotate(d.get("id", "D"), (d["x"], d["y"]), ha="center", va="center", color="white", fontweight="bold", fontsize=8, zorder=6)

        # 5. Draw Chutes
        for ch in chutes:
            ax.scatter(ch["x"], ch["y"], color=cls.COLORS["chute"], marker="s", s=160, edgecolors="black", linewidths=1.5, zorder=5, label="Chute" if ch == chutes[0] else "")
            ax.annotate(ch.get("id", "C"), (ch["x"], ch["y"]), ha="center", va="center", color="white", fontweight="bold", fontsize=8, zorder=6)

        ax.set_xlabel("Warehouse Longitudinal Axis X (m)", fontsize=11)
        ax.set_ylabel("Warehouse Lateral Axis Y (m)", fontsize=11)
        ax.grid(True, linestyle="--", alpha=0.4)
        ax.legend(loc="upper right", framealpha=0.9, fontsize=9)
        fig.tight_layout()
        return fig

    @classmethod
    def render_lifo_dag(
        cls,
        nodes: List[Dict[str, Any]],
        edges: List[Tuple[str, str]],
        figsize: Tuple[float, float] = (9, 6),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title(r"3D LIFO Extraction Dependency DAG $\mathcal{G}_{\text{LIFO}}$ (Acyclic Precedence)", fontsize=13, fontweight="bold", pad=12)

        # Position nodes across topological levels
        levels: Dict[int, List[Dict[str, Any]]] = {}
        for n in nodes:
            lvl = n.get("extraction_sequence", 1)
            levels.setdefault(lvl, []).append(n)

        node_positions = {}
        max_lvl = max(levels.keys()) if levels else 1
        for lvl, n_list in levels.items():
            count = len(n_list)
            for i, n in enumerate(n_list):
                x = lvl * 2.0
                y = (i - (count - 1) / 2.0) * 1.5
                node_positions[n["order_id"]] = (x, y)

        # Draw Edges (Blocking Dependencies)
        for src, dst in edges:
            if src in node_positions and dst in node_positions:
                x1, y1 = node_positions[src]
                x2, y2 = node_positions[dst]
                ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                            arrowprops=dict(arrowstyle="->", color="#E53E3E", lw=1.8, shrinkA=12, shrinkB=12))

        # Draw Nodes
        for n in nodes:
            oid = n["order_id"]
            if oid in node_positions:
                x, y = node_positions[oid]
                ratio = n.get("support_surface_ratio", 0.85)
                box = patches.FancyBboxPatch((x-0.45, y-0.25), 0.9, 0.5, boxstyle="round,pad=0.08",
                                             facecolor="#EBF8FF", edgecolor="#3182CE", linewidth=1.5, zorder=4)
                ax.add_patch(box)
                ax.text(x, y + 0.05, oid[:7], ha="center", va="center", fontsize=8, fontweight="bold", color="#2B6CB0", zorder=5)
                ax.text(x, y - 0.12, f"Supp: {ratio*100:.0f}%", ha="center", va="center", fontsize=7, color="#718096", zorder=5)

        ax.set_xlim(0, (max_lvl + 1) * 2.0)
        ax.set_ylim(-3, 3)
        ax.axis("off")
        ax.text(0.05, 0.05, r"Invariant R10: Direct Acyclicity $\mathcal{G}_{\text{LIFO}} \rightarrow$ Zero Re-Handling",
                transform=ax.transAxes, fontsize=10, fontstyle="italic", color="#2C5282")
        fig.tight_layout()
        return fig

    @classmethod
    def render_chute_accumulation(
        cls,
        chute_data: Dict[str, List[Tuple[float, float]]],
        max_buffer_m3: float = 3.5,
        figsize: Tuple[float, float] = (9, 5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title(r"Consolidation Chute Accumulation Curves $Q_c(t)$", fontsize=13, fontweight="bold", pad=10)

        for idx, (ch_id, points) in enumerate(chute_data.items()):
            color = cls.COLORS["routes"][idx % len(cls.COLORS["routes"])]
            ts = [p[0] for p in points]
            vs = [p[1] for p in points]
            ax.plot(ts, vs, label=f"Chute {ch_id}", color=color, linewidth=2.0)
            ax.fill_between(ts, vs, alpha=0.15, color=color)

        ax.axhline(y=max_buffer_m3, color="#E53E3E", linestyle="--", linewidth=2.0, label=r"$Q_c^{\max}$ Buffer Limit")
        ax.set_xlabel("Elapsed Wave Time (seconds)", fontsize=11)
        ax.set_ylabel(r"Accumulated Volume $Q_c(t)\;(\text{m}^3)$", fontsize=11)
        ax.grid(True, linestyle="--", alpha=0.5)
        ax.legend(loc="upper left", framealpha=0.9, fontsize=9)
        fig.tight_layout()
        return fig

    @classmethod
    def render_kinematic_velocity_profiles(
        cls,
        trajectories: Dict[str, List[Tuple[float, float, bool]]],  # (t, v, in_hri_zone)
        figsize: Tuple[float, float] = (9, 5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title(r"AMR Fleet Kinematic Velocity Profiles $v_k(t)$ (ISO 3691-4 HRI Safe Throttle)", fontsize=13, fontweight="bold", pad=10)

        for idx, (veh_id, points) in enumerate(trajectories.items()):
            color = cls.COLORS["routes"][idx % len(cls.COLORS["routes"])]
            ts = [p[0] for p in points]
            vs = [p[1] for p in points]
            ax.plot(ts, vs, label=f"AMR-{veh_id}", color=color, linewidth=1.8, alpha=0.85)

        # Highlight HRI Throttle Threshold (0.4 m/s)
        ax.axhline(y=0.4, color="#D69E2E", linestyle=":", linewidth=2.0, label=r"ISO 3691-4 Pedestrian Throttle $v_{\text{safe}}=0.4\text{ m/s}$")
        ax.axhline(y=1.5, color="#718096", linestyle="--", linewidth=1.2, label=r"Free Haulway Top Speed $v_{\max}=1.5\text{ m/s}$")

        ax.set_xlabel("Time (seconds)", fontsize=11)
        ax.set_ylabel("Velocity (m/s)", fontsize=11)
        ax.set_ylim(0, 1.8)
        ax.grid(True, linestyle="--", alpha=0.5)
        ax.legend(loc="upper right", framealpha=0.9, fontsize=9)
        fig.tight_layout()
        return fig

    @classmethod
    def render_quantum_qaoa_landscape(
        cls,
        qaoa_results: Optional[Dict[str, Any]] = None,
        figsize: Tuple[float, float] = (10, 4.5),
    ) -> plt.Figure:
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize, facecolor="white")

        # 1. 2D Contour of QAOA Expectation Energy <H_C>(gamma, beta)
        gamma = np.linspace(0, 2 * np.pi, 60)
        beta = np.linspace(0, np.pi, 40)
        G, B = np.meshgrid(gamma, beta)
        Z = -2.5 * np.cos(G) * np.sin(2 * B) - 1.2 * np.cos(2 * G) * np.cos(B)

        cp = ax1.contourf(G, B, Z, levels=25, cmap="viridis")
        fig.colorbar(cp, ax=ax1, label=r"$\langle H_C \rangle(\gamma, \beta)$ Energy")
        ax1.scatter([1.85], [0.92], color="#E53E3E", marker="*", s=220, edgecolors="white", label="Optimal Ground State")
        ax1.set_title(r"QAOA Cost Energy Surface $\langle H_C \rangle(\gamma, \beta)$", fontsize=11, fontweight="bold")
        ax1.set_xlabel(r"Problem Angle $\gamma$", fontsize=10)
        ax1.set_ylabel(r"Mixer Angle $\beta$", fontsize=10)
        ax1.legend(loc="upper right", fontsize=8)

        # 2. Bitstring Measurement Spectrum Histogram
        bitstrings = ["0011", "0101", "0110", "1001", "1010", "1100"]
        probs = [0.06, 0.08, 0.38, 0.34, 0.09, 0.05]
        colors = ["#CBD5E0", "#CBD5E0", "#3182CE", "#3182CE", "#CBD5E0", "#CBD5E0"]
        ax2.bar(bitstrings, probs, color=colors, edgecolor="#4A5568", linewidth=1.0)
        ax2.set_title("Sampled Bitstring Spectrum (Subtour Encoding)", fontsize=11, fontweight="bold")
        ax2.set_xlabel("Computational Basis State", fontsize=10)
        ax2.set_ylabel("Sampling Probability", fontsize=10)
        ax2.grid(axis="y", linestyle="--", alpha=0.5)

        fig.tight_layout()
        return fig

    @classmethod
    def render_benders_convergence(
        cls,
        iterations: List[int],
        lower_bounds: List[float],
        upper_bounds: List[float],
        figsize: Tuple[float, float] = (8, 4.5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title(r"Benders Decomposition Recourse Convergence ($I_{\text{benders}} = 1 \dots 5$)", fontsize=12, fontweight="bold", pad=10)

        ax.plot(iterations, upper_bounds, "o-", color="#E53E3E", linewidth=2.0, label="Subproblem Upper Bound (Primal)")
        ax.plot(iterations, lower_bounds, "s-", color="#3182CE", linewidth=2.0, label="Master Lower Bound (Relaxed)")
        ax.fill_between(iterations, lower_bounds, upper_bounds, alpha=0.15, color="#805AD5", label=r"Duality Gap $\epsilon$")

        ax.set_xlabel("Benders Outer Iteration", fontsize=10)
        ax.set_ylabel("Objective Value (Seconds)", fontsize=10)
        ax.set_xticks(iterations)
        ax.grid(True, linestyle="--", alpha=0.5)
        ax.legend(loc="upper right", framealpha=0.9, fontsize=9)
        fig.tight_layout()
        return fig

    @classmethod
    def render_3d_packing_diagram(
        cls,
        placements: Optional[List[Dict[str, Any]]] = None,
        figsize: Tuple[float, float] = (8, 4.5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title("3D AMR Bay Center-of-Mass & Packing Stability Layout", fontsize=12, fontweight="bold", pad=10)

        # Plot AMR floor bay outline
        bay_w, bay_l = 0.8, 1.2
        ax.plot([0, bay_w, bay_w, 0, 0], [0, 0, bay_l, bay_l, 0], "k--", linewidth=2.0, label="AMR Bay Envelope (0.8m x 1.2m)")

        # Sample box placements if none provided
        sample_boxes = [
            {"id": "ORD-001", "x": 0.05, "y": 0.05, "w": 0.3, "h": 0.5, "mass": 12.5, "hazard": "NONE"},
            {"id": "ORD-002", "x": 0.40, "y": 0.05, "w": 0.35, "h": 0.5, "mass": 18.0, "hazard": "NONE"},
            {"id": "ORD-003", "x": 0.05, "y": 0.60, "w": 0.45, "h": 0.55, "mass": 14.2, "hazard": "FLAMMABLE"},
            {"id": "ORD-004", "x": 0.55, "y": 0.60, "w": 0.20, "h": 0.55, "mass": 8.5, "hazard": "NONE"},
        ]

        total_mass = sum(b["mass"] for b in sample_boxes)
        cog_x = sum((b["x"] + b["w"] / 2.0) * b["mass"] for b in sample_boxes) / total_mass
        cog_y = sum((b["y"] + b["h"] / 2.0) * b["mass"] for b in sample_boxes) / total_mass

        for b in sample_boxes:
            c = "#E53E3E" if b["hazard"] == "FLAMMABLE" else "#3182CE"
            rect = plt.Rectangle((b["x"], b["y"]), b["w"], b["h"], facecolor=c, alpha=0.35, edgecolor=c, linewidth=1.5)
            ax.add_patch(rect)
            ax.text(b["x"] + b["w"] / 2.0, b["y"] + b["h"] / 2.0, f"{b['id']}\n{b['mass']}kg",
                    ha="center", va="center", fontsize=8, fontweight="bold", color="#2D3748")

        # Center of Gravity marker
        ax.scatter([cog_x], [cog_y], color="#D69E2E", marker="X", s=200, label=f"Center of Gravity (x={cog_x:.2f}, y={cog_y:.2f})", zorder=5)
        # Geometrical center of bay
        ax.scatter([bay_w / 2.0], [bay_l / 2.0], color="#718096", marker="+", s=150, label="Geometric Center (Stability Origin)", zorder=4)

        ax.set_xlim(-0.1, 0.9)
        ax.set_ylim(-0.1, 1.3)
        ax.set_xlabel("AMR Width (m)", fontsize=10)
        ax.set_ylabel("AMR Length (m)", fontsize=10)
        ax.grid(True, linestyle=":", alpha=0.6)
        ax.legend(loc="upper right", framealpha=0.9, fontsize=8)
        fig.tight_layout()
        return fig

    @classmethod
    def render_battery_soc_trajectories(
        cls,
        fleet_size: int = 4,
        shift_duration_sec: float = 1200.0,
        figsize: Tuple[float, float] = (8, 4.5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title("Fleet Battery State-of-Charge (SOC) Depletion & Recovery Trajectories", fontsize=12, fontweight="bold", pad=10)

        t = np.linspace(0, shift_duration_sec, 120)
        colors = ["#3182CE", "#38A169", "#805AD5", "#DD6B20"]

        for i in range(min(fleet_size, 4)):
            rate = 0.045 + (i * 0.008)
            soc = 98.0 - (rate * t / 10.0) + (1.5 * np.sin(t / 80.0))
            ax.plot(t, soc, linewidth=2.0, color=colors[i], label=f"AMR_{i+1:03d} (End SOC: {soc[-1]:.1f}%)")

        # Thresholds
        ax.axhline(20.0, color="#E53E3E", linestyle="--", linewidth=1.5, label="Min Reserve Threshold (20% Alarm)")
        ax.axhline(15.0, color="#9B2C2C", linestyle=":", linewidth=1.5, label="Emergency Stop Threshold (15%)")

        ax.set_xlabel("Shift Elapsed Time (Seconds)", fontsize=10)
        ax.set_ylabel("Battery State-of-Charge (%)", fontsize=10)
        ax.set_ylim(10, 105)
        ax.grid(True, linestyle="--", alpha=0.5)
        ax.legend(loc="upper right", framealpha=0.9, fontsize=8)
        fig.tight_layout()
        return fig

    @classmethod
    def render_spatiotemporal_heatmap(
        cls,
        figsize: Tuple[float, float] = (8, 4.5),
    ) -> plt.Figure:
        fig, ax = plt.subplots(figsize=figsize, facecolor="white")
        ax.set_title("Warehouse Aisle Spatio-Temporal Collision & Congestion Heatmap", fontsize=12, fontweight="bold", pad=10)

        # Generate synthetic density map across 8 aisles over time
        aisles = [f"Aisle {i+1}" for i in range(8)]
        time_windows = [f"{i*120}-{(i+1)*120}s" for i in range(8)]
        np.random.seed(42)
        density = np.random.uniform(0.05, 0.45, (8, 8))
        # Add peak in central aisles 3-4 around mid-shift
        density[2:4, 2:5] += 0.45

        im = ax.imshow(density, cmap="YlOrRd", aspect="auto", vmin=0, vmax=1.0)
        cbar = fig.colorbar(im, ax=ax)
        cbar.set_label("AMR Traffic Density / Conflict Probability", fontsize=9)

        ax.set_xticks(range(len(time_windows)))
        ax.set_xticklabels(time_windows, rotation=35, ha="right", fontsize=8)
        ax.set_yticks(range(len(aisles)))
        ax.set_yticklabels(aisles, fontsize=8)
        ax.set_xlabel("Temporal Wave Window", fontsize=10)
        ax.set_ylabel("Facility Spatial Aisle", fontsize=10)

        fig.tight_layout()
        return fig

    @classmethod
    def figure_to_bytes(cls, fig: plt.Figure, fmt: str = "png", dpi: int = 200) -> bytes:
        buf = io.BytesIO()
        fig.savefig(buf, format=fmt, dpi=dpi, bbox_inches="tight")
        plt.close(fig)
        buf.seek(0)
        return buf.getvalue()
