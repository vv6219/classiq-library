"""Distributed trace span context manager."""

from __future__ import annotations
import time
import uuid
from contextlib import contextmanager
from typing import Generator, Dict, Any, Optional
from DispatchEngine.telemetry.logger import get_logger

logger = get_logger("DispatchEngine.Tracer")


@contextmanager
def trace_span(span_name: str, attributes: Optional[Dict[str, Any]] = None) -> Generator[Dict[str, Any], None, None]:
    span_id = uuid.uuid4().hex[:16]
    start_time = time.perf_counter()
    span_context: Dict[str, Any] = {
        "span_name": span_name,
        "span_id": span_id,
        "attributes": attributes or {},
    }
    
    logger.info(
        f"Starting span: {span_name}",
        extra={"span_id": span_id, "warehouse_data": span_context["attributes"]},
    )
    
    try:
        yield span_context
    finally:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        span_context["elapsed_ms"] = elapsed_ms
        logger.info(
            f"Finished span: {span_name} [{elapsed_ms:.2f}ms]",
            extra={"span_id": span_id, "warehouse_data": {**span_context["attributes"], "latency_ms": elapsed_ms}},
        )
