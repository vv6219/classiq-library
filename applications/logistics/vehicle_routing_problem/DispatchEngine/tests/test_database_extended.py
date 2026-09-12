"""Tests for extended 11-table database schema and deep artifact persistence."""

import unittest
import tempfile
from pathlib import Path
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.storage.repository import WarehouseRepository
from DispatchEngine.storage.mock_generator import WarehouseMockGenerator
from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.orchestrator import DispatchOrchestrator
from DispatchEngine.common_types import OperationalMode


class TestDatabaseExtended(unittest.TestCase):
    def test_extended_schema_and_deep_persistence(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_db = Path(tmp_dir) / "test_extended.db"
            DatabaseManager.init_schema(test_db)
            session = DatabaseManager.get_session(test_db)

            try:
                # 1. Generate scenario
                cfg = MockConfigDTO(
                    scenario_name="Test-Deep-Persist",
                    num_orders=20,
                    num_technicians=2,
                    num_depots=2,
                    num_chutes=2,
                    seed=42,
                )
                pool = WarehouseMockGenerator.generate_scenario(cfg)
                repo = WarehouseRepository(session)
                scen_id = repo.save_scenario(cfg, pool)

                # 2. Execute wave
                orchestrator = DispatchOrchestrator(num_vehicles=2, db_session=session)
                schedule, trajectories, frames, hud = orchestrator.execute_wave(
                    pool, scenario_id=scen_id, force_mode=OperationalMode.QUANTUM
                )

                # Find the run_id from execution_runs table
                cursor = session.cursor()
                cursor.execute("SELECT run_id FROM execution_runs WHERE scenario_id = ?", (scen_id,))
                row = cursor.fetchone()
                self.assertIsNotNone(row)
                run_id = row["run_id"]

                # 3. Verify vehicle routes & stops
                sched_data = repo.get_run_schedule(run_id)
                self.assertEqual(sched_data["run_id"], run_id)
                self.assertGreater(len(sched_data["routes"]), 0)
                first_route = sched_data["routes"][0]
                self.assertIn("stops", first_route)
                self.assertGreater(len(first_route["stops"]), 0)

                # 4. Verify LIFO DAG & container placements
                lifo_data = repo.get_run_lifo_dag(run_id)
                self.assertEqual(lifo_data["run_id"], run_id)
                self.assertGreater(lifo_data["nodes_count"], 0)
                self.assertTrue(lifo_data["is_acyclic"])

                # 5. Verify validation gates audit (code 'lmn')
                gates_data = repo.get_run_gates_audit(run_id)
                self.assertEqual(gates_data["verification_code_enforced"], "lmn")
                self.assertEqual(len(gates_data["gates"]), 4)
                for g in gates_data["gates"]:
                    self.assertEqual(g["status"], "PASS")
                    self.assertEqual(g["verification_code"], "lmn")
                    self.assertEqual(g["violations_count"], 0)

                # 6. Verify chute flow dynamics
                cursor.execute("SELECT COUNT(*) as cnt FROM chute_flow_dynamics WHERE run_id = ?", (run_id,))
                cnt = cursor.fetchone()["cnt"]
                self.assertGreater(cnt, 0)

            finally:
                DatabaseManager.close_session(session)


if __name__ == "__main__":
    unittest.main()
