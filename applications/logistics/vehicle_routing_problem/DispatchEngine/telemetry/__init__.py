"""Telemetry package initialization."""

from DispatchEngine.telemetry.logger import get_logger
from DispatchEngine.telemetry.tracer import trace_span
from DispatchEngine.telemetry.audit_trail import FalsificationAuditTrail

__all__ = ["get_logger", "trace_span", "FalsificationAuditTrail"]
