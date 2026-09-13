"""Unit tests for Reports Repository Management API endpoints."""

import unittest
import json
import io
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


class TestReportsRepositoryAPI(unittest.TestCase):
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

        lines = response.split(b"\r\n")
        status_line = lines[0].decode("utf-8")
        status_code = int(status_line.split()[1])
        parts = response.split(b"\r\n\r\n", 1)
        body_resp = parts[1] if len(parts) > 1 else b""
        return status_code, body_resp

    def test_list_reports_endpoint(self):
        status, body = self._execute_request("GET", "/api/v1/presentation/reports")
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertIn("reports", data)
        self.assertIn("count", data)

    def test_generate_and_manage_report_lifecycle(self):
        # 1. Generate Executive Report
        gen_payload = {
            "profile": "EXECUTIVE",
            "format": "PDF",
            "title": "Automated Test Executive Brief",
        }
        status, body = self._execute_request(
            "POST",
            "/api/v1/presentation/runs/RUN-TEST-001/reports/generate",
            gen_payload,
        )
        self.assertEqual(status, 201)
        resp_data = json.loads(body.decode("utf-8"))
        self.assertTrue(resp_data.get("success"))
        report = resp_data.get("report", {})
        report_id = report.get("report_id")
        self.assertTrue(report_id.startswith("REP-"))
        self.assertEqual(report.get("profile"), "EXECUTIVE")
        self.assertEqual(report.get("page_count"), 2)
        self.assertTrue(len(report.get("sha256_hash", "")) == 64)

        # 2. Verify report appears in list
        status, body = self._execute_request("GET", f"/api/v1/presentation/reports?run_id=RUN-TEST-001")
        self.assertEqual(status, 200)
        list_data = json.loads(body.decode("utf-8"))
        matching = [r for r in list_data["reports"] if r["report_id"] == report_id]
        self.assertEqual(len(matching), 1)

        # 3. Download the report
        status, body = self._execute_request("GET", f"/api/v1/presentation/reports/{report_id}/download")
        self.assertEqual(status, 200)
        self.assertTrue(body.startswith(b"%PDF-"))
        self.assertGreater(len(body), 15000)

        # 4. Delete the report
        status, body = self._execute_request("DELETE", f"/api/v1/presentation/reports/{report_id}")
        self.assertEqual(status, 200)
        del_data = json.loads(body.decode("utf-8"))
        self.assertTrue(del_data.get("success"))

        # 5. Verify it is removed
        status, body = self._execute_request("GET", f"/api/v1/presentation/reports/{report_id}")
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
