"""Unit tests for simulator-extended API endpoints."""

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


class TestApiExtended(unittest.TestCase):
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

    def test_telemetry_events_endpoint(self):
        status, body = self._execute_request("GET", "/api/v1/telemetry/events?limit=10")
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertIn("events", data)

    def test_pdf_report_endpoint(self):
        status, body = self._execute_request("GET", "/api/v1/presentation/runs/RUN-001/report.pdf?profile=EXECUTIVE")
        self.assertEqual(status, 200)
        self.assertTrue(body.startswith(b"%PDF-"))

    def test_graph_figure_endpoint(self):
        status, body = self._execute_request("GET", "/api/v1/presentation/runs/RUN-001/graphs/spatial")
        self.assertEqual(status, 200)
        self.assertTrue(body.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_telemetry_ingest_endpoint(self):
        payload = {"events": [{"log_level": "INFO", "message": "AMR Telemetry Frame", "vehicle_id": "AMR-1"}]}
        status, body = self._execute_request("POST", "/api/v1/telemetry/ingest", payload)
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertEqual(data["status"], "ingested")


if __name__ == "__main__":
    unittest.main()
