"""Presentation package initialization."""

try:
    from DispatchEngine.presentation.frame_builder import SimulationFrameBuilder
    from DispatchEngine.presentation.dashboard_aggregator import DashboardAggregator
    __all__ = ["SimulationFrameBuilder", "DashboardAggregator"]
except ImportError:
    __all__ = []

