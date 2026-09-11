"""Unit tests for OpenAPI 3.1.0 Specification, Swagger UI, and Standalone Server."""

import unittest
import json
import threading
import time
import urllib.request
import urllib.parse
from DispatchEngine.api.openapi_spec import generate_openapi_spec, export_openapi_json
from DispatchEngine.api.swagger_ui import get_swagger_ui_html, get_redoc_html
from DispatchEngine.api.standalone_server import ThreadedHTTPServer, DispatchAPIRequestHandler
from DispatchEngine.storage.mock_generator import (
    WarehouseMockGenerator,
    ScenarioArchetype,
    CANONICAL_PRESETS,
)
from DispatchEngine.contracts.storage_dto import MockConfigDTO


class TestAPIAndSwagger(unittest.TestCase):
    def test_openapi_spec_structure(self):
        spec = generate_openapi_spec()
        self.assertEqual(spec["openapi"], "3.1.0")
        self.assertIn("info", spec)
        self.assertEqual(spec["info"]["version"], "1.0.0")

        # Verify 9 tags
        tags = [t["name"] for t in spec["tags"]]
        self.assertEqual(len(tags), 9)
        self.assertIn("Scenarios & Mock Data Engine", tags)
        self.assertIn("Wave Orchestration", tags)
        self.assertIn("Quantum Co-Processor (Classiq)", tags)
        self.assertIn("Comparative Benchmarks", tags)

        # Verify essential paths
        paths = spec["paths"]
        self.assertIn("/api/v1/scenarios/archetypes", paths)
        self.assertIn("/api/v1/scenarios/mock-sample", paths)
        self.assertIn("/api/v1/scenarios/generate", paths)
        self.assertIn("/api/v1/dispatch/waves", paths)
        self.assertIn("/api/v1/quantum/swap-test", paths)
        self.assertIn("/api/v1/quantum/qaoa-subtour", paths)
        self.assertIn("/api/v1/benchmarks/compare", paths)
        self.assertIn("/api/v1/health", paths)
        self.assertIn("/openapi.json", paths)

        # JSON export test
        json_str = export_openapi_json()
        parsed = json.loads(json_str)
        self.assertEqual(parsed["openapi"], "3.1.0")

    def test_all_scenario_archetypes_generation(self):
        for arch in ScenarioArchetype:
            cfg = MockConfigDTO(
                scenario_name=f"Test-{arch.value}",
                num_orders=20,
                num_technicians=2,
                num_depots=2,
                num_chutes=2,
                archetype=arch.value,
                seed=42,
            )
            pool = WarehouseMockGenerator.generate_scenario(cfg)
            self.assertEqual(len(pool.orders), 20)
            self.assertEqual(len(pool.depots), 2)

    def test_canonical_presets(self):
        self.assertEqual(len(CANONICAL_PRESETS), 5)
        for preset_name in CANONICAL_PRESETS:
            cfg = WarehouseMockGenerator.get_preset_config(preset_name)
            self.assertIsNotNone(cfg.archetype)
            self.assertGreater(cfg.num_orders, 0)

    def test_mock_sample_preview(self):
        samples = WarehouseMockGenerator.generate_sample_orders(archetype="PARETO_HOT_ZONE", count=4)
        self.assertEqual(len(samples), 4)
        self.assertIn("order_id", samples[0])
        self.assertIn("pickup_pos", samples[0])
        self.assertIn("dimensions_m", samples[0])

    def test_swagger_ui_html(self):
        swagger_html = get_swagger_ui_html()
        self.assertIn("<title>DispatchEngine API - Swagger UI</title>", swagger_html)
        self.assertIn("SwaggerUIBundle", swagger_html)

        redoc_html = get_redoc_html()
        self.assertIn("<redoc spec-url='/openapi.json'></redoc>", redoc_html)

    def test_standalone_server_endpoints(self):
        # Start server on a high ephemeral port
        server_address = ("127.0.0.1", 18888)
        httpd = ThreadedHTTPServer(server_address, DispatchAPIRequestHandler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        time.sleep(0.2)

        base_url = "http://127.0.0.1:18888"
        try:
            # 1. Health
            with urllib.request.urlopen(f"{base_url}/api/v1/health") as resp:
                self.assertEqual(resp.status, 200)
                data = json.loads(resp.read().decode("utf-8"))
                self.assertEqual(data["status"], "healthy")

            # 2. Swagger Docs HTML
            with urllib.request.urlopen(f"{base_url}/docs") as resp:
                self.assertEqual(resp.status, 200)
                html = resp.read().decode("utf-8")
                self.assertIn("SwaggerUIBundle", html)

            # 3. OpenAPI Spec JSON
            with urllib.request.urlopen(f"{base_url}/openapi.json") as resp:
                self.assertEqual(resp.status, 200)
                spec = json.loads(resp.read().decode("utf-8"))
                self.assertEqual(spec["openapi"], "3.1.0")

            # 4. Archetypes
            with urllib.request.urlopen(f"{base_url}/api/v1/scenarios/archetypes") as resp:
                self.assertEqual(resp.status, 200)
                data = json.loads(resp.read().decode("utf-8"))
                self.assertEqual(len(data["archetypes"]), 7)

            # 5. Live Mock Sample
            with urllib.request.urlopen(f"{base_url}/api/v1/scenarios/mock-sample?archetype=PARETO_HOT_ZONE&count=3") as resp:
                self.assertEqual(resp.status, 200)
                samples = json.loads(resp.read().decode("utf-8"))
                self.assertEqual(len(samples), 3)

            # 6. Quantum Swap-Test
            swap_payload = json.dumps({"vector_a": [0.5, 0.5], "vector_b": [0.5, 0.5], "shots": 1024}).encode("utf-8")
            req = urllib.request.Request(f"{base_url}/api/v1/quantum/swap-test", data=swap_payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req) as resp:
                self.assertEqual(resp.status, 200)
                q_res = json.loads(resp.read().decode("utf-8"))
                self.assertAlmostEqual(q_res["state_fidelity"], 1.0, places=2)

        finally:
            httpd.shutdown()
            httpd.server_close()


if __name__ == "__main__":
    unittest.main()
