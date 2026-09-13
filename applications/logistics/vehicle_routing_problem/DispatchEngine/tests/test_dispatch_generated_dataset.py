"""Unit and integration tests for dispatching newly generated random datasets."""

import sys
import os
import unittest
import json
import io

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from DispatchEngine.api.standalone_server import DispatchAPIRequestHandler


class MockSocket:
    def __init__(self, request_bytes: bytes):
        self.rfile = io.BytesIO(request_bytes)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if "r" in mode:
            return self.rfile
        return self.wfile

    def sendall(self, data):
        self.wfile.write(data)


class DummyServer:
    pass


class TestDispatchGeneratedDataset(unittest.TestCase):
    def _execute_request(self, method: str, path: str, body: dict = None) -> tuple[int, bytes]:
        req = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\n"
        if body is not None:
            body_bytes = json.dumps(body).encode("utf-8")
            req += f"Content-Length: {len(body_bytes)}\r\nContent-Type: application/json\r\n\r\n"
            data = req.encode("utf-8") + body_bytes
        else:
            req += "\r\n"
            data = req.encode("utf-8")

        sock = MockSocket(data)
        handler = DispatchAPIRequestHandler(sock, ("127.0.0.1", 8080), DummyServer())
        response = sock.wfile.getvalue()

        # Parse response
        lines = response.split(b"\r\n")
        status_line = lines[0].decode("utf-8")
        status_code = int(status_line.split()[1])
        parts = response.split(b"\r\n\r\n", 1)
        body_resp = parts[1] if len(parts) > 1 else b""
        return status_code, body_resp

    def test_generate_random_dataset_and_dispatch_action(self):
        """Test generating a new random dataset and immediately dispatching it."""
        # Step 1: Generate a random dataset with custom parameters
        gen_payload = {
            "scenario_name": "TEST-RANDOM-WAVE-01",
            "num_orders": 25,
            "num_vehicles": 4,
            "archetype": "UNIFORM_RANDOM",
            "seed": 9999,
            "num_depots": 2,
            "num_chutes": 4,
            "hazard_ratio": 0.20,
        }
        status, body = self._execute_request("POST", "/api/v1/scenarios/generate", gen_payload)
        self.assertEqual(status, 201)
        gen_meta = json.loads(body.decode("utf-8"))
        self.assertIn("scenario_id", gen_meta)
        scen_id = gen_meta["scenario_id"]
        self.assertTrue(scen_id.startswith("SCEN-"))
        self.assertEqual(gen_meta["order_count"], 25)
        self.assertEqual(gen_meta["fleet_size"], 4)

        # Step 2: Verify scenario orders exist in database
        status, body = self._execute_request("GET", f"/api/v1/scenarios/{scen_id}/orders")
        self.assertEqual(status, 200)
        orders_data = json.loads(body.decode("utf-8"))
        orders_list = orders_data if isinstance(orders_data, list) else orders_data.get("orders", [])
        self.assertEqual(len(orders_list), 25)
        self.assertIn("created_datetime", orders_list[0])

        # Step 3: Trigger "Dispatch Dataset" button action using the generated dataset
        dispatch_payload = {
            "scenario_id": scen_id,
            "num_orders": 25,
            "num_vehicles": 4,
            "seed": 9999,
            "operational_mode": "CLASSICAL",
        }
        status, body = self._execute_request("POST", "/api/v1/dispatch/waves", dispatch_payload)
        self.assertEqual(status, 200)
        dispatch_resp = json.loads(body.decode("utf-8"))

        self.assertEqual(dispatch_resp["scenario_id"], scen_id)
        self.assertTrue(dispatch_resp["run_id"].startswith("RUN-"))
        self.assertTrue(dispatch_resp["wave_id"].startswith("WAVE-"))
        self.assertGreater(dispatch_resp["total_fleet_makespan_sec"], 0.0)
        self.assertGreater(dispatch_resp["total_distance_km"], 0.0)
        self.assertIn("routes", dispatch_resp)
        self.assertEqual(len(dispatch_resp["routes"]), 4)

        # Step 4: Verify the schedule of the newly dispatched wave
        run_id = dispatch_resp["run_id"]
        status, body = self._execute_request("GET", f"/api/v1/dispatch/runs/{run_id}/schedule")
        self.assertEqual(status, 200)
        sched_data = json.loads(body.decode("utf-8"))
        self.assertIn("routes", sched_data)
        self.assertEqual(len(sched_data["routes"]), 4)

    def test_dispatch_frontend_synthetic_scenario(self):
        """Test dispatching a custom scenario ID that was generated client-side."""
        custom_scen_id = "SCEN-CLIENT-GEN-999"
        dispatch_payload = {
            "scenario_id": custom_scen_id,
            "num_orders": 20,
            "num_vehicles": 3,
            "seed": 4242,
            "operational_mode": "CLASSICAL",
        }
        status, body = self._execute_request("POST", "/api/v1/dispatch/waves", dispatch_payload)
        self.assertEqual(status, 200)
        dispatch_resp = json.loads(body.decode("utf-8"))
        self.assertEqual(dispatch_resp["scenario_id"], custom_scen_id)
        self.assertTrue(dispatch_resp["run_id"].startswith("RUN-"))
        self.assertEqual(len(dispatch_resp["routes"]), 3)

    def test_rerun_action_produces_new_run_id(self):
        """Test that re-running an existing scenario produces a brand new distinct run_id."""
        scen_id = "SCEN-7D42F06D"
        dispatch_payload = {
            "scenario_id": scen_id,
            "num_orders": 20,
            "num_vehicles": 3,
            "seed": 42,
            "operational_mode": "CLASSICAL",
        }

        # First execution (Initial run)
        status1, body1 = self._execute_request("POST", "/api/v1/dispatch/waves", dispatch_payload)
        self.assertEqual(status1, 200)
        resp1 = json.loads(body1.decode("utf-8"))
        run_id_1 = resp1["run_id"]
        wave_id_1 = resp1["wave_id"]

        self.assertTrue(run_id_1.startswith("RUN-"))
        self.assertEqual(resp1["scenario_id"], scen_id)

        # Second execution (Re-Run action on the same scenario)
        status2, body2 = self._execute_request("POST", "/api/v1/dispatch/waves", dispatch_payload)
        self.assertEqual(status2, 200)
        resp2 = json.loads(body2.decode("utf-8"))
        run_id_2 = resp2["run_id"]
        wave_id_2 = resp2["wave_id"]

        self.assertTrue(run_id_2.startswith("RUN-"))
        self.assertEqual(resp2["scenario_id"], scen_id)

        # Critical verification: Re-run must produce new distinct run_id and wave_id
        self.assertNotEqual(
            run_id_1, run_id_2,
            f"Re-run must produce a new unique run_id! Got duplicate: {run_id_1}"
        )
        self.assertNotEqual(
            wave_id_1, wave_id_2,
            f"Re-run must produce a new unique wave_id! Got duplicate: {wave_id_1}"
        )

        # Both runs must have their schedules persisted and queryable independently
        sched_status1, sched_body1 = self._execute_request("GET", f"/api/v1/dispatch/runs/{run_id_1}/schedule")
        self.assertEqual(sched_status1, 200)
        sched1 = json.loads(sched_body1.decode("utf-8"))
        self.assertIn("routes", sched1)
        self.assertEqual(len(sched1["routes"]), 3)

        sched_status2, sched_body2 = self._execute_request("GET", f"/api/v1/dispatch/runs/{run_id_2}/schedule")
        self.assertEqual(sched_status2, 200)
        sched2 = json.loads(sched_body2.decode("utf-8"))
        self.assertIn("routes", sched2)
        self.assertEqual(len(sched2["routes"]), 3)

    def test_dispatch_progress_stages_and_status_list(self):
        """Test that dispatch execution stages and statuses are correctly defined and verified."""
        expected_stages = [
            "Initiating dispatch wave",
            "Operational Mode selected",
            "Tier 1 Wave Decomposition",
            "Tier 2 3D Containerization",
            "Tier 3 Route Sequencing",
            "Tier 4 Kinematic Path Deconfliction",
            "Execution run committed to database",
        ]

        dispatch_payload = {
            "scenario_id": "SCEN-7D42F06D",
            "num_orders": 15,
            "num_vehicles": 3,
            "seed": 99,
            "operational_mode": "QUANTUM",
        }

        # Intercept logging output to verify all stages are triggered in order
        import logging
        import io

        log_stream = io.StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setLevel(logging.INFO)
        root_logger = logging.getLogger()
        root_logger.addHandler(handler)

        try:
            status, body = self._execute_request("POST", "/api/v1/dispatch/waves", dispatch_payload)
            self.assertEqual(status, 200)
            resp = json.loads(body.decode("utf-8"))
            self.assertTrue(resp["run_id"].startswith("RUN-"))

            log_output = log_stream.getvalue()
            for stage in expected_stages:
                self.assertIn(
                    stage,
                    log_output,
                    f"Expected pipeline progress stage '{stage}' not found in logs: {log_output}",
                )
        finally:
            root_logger.removeHandler(handler)


if __name__ == "__main__":
    unittest.main()

