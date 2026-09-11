"""End-to-end tests for DispatchOrchestrator and BenchmarkComparator."""

import unittest
import tempfile
from pathlib import Path
from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.storage.mock_generator import WarehouseMockGenerator
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.orchestrator import DispatchOrchestrator
from DispatchEngine.benchmarking.comparator import BenchmarkComparator
from DispatchEngine.common_types import OperationalMode


class TestOrchestrator(unittest.TestCase):
    def test_orchestrator_wave_execution(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_db = Path(tmp_dir) / "orch_test.db"
            DatabaseManager.init_schema(test_db)
            session = DatabaseManager.get_session(test_db)
            try:
                config = MockConfigDTO(
                    scenario_name="Orch-Test-20Orders",
                    num_orders=20,
                    num_technicians=2,
                    num_depots=2,
                    num_chutes=2,
                    seed=42,
                )
                pool = WarehouseMockGenerator.generate_scenario(config)

                orchestrator = DispatchOrchestrator(num_vehicles=2, db_session=session)
                schedule, trajectories, frames, hud = orchestrator.execute_wave(
                    pool,
                    force_mode=OperationalMode.QUANTUM,
                )

                self.assertEqual(len(schedule.routes), 2)
                self.assertGreater(schedule.fleet_makespan_sec, 0.0)
                self.assertEqual(len(trajectories.trajectories), 2)
                self.assertGreater(len(frames), 0)
                self.assertEqual(hud.operational_mode, "QUANTUM")
            finally:
                DatabaseManager.close_session(session)

    def test_benchmark_comparator(self):
        config = MockConfigDTO(
            scenario_name="Bench-Test-15Orders",
            num_orders=15,
            num_technicians=2,
            num_depots=2,
            num_chutes=2,
            seed=99,
        )
        pool = WarehouseMockGenerator.generate_scenario(config)
        bench_res = BenchmarkComparator.run_benchmark(pool, num_vehicles=2)

        self.assertIn("SC_QFCM_CLASSICAL", bench_res.makespan_by_algo)
        self.assertIn("CLASSIQ_QUANTUM", bench_res.makespan_by_algo)
        self.assertIn("HARD_KMEANS", bench_res.makespan_by_algo)
        self.assertGreater(bench_res.improvement_makespan_percent, 0.0)


if __name__ == "__main__":
    unittest.main()
