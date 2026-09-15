"""Unit tests for parameter catalog, provenance ledger, and multi-tier micro-benchmarks."""

import unittest
import uuid
import time
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.storage.repository import WarehouseRepository
from DispatchEngine.storage.parameter_catalog import PARAMETER_CATALOG, build_run_parameters_snapshot
from DispatchEngine.storage.mock_generator import WarehouseMockGenerator
from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.orchestrator import DispatchOrchestrator
from DispatchEngine.common_types import OperationalMode


class TestBenchmarkLedger(unittest.TestCase):

    def setUp(self):
        self.session = DatabaseManager.get_session()
        self.repo = WarehouseRepository(self.session)

    def tearDown(self):
        DatabaseManager.close_session(self.session)

    def test_parameter_catalog_definitions(self):
        self.assertGreaterEqual(len(PARAMETER_CATALOG), 30)
        # Verify key parameters exist
        self.assertIn("fleet_size", PARAMETER_CATALOG)
        self.assertIn("max_velocity_m_s", PARAMETER_CATALOG)
        self.assertIn("max_acceleration_m_s2", PARAMETER_CATALOG)
        self.assertIn("min_soc_reserve_pct", PARAMETER_CATALOG)
        self.assertIn("fcm_fuzzifier_m", PARAMETER_CATALOG)
        self.assertIn("min_support_surface_ratio", PARAMETER_CATALOG)
        self.assertIn("qaoa_layers_p", PARAMETER_CATALOG)

        # Check parameter schema attributes
        p = PARAMETER_CATALOG["max_velocity_m_s"]
        self.assertEqual(p.param_scope, "FLEET")
        self.assertEqual(p.unit, "m/s")
        self.assertTrue(len(p.compliance_standard) > 0)
        self.assertTrue(len(p.latex_symbol) > 0)

    def test_parameter_snapshot_generation(self):
        user_cfg = {
            "fleet_size": 4,
            "max_velocity_m_s": 2.5,
            "custom_safety_margin": 1.2,
        }
        snapshot = build_run_parameters_snapshot(user_cfg, overrides={"max_velocity_m_s": 2.5})
        self.assertGreaterEqual(len(snapshot), 30)

        # Verify overridden flag
        v_max = next(s for s in snapshot if s["param_key"] == "max_velocity_m_s")
        self.assertEqual(v_max["param_value"], "2.5")
        self.assertEqual(v_max["is_overridden"], 1)

        fleet = next(s for s in snapshot if s["param_key"] == "fleet_size")
        self.assertEqual(fleet["is_overridden"], 0)

    def test_save_and_retrieve_run_parameters(self):
        run_id = f"RUN-TEST-{uuid.uuid4().hex[:8].upper()}"
        snapshot = [
            {
                "param_scope": "FLEET",
                "param_key": "fleet_size",
                "display_name": "Fleet Size",
                "param_value": "4",
                "param_type": "INTEGER",
                "unit": "AMRs",
                "description": "Active AMRs",
                "latex_symbol": r"|\mathcal{K}|",
                "min_bound": 1,
                "max_bound": 50,
                "compliance_standard": "ISO 3691-4",
                "is_overridden": 0,
            },
            {
                "param_scope": "PHYSICS",
                "param_key": "v_max_amr_mps",
                "display_name": "Max Velocity",
                "param_value": "2.0",
                "param_type": "FLOAT",
                "unit": "m/s",
                "description": "Speed ceiling",
                "latex_symbol": r"v_{\max}",
                "min_bound": 0.5,
                "max_bound": 4.0,
                "compliance_standard": "ISO 3691-4",
                "is_overridden": 1,
            },
        ]
        self.repo.save_run_input_parameters(run_id, snapshot)

        retrieved = self.repo.get_run_input_parameters(run_id)
        self.assertEqual(len(retrieved), 2)
        keys = {p["param_key"] for p in retrieved}
        self.assertIn("fleet_size", keys)
        self.assertIn("v_max_amr_mps", keys)

    def test_save_and_retrieve_tier_benchmarks(self):
        run_id = f"RUN-TEST-{uuid.uuid4().hex[:8].upper()}"
        benchmarks = [
            {
                "run_id": run_id,
                "scenario_id": "SCEN-TEST",
                "tier_name": "TIER_1_BATCHING",
                "tier_index": 1,
                "algorithm_used": "RANK_1Q_QUANTUM_FCM",
                "status": "SUCCESS",
                "latency_ms": 12.5,
                "setup_time_ms": 2.0,
                "solve_time_ms": 9.2,
                "validation_time_ms": 1.3,
                "cpu_time_ms": 11.0,
                "qpu_execution_ms": 8.0,
                "memory_peak_mb": 45.0,
                "optimality_gap_pct": 0.0,
                "metrics_json": {"chutes": 2},
            },
            {
                "run_id": run_id,
                "scenario_id": "SCEN-TEST",
                "tier_name": "TIER_3_ROUTING",
                "tier_index": 3,
                "algorithm_used": "RANK_1Q_QAOA_ROUTING",
                "status": "SUCCESS",
                "latency_ms": 52.0,
                "setup_time_ms": 5.0,
                "solve_time_ms": 43.0,
                "validation_time_ms": 4.0,
                "cpu_time_ms": 22.0,
                "qpu_execution_ms": 40.0,
                "memory_peak_mb": 72.0,
                "optimality_gap_pct": 0.5,
                "metrics_json": {"routes": 4},
            },
        ]
        self.repo.save_algorithm_benchmarks_log(benchmarks)

        retrieved = self.repo.get_tier_benchmark_breakdown(run_id)
        algo_benchmarks = retrieved["algorithm_benchmarks"]
        self.assertEqual(len(algo_benchmarks), 2)
        tier1 = next(t for t in algo_benchmarks if t["tier_number"] == 1)
        self.assertEqual(tier1["algorithm_key"], "RANK_1Q_QUANTUM_FCM")
        self.assertAlmostEqual(tier1["setup_time_ms"], 2.0)
        self.assertAlmostEqual(tier1["solve_time_ms"], 9.2)

    def test_orchestrator_wave_execution_ledger(self):
        cfg = MockConfigDTO(
            scenario_name="Test-Ledger-Scenario",
            num_orders=12,
            num_technicians=2,
            num_depots=2,
            num_chutes=2,
            seed=42,
        )
        pool = WarehouseMockGenerator.generate_scenario(cfg)
        scen_id = self.repo.save_scenario(cfg, pool)

        orchestrator = DispatchOrchestrator(num_vehicles=2, db_session=self.session)
        schedule, trajectories, frames, hud = orchestrator.execute_wave(
            pool,
            scenario_id=scen_id,
            force_mode=OperationalMode.QUANTUM,
            run_mode="32Q",
        )

        run_id = hud.run_id
        self.assertIsNotNone(run_id)

        # Verify run was saved in DB
        run_record = self.repo.get_run(run_id)
        self.assertIsNotNone(run_record)
        self.assertTrue(len(run_record.get("provenance_hash", "")) > 10)

        # Verify parameters were stored
        params = self.repo.get_run_input_parameters(run_id)
        self.assertGreaterEqual(len(params), 30)

        # Verify tier benchmarks were logged
        breakdown = self.repo.get_tier_benchmark_breakdown(run_id)
        tier_benchmarks = breakdown["tier_executions"]
        self.assertGreaterEqual(len(tier_benchmarks), 4)
        for t in tier_benchmarks:
            self.assertIn("setup_time_ms", t)
            self.assertIn("solve_time_ms", t)
            self.assertIn("validation_time_ms", t)


if __name__ == "__main__":
    unittest.main()
