"""Deterministic Synthetic Warehouse Mock Data Generator with Multi-Archetype Support."""

from __future__ import annotations
from enum import Enum
import uuid
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from DispatchEngine.contracts.tier1_dto import OrderLineDTO, DepotStateDTO, OrderPoolDTO
from DispatchEngine.contracts.storage_dto import MockConfigDTO
from DispatchEngine.config import DEFAULT_CONFIG


class ScenarioArchetype(str, Enum):
    UNIFORM_RANDOM = "UNIFORM_RANDOM"
    PARETO_HOT_ZONE = "PARETO_HOT_ZONE"
    DUAL_DEPOT_CROSS_DOCK = "DUAL_DEPOT_CROSS_DOCK"
    PEAK_SURGE_HEAVY_TAIL = "PEAK_SURGE_HEAVY_TAIL"
    HAZMAT_SEGREGATION = "HAZMAT_SEGREGATION"
    HRI_STOCHASTIC_BOTTLENECK = "HRI_STOCHASTIC_BOTTLENECK"
    ENTERPRISE_SCALE_STRESS = "ENTERPRISE_SCALE_STRESS"


CANONICAL_PRESETS: Dict[str, Dict[str, Any]] = {
    "small-smoke-40": {
        "scenario_name": "Preset-Small-Smoke-40",
        "archetype": ScenarioArchetype.UNIFORM_RANDOM.value,
        "num_orders": 40,
        "num_technicians": 4,
        "num_depots": 2,
        "num_chutes": 2,
        "hazard_ratio": 0.05,
        "seed": 42,
        "scale_label": "SMALL",
    },
    "pareto-cluster-200": {
        "scenario_name": "Preset-Pareto-Cluster-200",
        "archetype": ScenarioArchetype.PARETO_HOT_ZONE.value,
        "num_orders": 200,
        "num_technicians": 8,
        "num_depots": 2,
        "num_chutes": 4,
        "hazard_ratio": 0.10,
        "seed": 101,
        "scale_label": "MEDIUM",
    },
    "hazmat-heavy-500": {
        "scenario_name": "Preset-Hazmat-Heavy-500",
        "archetype": ScenarioArchetype.HAZMAT_SEGREGATION.value,
        "num_orders": 500,
        "num_technicians": 12,
        "num_depots": 3,
        "num_chutes": 4,
        "hazard_ratio": 0.45,
        "seed": 202,
        "scale_label": "LARGE",
    },
    "surge-deadline-1000": {
        "scenario_name": "Preset-Surge-Deadline-1000",
        "archetype": ScenarioArchetype.PEAK_SURGE_HEAVY_TAIL.value,
        "num_orders": 1000,
        "num_technicians": 16,
        "num_depots": 4,
        "num_chutes": 6,
        "hazard_ratio": 0.15,
        "seed": 303,
        "scale_label": "VERY_LARGE",
    },
    "enterprise-35k": {
        "scenario_name": "Preset-Enterprise-Scale-35k",
        "archetype": ScenarioArchetype.ENTERPRISE_SCALE_STRESS.value,
        "num_orders": 35000,
        "num_technicians": 64,
        "num_depots": 8,
        "num_chutes": 10,
        "hazard_ratio": 0.12,
        "seed": 999,
        "scale_label": "ENTERPRISE",
    },
}


