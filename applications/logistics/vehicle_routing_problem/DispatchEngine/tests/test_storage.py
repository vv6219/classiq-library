"""Unit tests for database storage and mock generator."""

import unittest
import tempfile
from pathlib import Path
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.storage.models import ScenarioRecord, OrderRecord
from DispatchEngine.storage.mock_generator import WarehouseMockGenerator
from DispatchEngine.storage.repository import WarehouseRepository
from DispatchEngine.contracts.storage_dto import MockConfigDTO


class TestStorage(unittest.TestCase):
    def test_mock_generation_and_persistence(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_db = Path(tmp_dir) / "test_dispatch.db"
            DatabaseManager.init_schema(test_db)
            session = DatabaseManager.get_session(test_db)
            try:
                config = MockConfigDTO(
                    scenario_name="Test-40Orders",
                    num_orders=40,
                    num_technicians=4,
                    num_depots=2,
                    num_chutes=2,
                    seed=123,
                )
                pool = WarehouseMockGenerator.generate_scenario(config)

                self.assertEqual(len(pool.orders), 40)
                self.assertEqual(len(pool.depots), 2)

                repo = WarehouseRepository(session)
                scen_id = repo.save_scenario(config, pool)

                self.assertTrue(scen_id.startswith("SCEN-"))
                saved_orders = repo.get_scenario_orders(scen_id)
                self.assertEqual(len(saved_orders), 40)
                self.assertEqual(saved_orders[0].order_id, "ORD_00001")
            finally:
                DatabaseManager.close_session(session)


if __name__ == "__main__":
    unittest.main()
