"""Falsification protocol audit trail and verification code recorder."""

from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List
from DispatchEngine.config import DEFAULT_CONFIG


class FalsificationAuditTrail:
    _log_file = Path(__file__).resolve().parent / "falsification_audit.jsonl"

    @classmethod
    def record_falsification_event(
        cls,
        wave_id: str,
        throttled_makespan: float,
        static_makespan: float,
        phi_ratio: float,
        chute_bounded: bool,
    ) -> Dict[str, Any]:
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "verification_code": DEFAULT_CONFIG.falsification_verification_code,
            "wave_id": wave_id,
            "throttled_makespan_sec": throttled_makespan,
            "static_makespan_sec": static_makespan,
            "falsification_ratio_phi": phi_ratio,
            "chute_bounded": chute_bounded,
            "is_falsified": bool(phi_ratio >= 1.0 and chute_bounded),
        }
        
        with open(cls._log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")
            
        return event
