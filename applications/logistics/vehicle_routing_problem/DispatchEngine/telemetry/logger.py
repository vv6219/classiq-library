"""Structured JSON / ECS OpenTelemetry compatible event logger with DB and RingBuffer sinks."""

from __future__ import annotations
import json
import logging
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from DispatchEngine.telemetry.buffer import GLOBAL_TELEMETRY_BUFFER
from DispatchEngine.telemetry.db_handler import DatabaseLogHandler


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "@timestamp": datetime.now(timezone.utc).isoformat(),
            "log.level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "trace.id": getattr(record, "trace_id", "0" * 32),
            "span.id": getattr(record, "span_id", "0" * 16),
            "warehouse": getattr(record, "warehouse_data", {}),
        }
        if record.exc_info:
            log_entry["error"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "Error",
                "message": str(record.exc_info[1]),
                "stack_trace": self.formatException(record.exc_info),
            }
        return json.dumps(log_entry)


class RingBufferLogHandler(logging.Handler):
    """Feeds structured log events directly into the in-memory ring buffer for live SSE."""
    def emit(self, record: logging.LogRecord):
        try:
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "log_level": record.levelname,
                "logger_name": record.name,
                "trace_id": getattr(record, "trace_id", "0" * 32),
                "span_id": getattr(record, "span_id", "0" * 16),
                "wave_id": getattr(record, "wave_id", None),
                "vehicle_id": getattr(record, "vehicle_id", None),
                "message": record.getMessage(),
                "warehouse_data": getattr(record, "warehouse_data", {}),
            }
            GLOBAL_TELEMETRY_BUFFER.record(event)
        except Exception:
            pass


_DB_LOG_HANDLER: Optional[DatabaseLogHandler] = None
_RING_LOG_HANDLER: Optional[RingBufferLogHandler] = None


def get_logger(name: str = "DispatchEngine") -> logging.Logger:
    global _DB_LOG_HANDLER, _RING_LOG_HANDLER
    logger = logging.getLogger(name)
    if not logger.handlers:
        formatter = StructuredJsonFormatter()
        
        # 1. Console handler
        stdout_handler = logging.StreamHandler(sys.stdout)
        stdout_handler.setFormatter(formatter)
        logger.addHandler(stdout_handler)

        # 2. In-memory ring buffer handler (for SSE)
        if _RING_LOG_HANDLER is None:
            _RING_LOG_HANDLER = RingBufferLogHandler()
        logger.addHandler(_RING_LOG_HANDLER)

        # 3. Asynchronous DB Handler
        if _DB_LOG_HANDLER is None:
            _DB_LOG_HANDLER = DatabaseLogHandler(batch_size=50, flush_interval_sec=0.5)
        logger.addHandler(_DB_LOG_HANDLER)

        # 4. Rotating file sink
        try:
            log_dir = Path(__file__).resolve().parent / "logs"
            log_dir.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(str(log_dir / "engine.log"), encoding="utf-8")
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception:
            pass

        logger.setLevel(logging.INFO)
    return logger
