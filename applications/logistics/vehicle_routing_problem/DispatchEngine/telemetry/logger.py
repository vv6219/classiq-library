"""Structured JSON / ECS OpenTelemetry compatible event logger."""

from __future__ import annotations
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional


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


def get_logger(name: str = "DispatchEngine") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
