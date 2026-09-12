export interface ArchetypeMeta {
  archetype_key: string;
  title: string;
  description: string;
  stress_target: string;
}

export interface ScenarioMeta {
  scenario_id: string;
  name: string;
  random_seed: number;
  order_count: number;
  fleet_size: number;
  depot_count: number;
  chute_count: number;
  is_mock_data: boolean;
}

export interface OrderDTO {
  order_id: string;
  sku_id: string;
  depot_id: string;
  aisle_id: string;
  pickup_pos: [number, number, number];
  drop_chute_id: string;
  mass_kg: number;
  volume_m3: number;
  open_window_start: number;
  drop_deadline: number;
  is_atomic: boolean;
  hazard_class: string;
}

export interface VehicleDTO {
  vehicle_id: string;
  assigned_depot_start: string;
  assigned_depot_end: string;
  max_payload_mass_kg: number;
  max_payload_volume_m3: number;
  battery_soc: number;
  max_velocity_mps: number;
}

export interface DepotDTO {
  depot_id: string;
  location: [number, number, number];
  capacity: number;
}

export interface ChuteDTO {
  chute_id: string;
  location: [number, number, number];
  buffer_capacity_m3: number;
}

export interface DatasetDTO {
  scenario_id: string;
  name: string;
  order_count: number;
  fleet_size: number;
  depot_count: number;
  chute_count: number;
  orders: OrderDTO[];
  vehicles: VehicleDTO[];
  depots: DepotDTO[];
  chutes: ChuteDTO[];
}

export interface RouteStop {
  stop_id: string;
  stop_sequence: number;
  location_type: string;
  location_id: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  arrival_time_sec: number;
  departure_time_sec: number;
  action: string;
  order_ids: string[];
}

export interface VehicleRoute {
  route_id: string;
  vehicle_id: string;
  origin_depot_id: string;
  destination_depot_id: string;
  tour_length_m: number;
  route_makespan_sec: number;
  total_carried_mass_kg: number;
  total_carried_volume_m3: number;
  volume_utilization_pct: number;
  battery_consumed_pct: number;
  stops: RouteStop[];
}

export interface ScheduleDetails {
  run_id: string;
  routes: VehicleRoute[];
}

export interface WaveExecutionResponse {
  run_id: string;
  scenario_id: string;
  wave_id: string;
  operational_mode: string;
  algorithm_ranks_used: Record<string, string>;
  total_fleet_makespan_sec: number;
  total_distance_km: number;
  chute_balance_variance: number;
  total_solve_latency_sec: number;
  falsification_ratio_phi: number;
  is_falsified: boolean;
  routes: any[];
}

export interface RunSummaryDTO {
  run_id: string;
  scenario_id: string;
  wave_id: string;
  operational_mode: string;
  makespan_sec: number;
  distance_km: number;
  chute_variance: number;
  solve_latency_sec: number;
  falsification_ratio_phi: number;
  is_falsified: boolean;
  timestamp: string;
}

export interface RunComparisonDTO {
  run_a: {
    run_id: string;
    mode: string;
    makespan_sec: number;
    distance_km: number;
    chute_variance: number;
    phi: number;
  };
  run_b: {
    run_id: string;
    mode: string;
    makespan_sec: number;
    distance_km: number;
    chute_variance: number;
    phi: number;
  };
  deltas: {
    delta_makespan_sec: number;
    delta_makespan_pct: number;
    delta_distance_km: number;
    delta_distance_pct: number;
    delta_chute_variance: number;
    delta_phi: number;
  };
}

export interface RunExplanationDTO {
  run_id: string;
  scenario_id: string;
  operational_mode: string;
  executive_summary: string;
  mock_data: string;
  tiers: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
  };
  algorithms: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
  };
  classical_vs_quantum: string;
  verification_invariant: {
    code: string;
    phi: number;
    is_certified: boolean;
  };
}

export interface QuantumTierDetailDTO {
  tier: number;
  tier_name: string;
  algorithm: string;
  algorithm_title: string;
  classiq_function: string;
  classiq_signature: string;
  qubits_used: number;
  shots: number;
  circuit_depth: number;
  fidelity: number;
  description: string;
  code_snippet: string;
}

export interface QuantumUtilizationDTO {
  status: string;
  operational_mode: string;
  total_qubits_allocated: number;
  total_shots_executed: number;
  circuit_depth: number;
  two_qubit_gate_count: number;
  single_qubit_gate_count: number;
  quantum_fidelity: number;
  backend: {
    engine: string;
    target: string;
    transpilation_level: number;
    coupling_map: string;
  };
  qubit_register_allocation: Record<string, { count: number; label: string; purpose: string }>;
  tiers: QuantumTierDetailDTO[];
  sample_histogram: Array<{ bitstring: string; probability: number; shots: number }>;
}

