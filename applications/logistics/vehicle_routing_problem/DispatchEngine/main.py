"""Command-line entrypoint and execution runner for DispatchEngine."""

import argparse
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.storage.mock_generator import WarehouseMockGenerator, ScenarioArchetype
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.storage.repository import WarehouseRepository
from DispatchEngine.orchestrator import DispatchOrchestrator
from DispatchEngine.benchmarking.comparator import BenchmarkComparator
from DispatchEngine.common_types import OperationalMode
from DispatchEngine.api.openapi_spec import export_openapi_json
from DispatchEngine.api.standalone_server import run_standalone_server


def main():
    parser = argparse.ArgumentParser(description="Industrial Multi-Tier Warehouse Optimization Engine (DispatchEngine)")
    parser.add_argument("--scenario-orders", type=int, default=80, help="Number of customer orders in wave (e.g. 40, 80, 1000)")
    parser.add_argument("--vehicles", type=int, default=4, help="Fleet size (number of AMRs)")
    parser.add_argument("--depots", type=int, default=2, help="Number of regional depots")
    parser.add_argument("--chutes", type=int, default=2, help="Number of consolidation chutes")
    parser.add_argument("--mode", type=str, default="QUANTUM", choices=["QUANTUM", "NORMAL", "AGILITY"], help="Operational Mode")
    parser.add_argument(
        "--archetype",
        type=str,
        default="PARETO_HOT_ZONE",
        choices=[a.value for a in ScenarioArchetype],
        help="Warehouse spatial and temporal distribution pattern",
    )
    parser.add_argument("--hazard-ratio", type=float, default=0.10, help="Fraction of orders requiring hazard handling")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for mock generator")
    parser.add_argument("--benchmark", action="store_true", help="Run 4-way comparative benchmark (FIFO, K-Means, SC-QFCM, Quantum)")
    parser.add_argument("--save-mock", action="store_true", default=True, help="Save mock scenario to database")
    
    # API Server and Swagger UI flags
    parser.add_argument("--serve-api", action="store_true", help="Launch the DispatchEngine REST API & Swagger UI Server")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind the API server (default: 8080)")
    parser.add_argument("--export-openapi", type=str, default="", help="Path to export the full OpenAPI 3.1.0 JSON specification")

    args = parser.parse_args()

    # 1. Export OpenAPI spec if requested
    if args.export_openapi:
        out_path = Path(args.export_openapi)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        spec_str = export_openapi_json()
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(spec_str)
        print(f"[+] Exported complete OpenAPI 3.1.0 specification to: {out_path.resolve()}")
        return

    # 2. Launch API Server if requested
    if args.serve_api:
        run_standalone_server(port=args.port)
        return

    print("=" * 80)
    print("  INDUSTRIAL MULTI-TIER WAREHOUSE OPTIMIZATION ENGINE (DispatchEngine)")
    print("  Classiq Quantum Co-Processor | Asynchronous 4-Tier Pipeline | Database Storage")
    print("=" * 80)

    # 3. Generate & Save Scenario
    print(f"\n[*] Generating Synthetic Warehouse Scenario ({args.scenario_orders} orders, archetype={args.archetype}, seed={args.seed})...")
    config = MockConfigDTO(
        scenario_name=f"Scenario-{args.scenario_orders}Orders-{args.archetype}",
        num_orders=args.scenario_orders,
        num_technicians=args.vehicles,
        num_depots=args.depots,
        num_chutes=args.chutes,
        seed=args.seed,
        archetype=args.archetype,
        hazard_ratio=args.hazard_ratio,
    )
    pool = WarehouseMockGenerator.generate_scenario(config)

    session = DatabaseManager.get_session()
    try:
        repo = WarehouseRepository(session)
        scenario_id = repo.save_scenario(config, pool)
        print(f"    -> Saved scenario to database: ID={scenario_id}, Orders={len(pool.orders)}, Depots={len(pool.depots)}")

        # 4. Execute Wave Orchestrator
        mode = OperationalMode[args.mode]
        print(f"\n[*] Executing Wave Dispatch in Mode: {mode.value}...")
        orchestrator = DispatchOrchestrator(num_vehicles=args.vehicles, db_session=session)
        schedule, trajectories, frames, hud = orchestrator.execute_wave(pool, scenario_id=scenario_id, force_mode=mode)

        print("\n" + "-" * 60)
        print("  EXECUTIVE PRESENTATION DASHBOARD (HUD)")
        print("-" * 60)
        print(f"  Wave ID:                 {hud.wave_id}")
        print(f"  Operational Mode:        {hud.operational_mode}")
        print(f"  Total Fleet Makespan:    {hud.total_makespan_sec:.1f} s")
        print(f"  Total Distance Traveled: {hud.fleet_distance_km:.3f} km")
        print(f"  Chute Balance Variance:  {hud.chute_balance_variance:.2f}")
        print(f"  Pack Volume Density:     {hud.pack_density_percent:.1f} %")
        print(f"  HRI Throttle Events:     {hud.hri_throttle_events}")
        print(f"  Falsification Ratio Phi: {hud.falsification_ratio_phi:.3f} (Valid: Phi < 1.0)")
        if hud.quantum_speedup_ratio:
            print(f"  Quantum Speedup Factor:  {hud.quantum_speedup_ratio:.2f}x (Classiq QAOA / Q-ST-FCM)")
        print(f"  Simulation Frames Built: {len(frames)} frames @ 10Hz")
        print("-" * 60)

        # 5. Benchmark if requested
        if args.benchmark:
            print("\n[*] Running 4-Way Comparative Algorithm Benchmark...")
            bench_res = BenchmarkComparator.run_benchmark(pool, num_vehicles=args.vehicles)
            print("\n" + "=" * 75)
            print(f"{'ALGORITHM':<22} | {'MAKESPAN (s)':<14} | {'DISTANCE (km)':<14} | {'LATENCY (s)':<12}")
            print("-" * 75)
            for algo in bench_res.algorithms_evaluated:
                m = bench_res.makespan_by_algo.get(algo, 0.0)
                d = bench_res.distance_by_algo.get(algo, 0.0)
                lat = bench_res.latency_by_algo.get(algo, 0.0)
                print(f"{algo:<22} | {m:<14.1f} | {d:<14.3f} | {lat:<12.3f}")
            print("=" * 75)
            print(f"  -> Quantum Makespan Improvement vs Hard K-Means: {bench_res.improvement_makespan_percent:.1f}%")
            print(f"  -> Quantum Distance Improvement vs Hard K-Means: {bench_res.improvement_distance_percent:.1f}%")

        print("\n[+] DispatchEngine Wave Execution Complete.")
    finally:
        DatabaseManager.close_session(session)


if __name__ == "__main__":
    main()
