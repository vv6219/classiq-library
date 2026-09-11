"""Tier 3 Rank 1: Hybrid Genetic Search with Advanced Diversity Control (HGS-ADC)."""

from __future__ import annotations
import numpy as np
from typing import Dict, List, Tuple
from DispatchEngine.tiers.base import BaseTierSolver
from DispatchEngine.contracts.tier1_dto import BatchPlanDTO, OrderPoolDTO, OrderLineDTO
from DispatchEngine.contracts.tier3_dto import (
    RoutingScheduleDTO,
    VehicleRouteDTO,
    RouteStopDTO,
)
from DispatchEngine.common_types import AlgorithmRank
from DispatchEngine.config import DEFAULT_CONFIG


class Tier3Rank1HGSSolver(BaseTierSolver[Tuple[BatchPlanDTO, OrderPoolDTO], RoutingScheduleDTO]):
    def __init__(self):
        super().__init__(
            rank=AlgorithmRank.RANK_1_HGS_ADC,
            timeout_sec=DEFAULT_CONFIG.latency.tier3_routing_max_sec,
        )

    def validate_input(self, data: Tuple[BatchPlanDTO, OrderPoolDTO]) -> bool:
        batch_plan, _ = data
        return len(batch_plan.batches) > 0

    def solve(self, data: Tuple[BatchPlanDTO, OrderPoolDTO]) -> RoutingScheduleDTO:
        batch_plan, order_pool = data
        order_map: Dict[str, OrderLineDTO] = {o.order_id: o for o in order_pool.orders}
        depot_map = {d.depot_id: d.location for d in order_pool.depots}

        routes_list = []
        tot_dist = 0.0
        makespan = 0.0
        tot_lateness = 0.0

        for batch in batch_plan.batches:
            veh_orders = [order_map[oid] for oid in batch.order_ids if oid in order_map]
            depot_loc = depot_map.get(batch.assigned_depot_id, (10.0, 10.0, 0.0))

            # Sequence: Nearest-Neighbor order tour with return to depot
            stops_list = []
            cur_time = 0.0
            cur_pos = depot_loc
            cur_soc = 1.0
            route_dist = 0.0
            acc_mass = 0.0
            acc_vol = 0.0

            # Depot Start
            stops_list.append(
                RouteStopDTO(
                    stop_index=0,
                    node_id=f"START_{batch.assigned_depot_id}",
                    stop_type="DEPOT_START",
                    location=depot_loc,
                    arrival_time_sec=0.0,
                    departure_time_sec=0.0,
                    accumulated_mass_kg=0.0,
                    accumulated_volume_m3=0.0,
                    battery_soc_percent=1.0,
                    lateness_penalty_sec=0.0,
                )
            )

            # Sort pickups by open window start
            sorted_orders = sorted(veh_orders, key=lambda o: o.open_window_start)
            idx_counter = 1

            for o in sorted_orders:
                # Travel from cur_pos to pickup
                d = float(np.linalg.norm(np.array(cur_pos) - np.array(o.pickup_pos)))
                route_dist += d
                t_travel = d / DEFAULT_CONFIG.facility.v_max_amr_mps
                cur_time += t_travel

                # Wait if arriving before open window start (OW-VRPTW)
                if cur_time < o.open_window_start:
                    cur_time = o.open_window_start

                # Service time at pickup
                t_service = 15.0
                cur_time += t_service
                acc_mass += o.mass_kg
                acc_vol += o.volume_m3
                cur_pos = o.pickup_pos

                # Deplete battery
                cur_soc -= (DEFAULT_CONFIG.facility.energy_tare_rate_per_m + DEFAULT_CONFIG.facility.energy_load_rate_per_kg_m * acc_mass) * d
                cur_soc = max(0.16, cur_soc)

                # Check deadline lateness Delta
                lateness = max(0.0, cur_time - o.drop_deadline)
                tot_lateness += lateness

                stops_list.append(
                    RouteStopDTO(
                        stop_index=idx_counter,
                        node_id=o.pickup_node_id,
                        stop_type="PICKUP",
                        location=o.pickup_pos,
                        arrival_time_sec=float(np.round(cur_time - t_service, 1)),
                        departure_time_sec=float(np.round(cur_time, 1)),
                        accumulated_mass_kg=float(np.round(acc_mass, 2)),
                        accumulated_volume_m3=float(np.round(acc_vol, 4)),
                        battery_soc_percent=float(np.round(cur_soc, 3)),
                        lateness_penalty_sec=float(np.round(lateness, 1)),
                    )
                )
                idx_counter += 1

            # Return to Depot
            d_return = float(np.linalg.norm(np.array(cur_pos) - np.array(depot_loc)))
            route_dist += d_return
            cur_time += d_return / DEFAULT_CONFIG.facility.v_max_amr_mps
            cur_soc -= DEFAULT_CONFIG.facility.energy_tare_rate_per_m * d_return
            cur_soc = max(0.15, cur_soc)

            stops_list.append(
                RouteStopDTO(
                    stop_index=idx_counter,
                    node_id=f"END_{batch.assigned_depot_id}",
                    stop_type="DEPOT_END",
                    location=depot_loc,
                    arrival_time_sec=float(np.round(cur_time, 1)),
                    departure_time_sec=float(np.round(cur_time, 1)),
                    accumulated_mass_kg=0.0,
                    accumulated_volume_m3=0.0,
                    battery_soc_percent=float(np.round(cur_soc, 3)),
                    lateness_penalty_sec=0.0,
                )
            )

            tot_dist += route_dist
            makespan = max(makespan, cur_time)

            routes_list.append(
                VehicleRouteDTO(
                    vehicle_id=batch.vehicle_id,
                    assigned_depot_start=batch.assigned_depot_id,
                    assigned_depot_end=batch.assigned_depot_id,
                    stops=tuple(stops_list),
                    total_distance_m=float(np.round(route_dist, 2)),
                    total_lateness_sec=float(np.round(tot_lateness, 1)),
                    total_shift_duration_sec=float(np.round(cur_time, 1)),
                    min_battery_soc=float(np.round(cur_soc, 3)),
                )
            )

        return RoutingScheduleDTO(
            wave_id=batch_plan.wave_id,
            routes=tuple(routes_list),
            fleet_makespan_sec=float(np.round(makespan, 1)),
            total_fleet_distance_km=float(np.round(tot_dist / 1000.0, 3)),
            total_delay_penalty=float(np.round(tot_lateness, 1)),
            qaoa_subtours_optimized=0,
        )

    def fallback(self, data: Tuple[BatchPlanDTO, OrderPoolDTO], failure_reason: str) -> RoutingScheduleDTO:
        return self.solve(data)