export interface TelemetryEvent {
  timestamp: string;
  log_level: string;
  logger_name: string;
  trace_id: string;
  span_id: string;
  wave_id?: string;
  vehicle_id?: string;
  message: string;
  warehouse_data?: Record<string, any>;
}

export interface ParameterLimitSpec {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  category: string;
}

export const API_BASE = '/api/v1';

export const CONFIG_LIMITS: Record<string, ParameterLimitSpec> = {
  // Facility
  facility_length_m: { min: 50.0, max: 500.0, step: 10.0, default: 150.0, unit: 'm', category: 'Facility' },
  facility_width_m: { min: 30.0, max: 300.0, step: 5.0, default: 100.0, unit: 'm', category: 'Facility' },
  facility_height_m: { min: 6.0, max: 24.0, step: 1.0, default: 12.0, unit: 'm', category: 'Facility' },
  aisle_count: { min: 2, max: 30, step: 1, default: 10, unit: 'count', category: 'Facility' },
  aisle_width_m: { min: 1.5, max: 4.5, step: 0.1, default: 3.0, unit: 'm', category: 'Facility' },
  chute_buffer_capacity_m3: { min: 1.0, max: 20.0, step: 0.5, default: 5.0, unit: 'm³', category: 'Facility' },
  // Kinematics & ISO 3691-4
  fleet_size: { min: 1, max: 16, step: 1, default: 4, unit: 'AMRs', category: 'Kinematics' },
  v_max_amr_mps: { min: 0.5, max: 4.0, step: 0.1, default: 2.0, unit: 'm/s', category: 'Kinematics' },
  v_safe_hri_mps: { min: 0.2, max: 1.2, step: 0.05, default: 0.4, unit: 'm/s', category: 'Kinematics' },
  a_max_amr_mps2: { min: 0.2, max: 3.0, step: 0.1, default: 1.0, unit: 'm/s²', category: 'Kinematics' },
  emergency_decel_mps2: { min: 1.5, max: 5.0, step: 0.25, default: 2.5, unit: 'm/s²', category: 'Kinematics' },
  min_headway_sec: { min: 0.5, max: 4.0, step: 0.1, default: 1.5, unit: 's', category: 'Kinematics' },
  battery_capacity_kwh: { min: 0.5, max: 5.0, step: 0.25, default: 1.8, unit: 'kWh', category: 'Kinematics' },
  battery_initial_soc: { min: 20.0, max: 100.0, step: 5.0, default: 95.0, unit: '%', category: 'Kinematics' },
  battery_min_soc: { min: 5.0, max: 30.0, step: 1.0, default: 15.0, unit: '%', category: 'Kinematics' },
  max_payload_mass_kg: { min: 20.0, max: 500.0, step: 10.0, default: 200.0, unit: 'kg', category: 'Kinematics' },
  max_payload_volume_m3: { min: 0.1, max: 2.5, step: 0.05, default: 0.8, unit: 'm³', category: 'Kinematics' },
  // Orders
  num_orders: { min: 4, max: 150, step: 1, default: 20, unit: 'orders', category: 'Orders' },
  hazard_fraction: { min: 0.0, max: 60.0, step: 5.0, default: 15.0, unit: '%', category: 'Orders' },
  tight_deadline_fraction: { min: 0.0, max: 70.0, step: 5.0, default: 20.0, unit: '%', category: 'Orders' },
  time_window_span_sec: { min: 60.0, max: 1200.0, step: 30.0, default: 360.0, unit: 's', category: 'Orders' },
  // Tiers
  fcm_fuzziness_m: { min: 1.05, max: 3.50, step: 0.05, default: 1.85, unit: 'value', category: 'Tier1' },
  fcm_max_iter: { min: 5, max: 300, step: 5, default: 50, unit: 'iter', category: 'Tier1' },
  bpp_support_ratio_min: { min: 0.60, max: 0.98, step: 0.02, default: 0.85, unit: 'ratio', category: 'Tier2' },
  friction_coeff_mu: { min: 0.20, max: 0.90, step: 0.05, default: 0.45, unit: 'value', category: 'Tier2' },
  bpp_time_limit_sec: { min: 0.5, max: 15.0, step: 0.5, default: 3.0, unit: 's', category: 'Tier2' },
  vrp_penalty_delay_beta: { min: 0.2, max: 15.0, step: 0.2, default: 2.0, unit: 'factor', category: 'Tier3' },
  vrp_penalty_subtour_p: { min: 10.0, max: 500.0, step: 10.0, default: 100.0, unit: 'factor', category: 'Tier3' },
  kinematics_step_dt: { min: 0.02, max: 0.50, step: 0.02, default: 0.10, unit: 's', category: 'Tier4' },
  // Quantum
  qaoa_p_layers: { min: 1, max: 5, step: 1, default: 2, unit: 'layers', category: 'Quantum' },
  qaoa_shots: { min: 256, max: 16384, step: 256, default: 1024, unit: 'shots', category: 'Quantum' },
  max_circuit_width: { min: 8, max: 64, step: 2, default: 32, unit: 'qubits', category: 'Quantum' },
  // Lagrangian
  lagrangian_alpha: { min: 0.1, max: 10.0, step: 0.1, default: 1.0, unit: 'weight', category: 'Lagrangian' },
  lagrangian_beta: { min: 0.5, max: 20.0, step: 0.5, default: 2.0, unit: 'weight', category: 'Lagrangian' },
  lagrangian_gamma: { min: 1.0, max: 30.0, step: 1.0, default: 5.0, unit: 'weight', category: 'Lagrangian' },
  lagrangian_lambda: { min: 0.5, max: 15.0, step: 0.5, default: 1.5, unit: 'weight', category: 'Lagrangian' },
};

