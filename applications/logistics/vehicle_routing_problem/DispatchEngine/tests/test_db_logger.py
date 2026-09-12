"""Unit tests for asynchronous database logging and ring buffer telemetry."""

import unittest
import time
import logging
from DispatchEngine.telemetry.logger import get_logger
from DispatchEngine.telemetry.buffer import GLOBAL_TELEMETRY_BUFFER
from DispatchEngine.storage.database import DatabaseManager


class TestDBLogger(unittest.TestCase):
    def test_logger_and_telemetry_buffer(self):
        logger = get_logger("TestLogger")
        trace_id = "abc" * 10 + "01"
        span_id = "1234567890abcdef"

        # Emit log events
        logger.info(
            "Test informational log message",
            extra={
                "trace_id": trace_id,
                "span_id": span_id,
                "warehouse_data": {"test_metric": 42.0},
            },
        )
        logger.warning(
            "Test warning message",
            extra={
                "trace_id": trace_id,
                "span_id": span_id,
                "warehouse_data": {"chute_id": "C1", "warning_code": "CHUTE_DENSITY_HIGH"},
            },
        )

        # 1. Verify ring buffer recorded the events
        recent = GLOBAL_TELEMETRY_BUFFER.get_recent(limit=20)
        self.assertGreater(len(recent), 0)
        matching = [e for e in recent if e.get("trace_id") == trace_id]
        self.assertGreater(len(matching), 0)

        # 2. Wait for asynchronous DB worker flush
        time.sleep(0.8)

        # Verify insertion into telemetry_events table
        conn = DatabaseManager.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM telemetry_events WHERE trace_id = ?", (trace_id,))
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertGreater(row["cnt"], 0)
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