class WarehouseMockGenerator:
    """Generates synthetic customer orders, 3D rack coordinates, and depot states."""

    @classmethod
    def get_canonical_presets(cls) -> Dict[str, Dict[str, Any]]:
        return dict(CANONICAL_PRESETS)

    @classmethod
    def get_preset_config(cls, preset_name: str) -> MockConfigDTO:
        if preset_name not in CANONICAL_PRESETS:
            raise KeyError(f"Unknown preset '{preset_name}'. Valid presets: {list(CANONICAL_PRESETS.keys())}")
        data = CANONICAL_PRESETS[preset_name]
        return MockConfigDTO(
            scenario_name=data["scenario_name"],
            num_orders=data["num_orders"],
            num_technicians=data["num_technicians"],
            num_depots=data["num_depots"],
            num_chutes=data["num_chutes"],
            seed=data["seed"],
            scale_label=data["scale_label"],
            archetype=data["archetype"],
            hazard_ratio=data["hazard_ratio"],
        )

    @staticmethod
    def generate_scenario(config: MockConfigDTO) -> OrderPoolDTO:
        rng = np.random.RandomState(config.seed)
        wave_id = f"WAVE-{uuid.uuid4().hex[:8].upper()}"

        archetype = config.archetype or ScenarioArchetype.UNIFORM_RANDOM.value

        # 1. Depots
        depots_list = []
        depot_coords = [
            (10.0, 10.0, 0.0),
            (140.0, 10.0, 0.0),
            (10.0, 90.0, 0.0),
            (140.0, 90.0, 0.0),
            (75.0, 50.0, 0.0),
            (75.0, 10.0, 0.0),
            (10.0, 50.0, 0.0),
            (140.0, 50.0, 0.0),
        ]
        num_depots = max(1, min(config.num_depots, len(depot_coords)))
        for d_idx in range(num_depots):
            depots_list.append(
                DepotStateDTO(
                    depot_id=f"DEPOT_{d_idx + 1}",
                    location=depot_coords[d_idx],
                    max_throughput_out=1000,
                    max_throughput_in=1000,
                    current_inventory=5000,
                )
            )

        # 2. Orders
        orders_list = []
        fac = DEFAULT_CONFIG.facility
        chute_count = max(1, config.num_chutes)
        chute_ids = [f"CHUTE_{c + 1}" for c in range(chute_count)]
        hazard_ratio = getattr(config, "hazard_ratio", 0.1)

        hazard_pool = ["HAZ_A", "HAZ_B", "FLAMMABLE", "CORROSIVE"]

        for i in range(config.num_orders):
            order_id = f"ORD_{i + 1:05d}"
            sku_id = f"SKU_{rng.randint(1000, 9999)}"

            # Archetype-dependent Depot selection
            if archetype == ScenarioArchetype.DUAL_DEPOT_CROSS_DOCK.value:
                assigned_depot = depots_list[0 if (i % 2 == 0) else min(1, num_depots - 1)].depot_id
            else:
                assigned_depot = depots_list[rng.randint(0, num_depots)].depot_id

            # Spatial coordinates along aisles
            if archetype == ScenarioArchetype.PARETO_HOT_ZONE.value:
                # 80% concentrated in aisles 1 to 5 (fast movers)
                if rng.rand() < 0.8:
                    aisle_idx = rng.randint(1, 6)
                else:
                    aisle_idx = rng.randint(6, 26)
            elif archetype == ScenarioArchetype.HRI_STOCHASTIC_BOTTLENECK.value:
                # Heavy clustering in central aisles 10 to 15
                if rng.rand() < 0.6:
                    aisle_idx = rng.randint(10, 16)
                else:
                    aisle_idx = rng.randint(1, 26)
            else:
                aisle_idx = rng.randint(1, 26)

            aisle_id = f"AISLE_{aisle_idx:02d}"
            x = float(aisle_idx * 5.5 + rng.uniform(-0.5, 0.5))
            y = float(rng.uniform(15.0, fac.facility_width_m - 15.0))
            z = float(rng.uniform(0.5, fac.facility_height_m - 1.0))

            mass = float(np.round(rng.exponential(scale=4.5) + 0.5, 2))
            vol = float(np.round(rng.uniform(0.002, 0.045), 4))
            dim = (
                float(np.round(rng.uniform(0.1, 0.5), 2)),
                float(np.round(rng.uniform(0.1, 0.4), 2)),
                float(np.round(rng.uniform(0.05, 0.3), 2)),
            )

            # Archetype-dependent time windows
            open_start = float(np.round(rng.uniform(0.0, 180.0), 1))
            if archetype == ScenarioArchetype.PEAK_SURGE_HEAVY_TAIL.value:
                # Ultra-tight deadlines
                deadline = float(np.round(open_start + rng.uniform(80.0, 240.0), 1))
            else:
                deadline = float(np.round(open_start + rng.uniform(300.0, 900.0), 1))

            # Chute selection
            if archetype == ScenarioArchetype.PARETO_HOT_ZONE.value and rng.rand() < 0.7:
                chute_id = chute_ids[0]
            else:
                chute_id = chute_ids[rng.randint(0, len(chute_ids))]

            # Hazard determination
            if rng.rand() < hazard_ratio:
                hazard = hazard_pool[rng.randint(0, len(hazard_pool))]
            else:
                hazard = "NONE"

            is_atomic = bool(rng.rand() > 0.15)

            orders_list.append(
                OrderLineDTO(
                    order_id=order_id,
                    sku_id=sku_id,
                    depot_id=assigned_depot,
                    aisle_id=aisle_id,
                    pickup_node_id=f"NODE_{order_id}",
                    drop_chute_id=chute_id,
                    pickup_pos=(x, y, z),
                    mass_kg=mass,
                    dimensions_m=dim,
                    volume_m3=vol,
                    slot_requirement=1 if vol < 0.02 else 2,
                    open_window_start=open_start,
                    drop_deadline=deadline,
                    is_atomic=is_atomic,
                    hazard_class=hazard,
                    sla_priority=float(np.round(rng.uniform(0.2, 1.0), 2)),
                )
            )

        return OrderPoolDTO(
            wave_id=wave_id,
            orders=tuple(orders_list),
            depots=tuple(depots_list),
        )

    @classmethod
    def generate_sample_orders(cls, archetype: str = "UNIFORM_RANDOM", count: int = 5, seed: int = 42) -> List[Dict[str, Any]]:
        cfg = MockConfigDTO(
            scenario_name="Sample-Preview",
            num_orders=count,
            num_technicians=2,
            num_depots=2,
            num_chutes=2,
            seed=seed,
            archetype=archetype,
            hazard_ratio=0.3 if archetype == ScenarioArchetype.HAZMAT_SEGREGATION.value else 0.1,
        )
        pool = cls.generate_scenario(cfg)
        samples = []
        for o in pool.orders:
            samples.append({
                "order_id": o.order_id,
                "sku_id": o.sku_id,
                "aisle_id": o.aisle_id,
                "pickup_pos": {"x": o.pickup_pos[0], "y": o.pickup_pos[1], "z": o.pickup_pos[2]},
                "mass_kg": o.mass_kg,
                "volume_m3": o.volume_m3,
                "dimensions_m": {"length": o.dimensions_m[0], "width": o.dimensions_m[1], "height": o.dimensions_m[2]},
                "open_window_start": o.open_window_start,
                "drop_deadline": o.drop_deadline,
                "hazard_class": o.hazard_class,
                "sla_priority": o.sla_priority,
            })
        return samples