export async function fetchArchetypes(): Promise<ArchetypeMeta[]> {
  const res = await fetch(`${API_BASE}/scenarios/archetypes`);
  const data = await res.json();
  return data.archetypes || [];
}

export async function fetchPresets(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/scenarios/presets`);
  return res.json();
}

export async function fetchConfigLimits(): Promise<Record<string, ParameterLimitSpec>> {
  const res = await fetch(`${API_BASE}/config/limits`);
  return res.json();
}

export async function fetchDataset(scenarioId: string): Promise<DatasetDTO> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/dataset`);
  return res.json();
}

export async function createOrder(scenarioId: string, orderData: Partial<OrderDTO>): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return res.json();
}

export async function updateOrder(scenarioId: string, orderId: string, orderData: Partial<OrderDTO>): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return res.json();
}

export async function deleteOrder(scenarioId: string, orderId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/orders/${orderId}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function cloneScenario(scenarioId: string, newName?: string): Promise<{ success: boolean; cloned_scenario_id: string }> {
  const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_name: newName }),
  });
  return res.json();
}

export async function fetchRuns(limit = 30): Promise<RunSummaryDTO[]> {
  const res = await fetch(`${API_BASE}/dispatch/runs?limit=${limit}`);
  const data = await res.json();
  return data.runs || [];
}

export async function compareRuns(runA: string, runB: string): Promise<RunComparisonDTO> {
  const res = await fetch(`${API_BASE}/dispatch/runs/compare?run_a=${runA}&run_b=${runB}`);
  return res.json();
}

export async function generateScenario(config: {
  scenario_name: string;
  num_orders: number;
  num_vehicles: number;
  archetype: string;
  seed: number;
  num_depots?: number;
  num_chutes?: number;
  hazard_ratio?: number;
}): Promise<ScenarioMeta> {
  const res = await fetch(`${API_BASE}/scenarios/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function dispatchWave(params: {
  num_orders: number;
  num_vehicles: number;
  seed: number;
  operational_mode: string;
  scenario_id?: string;
  tier_algorithms?: Record<string, string>;
  quantum_config?: Record<string, any>;
  lagrangian_weights?: Record<string, number>;
  kinematics_config?: Record<string, number>;
}): Promise<WaveExecutionResponse> {
  const res = await fetch(`${API_BASE}/dispatch/waves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function fetchSchedule(runId: string): Promise<ScheduleDetails> {
  const res = await fetch(`${API_BASE}/dispatch/runs/${runId}/schedule`);
  return res.json();
}

export async function fetchLIFODag(runId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/dispatch/runs/${runId}/lifo-dag`);
  return res.json();
}

export async function fetchChuteDynamics(runId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/dispatch/runs/${runId}/chutes/dynamics`);
  return res.json();
}

export async function fetchGatesAudit(runId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/dispatch/runs/${runId}/gates/audit`);
  return res.json();
}

export async function fetchTelemetryEvents(limit = 50): Promise<TelemetryEvent[]> {
  const res = await fetch(`${API_BASE}/telemetry/events?limit=${limit}`);
  const data = await res.json();
  return data.events || [];
}

export function getReportPdfUrl(runId: string, profile = 'EXECUTIVE'): string {
  return `${API_BASE}/presentation/runs/${runId}/report.pdf?profile=${profile}`;
}

export function getGraphImageUrl(runId: string, graphType: string): string {
  return `${API_BASE}/presentation/runs/${runId}/graphs/${graphType}`;
}

export async function fetchRunExplanation(runId: string): Promise<RunExplanationDTO> {
  const res = await fetch(`${API_BASE}/dispatch/runs/${runId}/explanation`);
  return res.json();
}

export async function fetchQuantumUtilization(runId?: string): Promise<QuantumUtilizationDTO> {
  const url = runId ? `${API_BASE}/quantum/utilization?run_id=${runId}` : `${API_BASE}/quantum/utilization`;
  const res = await fetch(url);
  return res.json();
}
