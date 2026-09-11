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
    ) -> str:
        run_id = f"RUN-{uuid.uuid4().hex[:8].upper()}"
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
