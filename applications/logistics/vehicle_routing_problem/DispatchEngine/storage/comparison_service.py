"""Database-backed comparative analytics and regression detection service."""

from __future__ import annotations
import sqlite3
from typing import List, Dict, Optional, Any
from DispatchEngine.contracts.presentation_dto import AlgorithmBenchmarkComparisonDTO

try:
    from sqlalchemy.orm import Session
    from DispatchEngine.storage.models import ExecutionRunRecord
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False


class RunComparisonService:
    def __init__(self, session: Any):
        self.session = session

    def compare_scenario_runs(self, scenario_id: str) -> Optional[AlgorithmBenchmarkComparisonDTO]:
        if HAS_SQLALCHEMY and hasattr(self.session, "query"):
            runs = (
                self.session.query(ExecutionRunRecord)
                .filter_by(scenario_id=scenario_id)
                .order_by(ExecutionRunRecord.timestamp.asc())
                .all()
            )
            if not runs:
                return None
            run_data = [
                (r.operational_mode, r.total_makespan_sec, r.total_distance_km, r.chute_variance, r.total_solve_latency_sec)
                for r in runs
            ]
        elif isinstance(self.session, sqlite3.Connection):
            cursor = self.session.cursor()
            cursor.execute(
                "SELECT operational_mode, total_makespan_sec, total_distance_km, chute_variance, total_solve_latency_sec "
                "FROM execution_runs WHERE scenario_id = ? ORDER BY timestamp ASC",
                (scenario_id,)
            )
            rows = cursor.fetchall()
            if not rows:
                return None
            run_data = [
                (row["operational_mode"], row["total_makespan_sec"], row["total_distance_km"], row["chute_variance"], row["total_solve_latency_sec"])
                for row in rows
            ]
        else:
            return None

        algos = []
        makespans = {}
        distances = {}
        variances = {}
        latencies = {}

        for mode, makespan, dist, variance, latency in run_data:
            algos.append(mode)
            makespans[mode] = makespan
            distances[mode] = dist
            variances[mode] = variance
            latencies[mode] = latency

        # Compute percentage improvements if multiple modes exist
        first_makespan = list(makespans.values())[0]
        min_makespan = min(makespans.values())
        imp_makespan = float(((first_makespan - min_makespan) / max(1e-6, first_makespan)) * 100.0)

        first_dist = list(distances.values())[0]
        min_dist = min(distances.values())
        imp_dist = float(((first_dist - min_dist) / max(1e-6, first_dist)) * 100.0)

        return AlgorithmBenchmarkComparisonDTO(
            scenario_id=scenario_id,
            algorithms_evaluated=tuple(algos),
            makespan_by_algo=makespans,
            distance_by_algo=distances,
            chute_variance_by_algo=variances,
            latency_by_algo=latencies,
            improvement_makespan_percent=imp_makespan,
            improvement_distance_percent=imp_dist,
        )

    def detect_regression(self, baseline_run_id: str, candidate_run_id: str, threshold_percent: float = 5.0) -> bool:
        if HAS_SQLALCHEMY and hasattr(self.session, "query"):
            base = self.session.query(ExecutionRunRecord).filter_by(run_id=baseline_run_id).first()
            cand = self.session.query(ExecutionRunRecord).filter_by(run_id=candidate_run_id).first()
            if not base or not cand:
                return False
            base_m, base_l = base.total_makespan_sec, base.total_solve_latency_sec
            cand_m, cand_l = cand.total_makespan_sec, cand.total_solve_latency_sec
        elif isinstance(self.session, sqlite3.Connection):
            cursor = self.session.cursor()
            cursor.execute("SELECT total_makespan_sec, total_solve_latency_sec FROM execution_runs WHERE run_id = ?", (baseline_run_id,))
            base_row = cursor.fetchone()
            cursor.execute("SELECT total_makespan_sec, total_solve_latency_sec FROM execution_runs WHERE run_id = ?", (candidate_run_id,))
            cand_row = cursor.fetchone()
            if not base_row or not cand_row:
                return False
            base_m, base_l = base_row["total_makespan_sec"], base_row["total_solve_latency_sec"]
            cand_m, cand_l = cand_row["total_makespan_sec"], cand_row["total_solve_latency_sec"]
        else:
            return False

        makespan_degradation = (cand_m - base_m) / max(0.001, base_m)
        latency_degradation = (cand_l - base_l) / max(0.001, base_l)

        return (makespan_degradation * 100.0 > threshold_percent) or (latency_degradation * 100.0 > threshold_percent)

