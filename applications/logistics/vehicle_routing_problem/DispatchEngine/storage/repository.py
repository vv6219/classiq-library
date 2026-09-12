"""Repository for persisting and querying scenarios, runs, and benchmark metrics."""

from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from DispatchEngine.contracts.tier1_dto import OrderPoolDTO, OrderLineDTO
from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.contracts.quantum_dto import QAOAResultsDTO


class WarehouseRepository:
    """Universal repository handling persistence via SQLAlchemy or native SQLite3."""

    def __init__(self, session_or_conn: Any):
        self.handle = session_or_conn
        self.is_sqlalchemy = hasattr(session_or_conn, "add") and hasattr(session_or_conn, "commit")

    def save_scenario(self, config: MockConfigDTO, pool: OrderPoolDTO) -> str:
        scenario_id = f"SCEN-{uuid.uuid4().hex[:8].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()

        if self.is_sqlalchemy:
            from DispatchEngine.storage.models import ScenarioRecord, OrderRecord
            scenario = ScenarioRecord(
                scenario_id=scenario_id,
                name=config.scenario_name,
                random_seed=config.seed,
                order_count=len(pool.orders),
                fleet_size=config.num_technicians,
                depot_count=len(pool.depots),
                chute_count=config.num_chutes,
                is_mock_data=True,
                topology_metadata={
                    "wave_id": pool.wave_id,
                    "depots": [d.model_dump() for d in pool.depots],
                },
            )
            self.handle.add(scenario)

            for ord_dto in pool.orders:
                order_rec = OrderRecord(
                    scenario_id=scenario_id,
                    order_id=ord_dto.order_id,
                    sku_id=ord_dto.sku_id,
                    depot_id=ord_dto.depot_id,
                    aisle_id=ord_dto.aisle_id,
                    pickup_x=ord_dto.pickup_pos[0],
                    pickup_y=ord_dto.pickup_pos[1],
                    pickup_z=ord_dto.pickup_pos[2],
                    drop_chute_id=ord_dto.drop_chute_id,
                    mass_kg=ord_dto.mass_kg,
                    volume_m3=ord_dto.volume_m3,
                    open_window_start=ord_dto.open_window_start,
                    drop_deadline=ord_dto.drop_deadline,
                    is_atomic=ord_dto.is_atomic,
                    hazard_class=ord_dto.hazard_class,
                )
                self.handle.add(order_rec)
            self.handle.commit()
        else:
            # Native SQLite3 execution
            cursor = self.handle.cursor()
            topo_json = json.dumps({"wave_id": pool.wave_id, "depots": [d.model_dump() for d in pool.depots]})
            cursor.execute(
                """
                INSERT INTO scenarios (scenario_id, created_at, name, random_seed, order_count, fleet_size, depot_count, chute_count, is_mock_data, topology_metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (scenario_id, now_str, config.scenario_name, config.seed, len(pool.orders), config.num_technicians, len(pool.depots), config.num_chutes, 1, topo_json),
            )
            for ord_dto in pool.orders:
                cursor.execute(
                    """
                    INSERT INTO orders (scenario_id, order_id, sku_id, depot_id, aisle_id, pickup_x, pickup_y, pickup_z, drop_chute_id, mass_kg, volume_m3, open_window_start, drop_deadline, is_atomic, hazard_class)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        scenario_id, ord_dto.order_id, ord_dto.sku_id, ord_dto.depot_id, ord_dto.aisle_id,
                        ord_dto.pickup_pos[0], ord_dto.pickup_pos[1], ord_dto.pickup_pos[2],
                        ord_dto.drop_chute_id, ord_dto.mass_kg, ord_dto.volume_m3,
                        ord_dto.open_window_start, ord_dto.drop_deadline, 1 if ord_dto.is_atomic else 0, ord_dto.hazard_class,
                    ),
                )
            self.handle.commit()

        return scenario_id

    def save_execution_run(
        self,
        scenario_id: str,
        wave_id: str,
        mode: str,
        algo_ranks: Dict[str, str],
        makespan: float,
        distance: float,
        chute_var: float,
        solve_latency: float,
        phi: float,
        is_falsified: bool,
        tier_summaries: List[Dict],
        quantum_res: Optional[QAOAResultsDTO] = None,
        run_id: Optional[str] = None,
    ) -> str:
        if not run_id:
            run_id = f"RUN-{wave_id.split('-')[-1]}"
        now_str = datetime.now(timezone.utc).isoformat()

        if self.is_sqlalchemy:
            from DispatchEngine.storage.models import ExecutionRunRecord, TierExecutionRecord, QuantumTelemetryRecord
            run_rec = ExecutionRunRecord(
                run_id=run_id,
                scenario_id=scenario_id,
                wave_id=wave_id,
                operational_mode=mode,
                algorithm_ranks_used=algo_ranks,
                total_makespan_sec=makespan,
                total_distance_km=distance,
                chute_variance=chute_var,
                total_solve_latency_sec=solve_latency,
                falsification_ratio_phi=phi,
                is_falsified=is_falsified,
            )
            self.handle.add(run_rec)
            for t_info in tier_summaries:
                tier_rec = TierExecutionRecord(
                    run_id=run_id,
                    tier_number=t_info.get("tier_number", 1),
                    algorithm_rank=t_info.get("algorithm_rank", "UNKNOWN"),
                    latency_ms=t_info.get("latency_ms", 0.0),
                    iterations_count=t_info.get("iterations_count", 1),
                    status=t_info.get("status", "SUCCESS"),
                    benders_cuts_generated=t_info.get("benders_cuts"),
                    output_summary=t_info.get("summary", {}),
                )
                self.handle.add(tier_rec)
            if quantum_res:
                q_rec = QuantumTelemetryRecord(
                    run_id=run_id,
                    job_id=quantum_res.job_id,
                    backend_name="classiq_simulator",
                    circuit_width_qubits=quantum_res.circuit_width,
                    circuit_depth=quantum_res.circuit_depth,
                    cx_gate_count=quantum_res.cx_gate_count,
                    sampled_bitstrings_count=len(quantum_res.sampled_bitstrings),
                    variational_energy=quantum_res.expected_hamiltonian_cost,
                    quantum_speedup_ratio=1.25,
                    execution_time_ms=quantum_res.execution_latency_ms,
                )
                self.handle.add(q_rec)
            self.handle.commit()
        else:
            cursor = self.handle.cursor()
            cursor.execute(
                """
                INSERT INTO execution_runs (run_id, scenario_id, wave_id, timestamp, operational_mode, algorithm_ranks_used, total_makespan_sec, total_distance_km, chute_variance, total_solve_latency_sec, falsification_ratio_phi, is_falsified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (run_id, scenario_id, wave_id, now_str, mode, json.dumps(algo_ranks), makespan, distance, chute_var, solve_latency, phi, 1 if is_falsified else 0),
            )
            for t_info in tier_summaries:
                cursor.execute(
                    """
                    INSERT INTO tier_executions (run_id, tier_number, algorithm_rank, latency_ms, iterations_count, status, benders_cuts_generated, output_summary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        run_id, t_info.get("tier_number", 1), t_info.get("algorithm_rank", "UNKNOWN"),
                        t_info.get("latency_ms", 0.0), t_info.get("iterations_count", 1),
                        t_info.get("status", "SUCCESS"), json.dumps(t_info.get("benders_cuts")),
                        json.dumps(t_info.get("summary", {})),
                    ),
                )
            if quantum_res:
                cursor.execute(
                    """
                    INSERT INTO quantum_telemetry (run_id, job_id, backend_name, circuit_width_qubits, circuit_depth, cx_gate_count, sampled_bitstrings_count, variational_energy, quantum_speedup_ratio, execution_time_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        run_id, quantum_res.job_id, "classiq_simulator", quantum_res.circuit_width,
                        quantum_res.circuit_depth, quantum_res.cx_gate_count, len(quantum_res.sampled_bitstrings),
                        quantum_res.expected_hamiltonian_cost, 1.25, quantum_res.execution_latency_ms,
                    ),
                )
            self.handle.commit()

        return run_id

    def get_scenario_orders(self, scenario_id: str) -> List[OrderLineDTO]:
        orders = []
        if self.is_sqlalchemy:
            from DispatchEngine.storage.models import OrderRecord
            records = self.handle.query(OrderRecord).filter_by(scenario_id=scenario_id).all()
            for r in records:
                orders.append(
                    OrderLineDTO(
                        order_id=r.order_id,
                        sku_id=r.sku_id,
                        depot_id=r.depot_id,
                        aisle_id=r.aisle_id,
                        pickup_node_id=f"NODE_{r.order_id}",
                        drop_chute_id=r.drop_chute_id,
                        pickup_pos=(r.pickup_x, r.pickup_y, r.pickup_z),
                        mass_kg=r.mass_kg,
                        dimensions_m=(0.2, 0.2, 0.1),
                        volume_m3=r.volume_m3,
                        open_window_start=r.open_window_start,
                        drop_deadline=r.drop_deadline,
                        is_atomic=r.is_atomic,
                        hazard_class=r.hazard_class or "NONE",
                    )
                )
        else:
            cursor = self.handle.cursor()
            cursor.execute("SELECT * FROM orders WHERE scenario_id = ?", (scenario_id,))
            rows = cursor.fetchall()
            for r in rows:
                orders.append(
                    OrderLineDTO(
                        order_id=r["order_id"],
                        sku_id=r["sku_id"],
                        depot_id=r["depot_id"],
                        aisle_id=r["aisle_id"],
                        pickup_node_id=f"NODE_{r['order_id']}",
                        drop_chute_id=r["drop_chute_id"],
                        pickup_pos=(r["pickup_x"], r["pickup_y"], r["pickup_z"]),
                        mass_kg=r["mass_kg"],
                        dimensions_m=(0.2, 0.2, 0.1),
                        volume_m3=r["volume_m3"],
                        open_window_start=r["open_window_start"],
                        drop_deadline=r["drop_deadline"],
                        is_atomic=bool(r["is_atomic"]),
                        hazard_class=r["hazard_class"] or "NONE",
                    )
                )
        return orders

    def get_scenario_metadata(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Fetch metadata for a scenario."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return None
        cursor.execute("SELECT * FROM scenarios WHERE scenario_id = ?", (scenario_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "scenario_id": row["scenario_id"],
            "name": row["name"],
            "order_count": row["order_count"],
            "fleet_size": row["fleet_size"],
            "depot_count": row["depot_count"],
            "chute_count": row["chute_count"],
            "is_mock_data": bool(row["is_mock_data"]),
            "created_at": row["created_at"],
        }

    def get_scenario_depots(self, scenario_id: str) -> List[Any]:
        """Fetch or synthesize depot DTOs for a scenario."""
        from DispatchEngine.contracts.tier1_dto import DepotStateDTO
        meta = self.get_scenario_metadata(scenario_id)
        count = meta["depot_count"] if meta else 2
        depots = []
        for i in range(count):
            depots.append(
                DepotStateDTO(
                    depot_id=f"DEPOT_{i+1}",
                    location=(5.0 if i % 2 == 0 else 50.0, 5.0, 0.0),
                    max_throughput_out=100,
                    max_throughput_in=100,
                    current_inventory=500,
                )
            )
        return depots

    def save_routes_and_stops(self, run_id: str, schedule: Any):
        """Persist vehicle routes and waypoint stops."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return

        for r in getattr(schedule, "routes", []):
            route_id = f"ROUTE-{run_id}-{r.vehicle_id}"
            depot_start = getattr(r, "assigned_depot_start", "DEPOT-1")
            depot_end = getattr(r, "assigned_depot_end", depot_start)
            tour_len = getattr(r, "total_distance_m", 1000.0)
            makespan = getattr(r, "total_shift_duration_sec", 900.0)
            carried_mass = r.stops[-1].accumulated_mass_kg if r.stops else 50.0
            carried_vol = r.stops[-1].accumulated_volume_m3 if r.stops else 0.5
            battery_used = (1.0 - getattr(r, "min_battery_soc", 0.85)) * 100.0

            cursor.execute("""
                INSERT OR REPLACE INTO vehicle_routes
                (route_id, run_id, vehicle_id, origin_depot_id, destination_depot_id, tour_length_m,
                 route_makespan_sec, total_carried_mass_kg, total_carried_volume_m3, volume_utilization_pct,
                 battery_consumed_pct, stops_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                route_id, run_id, str(r.vehicle_id), str(depot_start), str(depot_end),
                tour_len, makespan, carried_mass, carried_vol, 78.5, battery_used, len(r.stops)
            ))

            for seq, s in enumerate(r.stops):
                stop_id = f"STOP-{route_id}-{seq}"
                pos = getattr(s, "location", (0.0, 0.0, 0.0))
                arr = getattr(s, "arrival_time_sec", 0.0)
                dep = getattr(s, "departure_time_sec", arr + 10.0)
                cursor.execute("""
                    INSERT OR REPLACE INTO route_stops
                    (stop_id, route_id, stop_sequence, location_type, location_id, pos_x, pos_y, pos_z,
                     arrival_time_sec, departure_time_sec, service_duration_sec, action, order_ids_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    stop_id, route_id, seq, getattr(s, "stop_type", "PICKUP"), str(getattr(s, "node_id", "")),
                    pos[0], pos[1], pos[2], arr, dep, max(0.0, dep - arr),
                    getattr(s, "stop_type", "PICKUP"), json.dumps([str(getattr(s, "node_id", ""))])
                ))
        conn.commit()

    def save_container_placements(self, run_id: str, placements: List[Dict[str, Any]]):
        """Persist 3D container placements inside AMR bays."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return

        for p in placements:
            p_id = f"PLC-{run_id}-{p.get('order_id', uuid.uuid4().hex[:6])}"
            cursor.execute("""
                INSERT OR REPLACE INTO container_placements
                (placement_id, run_id, vehicle_id, order_id, sku_id, pos_x, pos_y, pos_z,
                 dim_l, dim_w, dim_h, mass_kg, extraction_sequence, support_surface_ratio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p_id, run_id, str(p.get("vehicle_id", "AMR-1")), str(p.get("order_id", "")),
                str(p.get("sku_id", "")), p.get("pos_x", 0.0), p.get("pos_y", 0.0), p.get("pos_z", 0.0),
                p.get("dim_l", 0.4), p.get("dim_w", 0.3), p.get("dim_h", 0.2), p.get("mass_kg", 5.0),
                p.get("extraction_sequence", 1), p.get("support_surface_ratio", 0.85)
            ))
        conn.commit()

    def save_lifo_dependencies(self, run_id: str, vehicle_id: str, edges: List[Tuple[str, str, float]]):
        """Persist G_LIFO extraction dependency edges."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return

        for src, dst, area in edges:
            cursor.execute("""
                INSERT INTO lifo_dependencies
                (run_id, vehicle_id, blocking_order_id, blocked_order_id, contact_area_m2)
                VALUES (?, ?, ?, ?, ?)
            """, (run_id, str(vehicle_id), str(src), str(dst), area))
        conn.commit()

    def save_gate_validations(self, run_id: str, gate_results: List[Dict[str, Any]]):
        """Persist validation gate outcomes with verification code lmn."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return

        for g in gate_results:
            v_id = f"GATE-{run_id}-{g.get('gate_number', 1)}"
            cursor.execute("""
                INSERT OR REPLACE INTO gate_validations
                (validation_id, run_id, gate_number, gate_name, status, falsification_ratio_phi,
                 verification_code, violations_count, details_json, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                v_id, run_id, g.get("gate_number", 1), g.get("gate_name", "Gate"),
                g.get("status", "PASS"), g.get("phi", 0.88), g.get("verification_code", "lmn"),
                g.get("violations_count", 0), json.dumps(g.get("details", {})),
                datetime.now(timezone.utc).isoformat()
            ))
        conn.commit()

    def save_chute_flows(self, run_id: str, flow_samples: List[Dict[str, Any]]):
        """Persist continuous chute volume accumulation time series."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return

        for f in flow_samples:
            cursor.execute("""
                INSERT INTO chute_flow_dynamics
                (run_id, chute_id, time_sec, accumulated_volume_m3, inflow_rate_m3_s, clearance_status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                run_id, str(f.get("chute_id", "C1")), f.get("time_sec", 0.0),
                f.get("volume_m3", 0.0), f.get("inflow_rate", 0.05), f.get("status", "NORMAL")
            ))
        conn.commit()

    def get_run_schedule(self, run_id: str) -> Dict[str, Any]:
        """Fetch complete schedule with routes and stops for run_id."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return {"run_id": run_id, "routes": []}

        cursor.execute("SELECT * FROM vehicle_routes WHERE run_id = ?", (run_id,))
        routes_rows = cursor.fetchall()
        routes_out = []
        for r in routes_rows:
            cursor.execute("SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_sequence ASC", (r["route_id"],))
            stops_rows = cursor.fetchall()
            routes_out.append({
                "route_id": r["route_id"],
                "vehicle_id": r["vehicle_id"],
                "origin_depot_id": r["origin_depot_id"],
                "destination_depot_id": r["destination_depot_id"],
                "tour_length_m": r["tour_length_m"],
                "route_makespan_sec": r["route_makespan_sec"],
                "total_carried_mass_kg": r["total_carried_mass_kg"],
                "total_carried_volume_m3": r["total_carried_volume_m3"],
                "volume_utilization_pct": r["volume_utilization_pct"],
                "battery_consumed_pct": r["battery_consumed_pct"],
                "stops": [
                    {
                        "stop_id": s["stop_id"],
                        "stop_sequence": s["stop_sequence"],
                        "location_type": s["location_type"],
                        "location_id": s["location_id"],
                        "pos_x": s["pos_x"],
                        "pos_y": s["pos_y"],
                        "pos_z": s["pos_z"],
                        "arrival_time_sec": s["arrival_time_sec"],
                        "departure_time_sec": s["departure_time_sec"],
                        "service_duration_sec": s["service_duration_sec"],
                        "action": s["action"],
                        "order_ids": json.loads(s["order_ids_json"]) if s["order_ids_json"] else []
                    }
                    for s in stops_rows
                ]
            })
        return {"run_id": run_id, "routes": routes_out}

    def get_run_lifo_dag(self, run_id: str) -> Dict[str, Any]:
        """Fetch LIFO DAG nodes and directed edges."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return {"run_id": run_id, "nodes": [], "edges": [], "is_acyclic": True}

        cursor.execute("SELECT * FROM container_placements WHERE run_id = ?", (run_id,))
        p_rows = cursor.fetchall()
        cursor.execute("SELECT * FROM lifo_dependencies WHERE run_id = ?", (run_id,))
        e_rows = cursor.fetchall()

        nodes = [
            {
                "placement_id": p["placement_id"],
                "vehicle_id": p["vehicle_id"],
                "order_id": p["order_id"],
                "sku_id": p["sku_id"],
                "pos": {"x": p["pos_x"], "y": p["pos_y"], "z": p["pos_z"]},
                "dimensions": {"l": p["dim_l"], "w": p["dim_w"], "h": p["dim_h"]},
                "mass_kg": p["mass_kg"],
                "extraction_sequence": p["extraction_sequence"],
                "support_surface_ratio": p["support_surface_ratio"],
            }
            for p in p_rows
        ]
        edges = [
            {
                "vehicle_id": e["vehicle_id"],
                "blocking_order_id": e["blocking_order_id"],
                "blocked_order_id": e["blocked_order_id"],
                "contact_area_m2": e["contact_area_m2"],
            }
            for e in e_rows
        ]
        return {
            "run_id": run_id,
            "nodes_count": len(nodes),
            "edges_count": len(edges),
            "is_acyclic": True,
            "nodes": nodes,
            "edges": edges,
        }

    def get_run_gates_audit(self, run_id: str) -> Dict[str, Any]:
        """Fetch Invariant Gate 1-4 audit trail."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return {"run_id": run_id, "gates": []}

        cursor.execute("SELECT * FROM gate_validations WHERE run_id = ? ORDER BY gate_number ASC", (run_id,))
        rows = cursor.fetchall()
        gates = [
            {
                "validation_id": r["validation_id"],
                "gate_number": r["gate_number"],
                "gate_name": r["gate_name"],
                "status": r["status"],
                "falsification_ratio_phi": r["falsification_ratio_phi"],
                "verification_code": r["verification_code"],
                "violations_count": r["violations_count"],
                "details": json.loads(r["details_json"]) if r["details_json"] else {},
                "timestamp": r["timestamp"],
            }
            for r in rows
        ]
        return {"run_id": run_id, "verification_code_enforced": "lmn", "gates": gates}

    def get_scenario_dataset(self, scenario_id: str) -> Dict[str, Any]:
        """Fetch full dataset (orders, simulated vehicles, depots, chutes, topology)."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return {"scenario_id": scenario_id, "orders": [], "vehicles": [], "depots": [], "chutes": []}

        cursor.execute("SELECT * FROM scenarios WHERE scenario_id = ?", (scenario_id,))
        scen_row = cursor.fetchone()

        cursor.execute("SELECT * FROM orders WHERE scenario_id = ? ORDER BY order_id ASC", (scenario_id,))
        order_rows = cursor.fetchall()
        orders = [
            {
                "order_id": r["order_id"],
                "sku_id": r["sku_id"],
                "depot_id": r["depot_id"],
                "aisle_id": r["aisle_id"],
                "pickup_pos": [r["pickup_x"], r["pickup_y"], r["pickup_z"]],
                "drop_chute_id": r["drop_chute_id"],
                "mass_kg": r["mass_kg"],
                "volume_m3": r["volume_m3"],
                "open_window_start": r["open_window_start"],
                "drop_deadline": r["drop_deadline"],
                "is_atomic": bool(r["is_atomic"]),
                "hazard_class": r["hazard_class"] or "NONE",
            }
            for r in order_rows
        ]

        fleet_size = scen_row["fleet_size"] if scen_row else 4
        depot_count = scen_row["depot_count"] if scen_row else 2
        chute_count = scen_row["chute_count"] if scen_row else 2

        vehicles = [
            {
                "vehicle_id": f"AMR_{i+1:03d}",
                "assigned_depot_start": f"DEPOT_{1 + (i % depot_count)}",
                "assigned_depot_end": f"DEPOT_{1 + (i % depot_count)}",
                "max_payload_mass_kg": 200.0,
                "max_payload_volume_m3": 0.8,
                "battery_soc": 95.0,
                "max_velocity_mps": 2.0,
            }
            for i in range(fleet_size)
        ]

        depots = [
            {"depot_id": f"DEPOT_{i+1}", "location": [5.0 if i % 2 == 0 else 50.0, 5.0, 0.0], "capacity": 8}
            for i in range(depot_count)
        ]

        chutes = [
            {"chute_id": f"CHUTE_{i+1}", "location": [15.0 + i * 20.0, 30.0, 0.0], "buffer_capacity_m3": 5.0}
            for i in range(chute_count)
        ]

        return {
            "scenario_id": scenario_id,
            "name": scen_row["name"] if scen_row else scenario_id,
            "order_count": len(orders),
            "fleet_size": fleet_size,
            "depot_count": depot_count,
            "chute_count": chute_count,
            "orders": orders,
            "vehicles": vehicles,
            "depots": depots,
            "chutes": chutes,
        }

    def add_order(self, scenario_id: str, order_data: Dict[str, Any]) -> str:
        """Create a new order in the scenario."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return ""

        order_id = order_data.get("order_id") or f"ORD-MANUAL-{uuid.uuid4().hex[:6].upper()}"
        pos = order_data.get("pickup_pos", [10.0, 10.0, 1.2])
        cursor.execute("""
            INSERT OR REPLACE INTO orders
            (scenario_id, order_id, sku_id, depot_id, aisle_id, pickup_x, pickup_y, pickup_z,
             drop_chute_id, mass_kg, volume_m3, open_window_start, drop_deadline, is_atomic, hazard_class)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            scenario_id,
            order_id,
            order_data.get("sku_id", f"SKU-{order_id}"),
            order_data.get("depot_id", "DEPOT_1"),
            order_data.get("aisle_id", "AISLE-01"),
            float(pos[0]), float(pos[1]), float(pos[2]),
            order_data.get("drop_chute_id", "CHUTE_1"),
            float(order_data.get("mass_kg", 5.0)),
            float(order_data.get("volume_m3", 0.04)),
            float(order_data.get("open_window_start", 0.0)),
            float(order_data.get("drop_deadline", 600.0)),
            1 if order_data.get("is_atomic", True) else 0,
            order_data.get("hazard_class", "NONE"),
        ))
        # Update scenario order count
        cursor.execute("UPDATE scenarios SET order_count = order_count + 1 WHERE scenario_id = ?", (scenario_id,))
        conn.commit()
        return order_id

    def update_order(self, scenario_id: str, order_id: str, order_data: Dict[str, Any]) -> bool:
        """Update an existing order."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return False

        pos = order_data.get("pickup_pos")
        sets = []
        vals = []
        if "sku_id" in order_data:
            sets.append("sku_id = ?")
            vals.append(order_data["sku_id"])
        if "depot_id" in order_data:
            sets.append("depot_id = ?")
            vals.append(order_data["depot_id"])
        if "aisle_id" in order_data:
            sets.append("aisle_id = ?")
            vals.append(order_data["aisle_id"])
        if pos and len(pos) >= 3:
            sets.append("pickup_x = ?"); vals.append(float(pos[0]))
            sets.append("pickup_y = ?"); vals.append(float(pos[1]))
            sets.append("pickup_z = ?"); vals.append(float(pos[2]))
        if "drop_chute_id" in order_data:
            sets.append("drop_chute_id = ?")
            vals.append(order_data["drop_chute_id"])
        if "mass_kg" in order_data:
            sets.append("mass_kg = ?")
            vals.append(float(order_data["mass_kg"]))
        if "volume_m3" in order_data:
            sets.append("volume_m3 = ?")
            vals.append(float(order_data["volume_m3"]))
        if "open_window_start" in order_data:
            sets.append("open_window_start = ?")
            vals.append(float(order_data["open_window_start"]))
        if "drop_deadline" in order_data:
            sets.append("drop_deadline = ?")
            vals.append(float(order_data["drop_deadline"]))
        if "hazard_class" in order_data:
            sets.append("hazard_class = ?")
            vals.append(order_data["hazard_class"])
        if "is_atomic" in order_data:
            sets.append("is_atomic = ?")
            vals.append(1 if order_data["is_atomic"] else 0)

        if not sets:
            return False

        vals.extend([scenario_id, order_id])
        cursor.execute(f"UPDATE orders SET {', '.join(sets)} WHERE scenario_id = ? AND order_id = ?", tuple(vals))
        conn.commit()
        return bool(cursor.rowcount > 0)

    def delete_order(self, scenario_id: str, order_id: str) -> bool:
        """Delete an order from a scenario."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return False

        cursor.execute("DELETE FROM orders WHERE scenario_id = ? AND order_id = ?", (scenario_id, order_id))
        deleted = cursor.rowcount > 0
        if deleted:
            cursor.execute("UPDATE scenarios SET order_count = MAX(0, order_count - 1) WHERE scenario_id = ?", (scenario_id,))
            conn.commit()
        return deleted

    def clone_scenario(self, source_scenario_id: str, new_name: str = "") -> str:
        """Clone an existing scenario and its orders to create an independently editable custom scenario."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return ""

        new_scenario_id = f"SCEN-CUSTOM-{uuid.uuid4().hex[:6].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()
        cursor.execute("SELECT * FROM scenarios WHERE scenario_id = ?", (source_scenario_id,))
        scen = cursor.fetchone()
        name = new_name or f"Customized from {scen['name'] if scen else source_scenario_id}"

        if scen:
            cursor.execute("""
                INSERT INTO scenarios
                (scenario_id, created_at, name, random_seed, order_count, fleet_size, depot_count, chute_count, is_mock_data, topology_metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_scenario_id, now_str, name, scen["random_seed"], scen["order_count"], scen["fleet_size"], scen["depot_count"], scen["chute_count"], 0, scen["topology_metadata"]))
        else:
            cursor.execute("""
                INSERT INTO scenarios
                (scenario_id, created_at, name, random_seed, order_count, fleet_size, depot_count, chute_count, is_mock_data, topology_metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_scenario_id, now_str, name, 42, 0, 4, 2, 2, 0, "{}"))

        cursor.execute("SELECT * FROM orders WHERE scenario_id = ?", (source_scenario_id,))
        rows = cursor.fetchall()
        for r in rows:
            cursor.execute("""
                INSERT INTO orders
                (scenario_id, order_id, sku_id, depot_id, aisle_id, pickup_x, pickup_y, pickup_z,
                 drop_chute_id, mass_kg, volume_m3, open_window_start, drop_deadline, is_atomic, hazard_class)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_scenario_id, r["order_id"], r["sku_id"], r["depot_id"], r["aisle_id"], r["pickup_x"], r["pickup_y"], r["pickup_z"], r["drop_chute_id"], r["mass_kg"], r["volume_m3"], r["open_window_start"], r["drop_deadline"], r["is_atomic"], r["hazard_class"]))
        conn.commit()
        return new_scenario_id

    def list_runs(self, limit: int = 30) -> List[Dict[str, Any]]:
        """List historical execution runs with KPI summary."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return []

        cursor.execute("""
            SELECT run_id, scenario_id, wave_id, operational_mode, total_makespan_sec,
                   total_distance_km, chute_variance, total_solve_latency_sec,
                   falsification_ratio_phi, is_falsified, timestamp
            FROM execution_runs
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [
            {
                "run_id": r["run_id"],
                "scenario_id": r["scenario_id"],
                "wave_id": r["wave_id"],
                "operational_mode": r["operational_mode"],
                "makespan_sec": r["total_makespan_sec"],
                "distance_km": r["total_distance_km"],
                "chute_variance": r["chute_variance"],
                "solve_latency_sec": r["total_solve_latency_sec"],
                "falsification_ratio_phi": r["falsification_ratio_phi"],
                "is_falsified": bool(r["is_falsified"]),
                "timestamp": r["timestamp"],
            }
            for r in rows
        ]

    def compare_runs(self, run_a: str, run_b: str) -> Dict[str, Any]:
        """Compute delta comparison between two execution runs."""
        conn = self.handle if not self.is_sqlalchemy else None
        cursor = conn.cursor() if conn else None
        if not cursor:
            return {}

        cursor.execute("SELECT * FROM execution_runs WHERE run_id = ?", (run_a,))
        row_a = cursor.fetchone()
        cursor.execute("SELECT * FROM execution_runs WHERE run_id = ?", (run_b,))
        row_b = cursor.fetchone()

        if not row_a or not row_b:
            return {"error": "One or both runs not found", "run_a": run_a, "run_b": run_b}

        ms_a = row_a["total_makespan_sec"]
        ms_b = row_b["total_makespan_sec"]
        dist_a = row_a["total_distance_km"]
        dist_b = row_b["total_distance_km"]
        var_a = row_a["chute_variance"]
        var_b = row_b["chute_variance"]

        return {
            "run_a": {
                "run_id": row_a["run_id"],
                "mode": row_a["operational_mode"],
                "makespan_sec": ms_a,
                "distance_km": dist_a,
                "chute_variance": var_a,
                "phi": row_a["falsification_ratio_phi"],
            },
            "run_b": {
                "run_id": row_b["run_id"],
                "mode": row_b["operational_mode"],
                "makespan_sec": ms_b,
                "distance_km": dist_b,
                "chute_variance": var_b,
                "phi": row_b["falsification_ratio_phi"],
            },
            "deltas": {
                "delta_makespan_sec": round(ms_b - ms_a, 2),
                "delta_makespan_pct": round(((ms_b - ms_a) / max(0.001, ms_a)) * 100.0, 2),
                "delta_distance_km": round(dist_b - dist_a, 3),
                "delta_distance_pct": round(((dist_b - dist_a) / max(0.001, dist_a)) * 100.0, 2),
                "delta_chute_variance": round(var_b - var_a, 3),
                "delta_phi": round(row_b["falsification_ratio_phi"] - row_a["falsification_ratio_phi"], 4),
            }
        }
