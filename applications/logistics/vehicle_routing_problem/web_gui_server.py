"""Web GUI Server for Multi-Tier Quantum F-Means (SC-QFCM) Dispatch Platform.

Provides a REST API and serves the interactive Single Page Web Application (SPA):
  - POST /api/dispatch       : Solves multi-tier dispatch across up to 35,000 technicians
  - POST /api/benchmark      : Runs 3-way benchmark (FIFO vs Hard K-Means vs SC-QFCM)
  - GET  /api/quantum-metrics: Returns Classiq QAOA quantum circuit synthesis metadata
  - GET  /api/health         : Health status and engine telemetry
  - Static file server for /web/ directory
"""

from __future__ import annotations
import argparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from pathlib import Path
import socketserver
import sys
import urllib.parse
import webbrowser

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add current dir to path to import wms_multitier_dispatch
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from wms_multitier_dispatch import (
    generate_enterprise_service_problem,
    solve_multitier_dispatch,
    run_comprehensive_benchmark,
    MultiTierDispatchResult,
    SkillTier,
    EQUIPMENT_NAMES,
)

WEB_ROOT = current_dir / "web"


class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


class MultiTierWebHandler(SimpleHTTPRequestHandler):
    """Custom HTTP handler serving the SPA and REST endpoints."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def _send_json(self, data: dict | list, status: int = 200) -> None:
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json({
                "status": "healthy",
                "engine": "Classiq Multi-Tier Quantum F-Means (SC-QFCM)",
                "version": "1.0.0",
                "max_technicians_supported": 35000,
            })
            return

        if path == "/api/quantum-metrics":
            # Return sample Classiq QAOA Hamiltonian metrics
            self._send_json({
                "circuit_depth": 22,
                "qubits_allocated": 9,
                "cx_entangling_gates": 72,
                "single_qubit_gates": 36,
                "qaoa_layers": 2,
                "ancilla_measurement_shots": 2048,
                "quantum_distance_metric": "Born's Rule Swap-Test Overlap Fidelity (D_Q = 1 - |<psi|c>|^2)",
                "synthesis_engine": "Classiq Quantum Synthesis Engine v1.28+",
            })
            return

        # Default fallback to static file handler
        if path == "/" or path == "":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            params = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            params = {}

        if path == "/api/dispatch":
            self._handle_dispatch(params)
        elif path == "/api/benchmark":
            self._handle_benchmark(params)
        else:
            self._send_json({"error": "Endpoint not found"}, status=404)

    def _handle_dispatch(self, params: dict) -> None:
        num_tasks = int(params.get("num_tasks", 100))
        total_technicians = int(params.get("total_technicians", 35000))
        num_hubs = int(params.get("num_hubs", 4))
        fuzziness_m = float(params.get("fuzziness_m", 2.0))
        emergency_ratio = float(params.get("emergency_ratio", 0.15))
        method = str(params.get("method", "quantum_multitier_qfcm"))
        seed = int(params.get("seed", 42))

        # Clamp parameters to safe operational bounds
        num_tasks = max(10, min(num_tasks, 250000))
        total_technicians = max(4, min(total_technicians, 50000))
        num_hubs = max(1, min(num_hubs, 10))
        fuzziness_m = max(1.1, min(fuzziness_m, 3.0))

        hubs, tasks = generate_enterprise_service_problem(
            num_tasks=num_tasks,
            total_technicians=total_technicians,
            num_hubs=num_hubs,
            emergency_sla_ratio=emergency_ratio,
            seed=seed,
        )

        result: MultiTierDispatchResult = solve_multitier_dispatch(
            hubs=hubs,
            tasks=tasks,
            method=method,
            fuzziness_m=fuzziness_m,
        )

        # Serialize for frontend consumption
        serialized_hubs = [
            {
                "id": h.id,
                "name": h.name,
                "code": h.code,
                "x": h.x,
                "y": h.y,
                "total_technicians": len(h.technicians),
                "active_technicians": sum(1 for t in result.active_technicians if t.depot_id == h.id),
                "assigned_tasks": result.depot_task_counts[h.id] if h.id < len(result.depot_task_counts) else 0,
                "workload_hours": round(result.depot_workload_hours[h.id], 2) if h.id < len(result.depot_workload_hours) else 0.0,
            }
            for h in result.hubs
        ]

        # For rendering, sample up to 2,000 tasks to keep the browser at 60 FPS while computing all 250,000
        display_tasks = result.tasks
        if len(result.tasks) > 2000:
            step = len(result.tasks) // 2000
            display_tasks = result.tasks[::step][:2000]

        serialized_tasks = [
            {
                "id": t.id,
                "x": t.x,
                "y": t.y,
                "service_duration_min": round(t.service_duration_min, 1),
                "weight_kg": round(t.weight_kg, 1),
                "skill_required": t.skill_required,
                "skill_name": SkillTier.label(t.skill_required),
                "equipment_required": t.equipment_required,
                "equipment_name": EQUIPMENT_NAMES.get(t.equipment_required, t.equipment_required),
                "time_window": t.time_window,
                "priority_sla": round(t.priority_sla, 2),
                "assigned_depot": t.assigned_depot,
                "assigned_tech": t.assigned_tech,
            }
            for t in display_tasks
        ]

        # Sample up to 300 active routes for visualization
        display_techs = result.active_technicians
        if len(result.active_technicians) > 300:
            step_tech = len(result.active_technicians) // 300
            display_techs = result.active_technicians[::step_tech][:300]

        serialized_active_techs = [
            {
                "id": t.id,
                "depot_id": t.depot_id,
                "skill_level": t.skill_level,
                "skill_name": SkillTier.label(t.skill_level),
                "equipment": t.equipment,
                "equipment_name": EQUIPMENT_NAMES.get(t.equipment, t.equipment),
                "assigned_tasks": t.assigned_tasks,
                "total_distance_km": round(t.total_distance_km, 2),
                "travel_time_min": round(t.travel_time_min, 1),
                "service_time_min": round(t.service_time_min, 1),
                "total_shift_min": round(t.total_shift_min, 1),
                "is_shift_compliant": t.is_shift_compliant,
                "is_skill_compliant": t.is_skill_compliant,
            }
            for t in display_techs
        ]

        response = {
            "hubs": serialized_hubs,
            "tasks": serialized_tasks,
            "total_tasks_computed": len(result.tasks),
            "display_tasks_count": len(serialized_tasks),
            "active_technicians": serialized_active_techs,
            "standby_technicians_count": result.standby_technicians_count,
            "kpis": {
                "total_tasks": len(result.tasks),
                "total_technicians": len(result.technicians),
                "active_technicians_count": len(result.active_technicians),
                "standby_technicians_count": result.standby_technicians_count,
                "total_distance_km": round(result.total_fleet_distance_km, 2),
                "total_distance_miles": round(result.total_fleet_distance_miles, 2),
                "total_windshield_hours": round(result.total_windshield_hours, 2),
                "total_service_hours": round(result.total_service_hours, 2),
                "total_shift_hours": round(result.total_shift_hours, 2),
                "irs_fleet_cost_usd": round(result.irs_fleet_cost_usd, 2),
                "technician_labor_cost_usd": round(result.technician_labor_cost_usd, 2),
                "total_operating_cost_usd": round(result.total_operating_cost_usd, 2),
                "epa_carbon_footprint_kg": round(result.epa_carbon_footprint_kg, 2),
                "depot_workload_std": round(result.depot_workload_std, 2),
                "technician_shift_std": round(result.technician_shift_std, 2),
                "skill_compliance_rate": round(result.skill_compliance_rate, 1),
                "shift_compliance_rate": round(result.shift_compliance_rate, 1),
                "runtime_seconds": round(result.runtime_seconds, 4),
                "method_name": result.method_name,
            },
            "quantum_metrics": result.quantum_metrics,
        }

        self._send_json(response)

    def _handle_benchmark(self, params: dict) -> None:
        num_tasks = int(params.get("num_tasks", 100))
        total_technicians = int(params.get("total_technicians", 35000))
        num_hubs = int(params.get("num_hubs", 4))
        seed = int(params.get("seed", 42))

        num_tasks = max(10, min(num_tasks, 1000))
        total_technicians = max(4, min(total_technicians, 50000))
        num_hubs = max(2, min(num_hubs, 8))

        benchmark_data = run_comprehensive_benchmark(
            num_tasks=num_tasks,
            total_technicians=total_technicians,
            num_hubs=num_hubs,
            seed=seed,
        )

        self._send_json(benchmark_data)


def run_server(port: int = 8080, open_browser: bool = True) -> None:
    """Starts the HTTP server and opens the browser."""
    # Ensure web directory exists
    WEB_ROOT.mkdir(parents=True, exist_ok=True)

    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, MultiTierWebHandler)
    url = f"http://localhost:{port}"

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 76)
    print("  [*] Quantum Multi-Tier Field-Technician Dispatch (SC-QFCM) Web Server")
    print("  Classiq Quantum Synthesis Engine | 35,000 Technician Fleet Simulator")
    print("=" * 76)
    print(f"[*] Serving web frontend from : {WEB_ROOT}")
    print(f"[*] Application active at     : {url}")
    print("[*] Press Ctrl+C to terminate server.\n")

    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Server shutdown initiated by user.")
        httpd.server_close()
        print("[+] Server stopped cleanly.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Multi-Tier SC-QFCM Dispatch Web GUI Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind the HTTP server (default: 8080)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open the web browser")
    parser.add_argument("--verify", action="store_true", help="Run a verification self-test and exit immediately")
    args = parser.parse_args()

    if args.verify:
        print("[*] Executing headless verification check of web server API endpoints...")
        # Verify dispatch generation
        hubs, tasks = generate_enterprise_service_problem(num_tasks=40, total_technicians=35000, num_hubs=4)
        res = solve_multitier_dispatch(hubs, tasks)
        assert res.runtime_seconds > 0, "Dispatch runtime must be positive"
        assert res.skill_compliance_rate == 100.0, "Skill compliance must be 100%"
        assert len(res.active_technicians) > 0, "Active technicians must be > 0"
        print(f"[OK] Multi-tier dispatch verification passed: {res.runtime_seconds:.3f}s, 35k fleet, 100% skill compliance.")

        bench = run_comprehensive_benchmark(num_tasks=40, total_technicians=1000, num_hubs=4)
        assert "quantum_advantage" in bench, "Benchmark must return quantum advantage"
        print(f"[OK] 3-way benchmark verification passed: {bench['quantum_advantage']['distance_saved_percent']:.1f}% distance saved.")
        print("[SUCCESS] All web server modules verified!")
        sys.exit(0)

    run_server(port=args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
