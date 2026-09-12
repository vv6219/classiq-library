"""In-memory thread-safe circular ring buffer for high-frequency telemetry and SSE distribution."""

from __future__ import annotations
import threading
import time
from collections import deque
from typing import Dict, Any, List, Optional, Callable


class TelemetryBuffer:
    """Thread-safe circular ring buffer holding high-frequency telemetry frames and log events."""

    def __init__(self, capacity: int = 100000):
        self.capacity = capacity
        self._buffer: deque[Dict[str, Any]] = deque(maxlen=capacity)
        self._lock = threading.Lock()
        self._subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def record(self, event: Dict[str, Any]):
        """Record an event into the ring buffer and dispatch to active SSE listeners."""
        if "timestamp" not in event:
            event["timestamp"] = time.time()

        with self._lock:
            self._buffer.append(event)
            subs = list(self._subscribers)

        for sub in subs:
            try:
                sub(event)
            except Exception:
                pass

    def get_recent(self, limit: int = 100, level: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._lock:
            if level:
                filtered = [e for e in self._buffer if e.get("log_level") == level or e.get("level") == level]
                return filtered[-limit:]
            return list(self._buffer)[-limit:]

    def get_by_trace(self, trace_id: str) -> List[Dict[str, Any]]:
        with self._lock:
            return [e for e in self._buffer if e.get("trace_id") == trace_id]

    def get_by_vehicle(self, vehicle_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        with self._lock:
            filtered = [e for e in self._buffer if e.get("vehicle_id") == vehicle_id]
            return filtered[-limit:]

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        with self._lock:
            if callback not in self._subscribers:
                self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        with self._lock:
            if callback in self._subscribers:
                self._subscribers.remove(callback)

    def clear(self):
        with self._lock:
            self._buffer.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._buffer)


# Global singleton instance
GLOBAL_TELEMETRY_BUFFER = TelemetryBuffer(capacity=100000)
