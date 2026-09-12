"""Asynchronous, non-blocking log handler flushing structured records to database."""

from __future__ import annotations
import json
import logging
import queue
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from DispatchEngine.storage.database import DatabaseManager


class DatabaseLogHandler(logging.Handler):
    """Worker-thread batched database logger sink for high-throughput zero-latency logging."""

    def __init__(self, batch_size: int = 50, flush_interval_sec: float = 0.5):
        super().__init__()
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.queue: queue.Queue = queue.Queue(maxsize=10000)
        self._stop_event = threading.Event()
        self._worker = threading.Thread(target=self._flush_loop, daemon=True, name="DBLoggerWorker")
        self._worker.start()

    def emit(self, record: logging.LogRecord):
        try:
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "log_level": record.levelname,
                "logger_name": record.name,
                "trace_id": getattr(record, "trace_id", "0" * 32),
                "span_id": getattr(record, "span_id", "0" * 16),
                "wave_id": getattr(record, "wave_id", None),
                "vehicle_id": getattr(record, "vehicle_id", None),
                "message": record.getMessage(),
                "attributes_json": json.dumps(getattr(record, "warehouse_data", {})),
                "error_stack": self.formatException(record.exc_info) if record.exc_info else None,
            }
            self.queue.put_nowait(entry)
        except queue.Full:
            pass  # Drop under extreme backpressure to protect optimization thread
        except Exception:
            pass

    def _flush_loop(self):
        while not self._stop_event.is_set():
            batch: List[Dict[str, Any]] = []
            start = time.time()
            while len(batch) < self.batch_size and (time.time() - start) < self.flush_interval_sec:
                try:
                    item = self.queue.get(timeout=0.1)
                    batch.append(item)
                except queue.Empty:
                    break

            if batch:
                self._insert_batch(batch)

    def _insert_batch(self, batch: List[Dict[str, Any]]):
        try:
            conn = DatabaseManager.get_connection()
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT INTO telemetry_events 
                (timestamp, log_level, logger_name, trace_id, span_id, wave_id, vehicle_id, message, attributes_json, error_stack)
                VALUES (:timestamp, :log_level, :logger_name, :trace_id, :span_id, :wave_id, :vehicle_id, :message, :attributes_json, :error_stack)
            """, batch)
            conn.commit()
            conn.close()
        except Exception:
            pass

    def flush_immediate(self, timeout_sec: float = 2.0):
        """Force flush all remaining items in the queue."""
        deadline = time.time() + timeout_sec
        while not self.queue.empty() and time.time() < deadline:
            batch = []
            while len(batch) < self.batch_size and not self.queue.empty():
                batch.append(self.queue.get_nowait())
            if batch:
                self._insert_batch(batch)

    def close(self):
        self._stop_event.set()
        self.flush_immediate(timeout_sec=1.0)
        self._worker.join(timeout=2.0)
        super().close()
