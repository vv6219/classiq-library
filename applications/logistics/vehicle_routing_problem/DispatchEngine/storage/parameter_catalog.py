"""Parameter Catalog: Standard Definitions, Metadata, SI Units, and Compliance Standards for WMS Dispatch Engine."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass(frozen=True)
class ParameterDefinition:
    param_key: str
    display_name: str
    param_scope: str  # 'SYSTEM', 'TOPOLOGY', 'FLEET', 'TIER_1', 'TIER_2', 'TIER_3', 'TIER_4', 'QUANTUM', 'SLA'
    param_type: str   # 'INTEGER', 'FLOAT', 'BOOLEAN', 'STRING', 'JSON'
    unit: str
    description: str
    latex_symbol: str = ""
    default_value: Any = None
    min_bound: Optional[float] = None
    max_bound: Optional[float] = None
    compliance_standard: str = ""


PARAMETER_CATALOG: Dict[str, ParameterDefinition] = {
    # -------------------------------------------------------------
    # FLEET PARAMETERS
    # -------------------------------------------------------------
    "fleet_size": ParameterDefinition(
        param_key="fleet_size",
        display_name="Fleet Size (Active AMRs)",
        param_scope="FLEET",
        param_type="INTEGER",
        unit="AMRs",
        description="Total active Autonomous Mobile Robots / AGVs deployed across warehouse multi-depot zones.",
        latex_symbol=r"|\mathcal{K}|",
        default_value=4,
        min_bound=1,
        max_bound=50,
        compliance_standard="DIN EN ISO 3691-4:2020 Clause 5.2",
    ),
    "max_payload_kg": ParameterDefinition(
        param_key="max_payload_kg",
        display_name="Maximum Vehicle Payload Mass",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="kg",
        description="Structural load carrying limit per robotic chassis preventing mechanical shear failure.",
        latex_symbol=r"Q_{\max}^{\text{mass}}",
        default_value=250.0,
        min_bound=10.0,
        max_bound=1500.0,
        compliance_standard="VDI 2700 Sheet 2 (Cargo Securing)",
    ),
    "max_volume_m3": ParameterDefinition(
        param_key="max_volume_m3",
        display_name="Vehicle Bay Cubage Volume",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="m³",
        description="Internal usable volumetric envelope of the AMR cargo bay (L x W x H).",
        latex_symbol=r"Q_{\max}^{\text{vol}}",
        default_value=1.20,
        min_bound=0.10,
        max_bound=5.00,
        compliance_standard="VDI 4434 (Automated Guided Industrial Trucks)",
    ),
    "max_velocity_m_s": ParameterDefinition(
        param_key="max_velocity_m_s",
        display_name="Maximum Robotic Cruise Velocity",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="m/s",
        description="Top governed cruising speed along main arterial corridors and picking aisles.",
        latex_symbol=r"v_{\max}",
        default_value=2.00,
        min_bound=0.20,
        max_bound=4.50,
        compliance_standard="DIN EN ISO 3691-4:2020 Clause 5.2.1.2 (Speed Limiting)",
    ),
    "max_acceleration_m_s2": ParameterDefinition(
        param_key="max_acceleration_m_s2",
        display_name="Maximum Acceleration / Deceleration",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="m/s²",
        description="Dynamic rate of speed change bounding cargo inertial tipping and floor shear stress.",
        latex_symbol=r"a_{\max}",
        default_value=1.20,
        min_bound=0.10,
        max_bound=3.00,
        compliance_standard="VDI 2700 (Acceleration Resistance)",
    ),
    "battery_capacity_kwh": ParameterDefinition(
        param_key="battery_capacity_kwh",
        display_name="Battery Pack Nominal Energy",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="kWh",
        description="Total electrical energy storage of the onboard LiFePO4 battery pack.",
        latex_symbol=r"E_{\text{batt}}",
        default_value=2.40,
        min_bound=0.50,
        max_bound=10.00,
        compliance_standard="IEC 62619 (Secondary Lithium Cells)",
    ),
    "kers_efficiency": ParameterDefinition(
        param_key="kers_efficiency",
        display_name="KERS Regenerative Braking Efficiency",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="%",
        description="Fraction of robotic deceleration kinetic energy recaptured into the battery via regenerative braking.",
        latex_symbol=r"\eta_{\text{KERS}}",
        default_value=0.65,
        min_bound=0.00,
        max_bound=0.90,
        compliance_standard="ISO 14064-1 (Greenhouse Gas Accounting)",
    ),
    "min_soc_reserve_pct": ParameterDefinition(
        param_key="min_soc_reserve_pct",
        display_name="Emergency State-of-Charge (SoC) Floor",
        param_scope="FLEET",
        param_type="FLOAT",
        unit="%",
        description="Strict lower safety bound below which an AMR is redirected to inductive charging pads.",
        latex_symbol=r"\text{SoC}_{\min}",
        default_value=15.0,
        min_bound=5.0,
        max_bound=40.0,
        compliance_standard="DIN EN ISO 3691-4 Clause 5.10 (Power Source)",
    ),

    # -------------------------------------------------------------
    # TOPOLOGY & WAREHOUSE GEOMETRY
    # -------------------------------------------------------------
    "num_orders": ParameterDefinition(
        param_key="num_orders",
        display_name="Dispatched Fulfillment Orders",
        param_scope="TOPOLOGY",
        param_type="INTEGER",
        unit="orders",
        description="Total discrete picking orders scheduled within the active optimization wave.",
        latex_symbol=r"|\mathcal{V}_P|",
        default_value=16,
        min_bound=1,
        max_bound=200,
        compliance_standard="WMS VDI 4400 / Warehouse Core",
    ),
    "depot_count": ParameterDefinition(
        param_key="depot_count",
        display_name="Active Multi-Depot Staging Docks",
        param_scope="TOPOLOGY",
        param_type="INTEGER",
        unit="docks",
        description="Number of discrete dispatch stations and maintenance charging depots in the warehouse coordinate grid.",
        latex_symbol=r"|\mathcal{V}_D|",
        default_value=2,
        min_bound=1,
        max_bound=10,
        compliance_standard="Warehouse Topology Standard",
    ),
    "chute_count": ParameterDefinition(
        param_key="chute_count",
        display_name="Discharge Chute Consolidation Gates",
        param_scope="TOPOLOGY",
        param_type="INTEGER",
        unit="chutes",
        description="Number of sorting and outbound packing chutes receiving grouped SKU orders.",
        latex_symbol=r"|\mathcal{V}_C|",
        default_value=4,
        min_bound=1,
        max_bound=24,
        compliance_standard="VDI 2689 (Material Flow Systems)",
    ),
    "facility_width_m": ParameterDefinition(
        param_key="facility_width_m",
        display_name="Facility Floor Width (X-Axis)",
        param_scope="TOPOLOGY",
        param_type="FLOAT",
        unit="m",
        description="Span of warehouse floor envelope along the primary cross-dock horizontal axis.",
        latex_symbol=r"W_{\text{floor}}",
        default_value=60.0,
        min_bound=10.0,
        max_bound=500.0,
        compliance_standard="ISO 19869 (Clean Floors and Logistics Bounds)",
    ),
    "facility_length_m": ParameterDefinition(
        param_key="facility_length_m",
        display_name="Facility Floor Length (Y-Axis)",
        param_scope="TOPOLOGY",
        param_type="FLOAT",
        unit="m",
        description="Span of warehouse floor envelope along the storage aisle vertical axis.",
        latex_symbol=r"L_{\text{floor}}",
        default_value=40.0,
        min_bound=10.0,
        max_bound=500.0,
        compliance_standard="ISO 19869",
    ),
    "aisle_width_m": ParameterDefinition(
        param_key="aisle_width_m",
        display_name="Aisle Corridor Operating Width",
        param_scope="TOPOLOGY",
        param_type="FLOAT",
        unit="m",
        description="Clear traversal width between storage racks governing bidirectional vehicle passability.",
        latex_symbol=r"W_{\text{aisle}}",
        default_value=2.40,
        min_bound=1.20,
        max_bound=5.00,
        compliance_standard="DIN EN ISO 3691-4:2020 Clause 5.2.1.3 (Zone Clearance)",
    ),
    "archetype": ParameterDefinition(
        param_key="archetype",
        display_name="Warehouse Demand Topology Archetype",
        param_scope="TOPOLOGY",
        param_type="STRING",
        unit="",
        description="Operational order generation archetype (e.g. PARETO_HOT_ZONE, UNIFORM_GRID, HIGH_DENSITY, PEAK_HOUR).",
        latex_symbol=r"\mathcal{A}_{\text{topo}}",
        default_value="PARETO_HOT_ZONE",
        compliance_standard="VDI 4400 (WMS Benchmark Archetypes)",
    ),

    # -------------------------------------------------------------
    # PHYSICS & CYBER-PHYSICAL SAFETY
    # -------------------------------------------------------------
    "gravity_m_s2": ParameterDefinition(
        param_key="gravity_m_s2",
        display_name="Gravitational Acceleration Constant",
        param_scope="PHYSICS",
        param_type="FLOAT",
        unit="m/s²",
        description="Standard acceleration of gravity applied to cargo vertical normal force and stability models.",
        latex_symbol=r"g",
        default_value=9.81,
        min_bound=9.70,
        max_bound=9.90,
        compliance_standard="SI Standard",
    ),
    "friction_coefficient_mu": ParameterDefinition(
        param_key="friction_coefficient_mu",
        display_name="Floor-to-Tire Friction Coefficient",
        param_scope="PHYSICS",
        param_type="FLOAT",
        unit="μ",
        description="Static and dynamic friction coefficient governing wheel traction and emergency stopping distance.",
        latex_symbol=r"\mu",
        default_value=0.70,
        min_bound=0.20,
        max_bound=1.00,
        compliance_standard="DIN 51130 (Floor Friction & Slip Resistance)",
    ),
    "max_pallet_tilt_deg": ParameterDefinition(
        param_key="max_pallet_tilt_deg",
        display_name="Maximum Allowable Pallet Tilt Angle",
        param_scope="PHYSICS",
        param_type="FLOAT",
        unit="deg",
        description="Inclinometer threshold above which cargo is declared kinematically unstable during acceleration.",
        latex_symbol=r"\theta_{\text{tilt}}^{\max}",
        default_value=5.0,
        min_bound=1.0,
        max_bound=15.0,
        compliance_standard="VDI 2700 Sheet 4 (Load Securing on Pallets)",
    ),
    "iso_3691_4_safety_buffer_m": ParameterDefinition(
        param_key="iso_3691_4_safety_buffer_m",
        display_name="ISO 3691-4 Safety Perimeter Buffer",
        param_scope="PHYSICS",
        param_type="FLOAT",
        unit="m",
        description="Minimum protective clearance maintained around AMR swept hull to prevent collisions with humans or fixtures.",
        latex_symbol=r"d_{\text{safe}}",
        default_value=0.50,
        min_bound=0.20,
        max_bound=2.00,
        compliance_standard="DIN EN ISO 3691-4:2020 Clause 5.2.1.1",
    ),

    # -------------------------------------------------------------
    # TIER 1: CLUSTERING & DECOMPOSITION PARAMETERS
    # -------------------------------------------------------------
    "fcm_fuzzifier_m": ParameterDefinition(
        param_key="fcm_fuzzifier_m",
        display_name="Fuzzy C-Means Fuzzifier Exponent",
        param_scope="TIER_1",
        param_type="FLOAT",
        unit="",
        description="Weighting exponent controlling the degree of cluster fuzziness and order split-pick membership overlap.",
        latex_symbol=r"m",
        default_value=2.0,
        min_bound=1.1,
        max_bound=5.0,
        compliance_standard="Bezdek Fuzzy Clustering Paradigm",
    ),
    "fcm_max_iter": ParameterDefinition(
        param_key="fcm_max_iter",
        display_name="FCM Clustering Maximum Iterations",
        param_scope="TIER_1",
        param_type="INTEGER",
        unit="iterations",
        description="Maximum iterations before terminating the Spatio-Temporal Fuzzy C-Means objective convergence loop.",
        latex_symbol=r"I_{\max}^{\text{FCM}}",
        default_value=100,
        min_bound=10,
        max_bound=1000,
        compliance_standard="Mathematical Convergence Criteria",
    ),
    "dr_saa_wasserstein_radius": ParameterDefinition(
        param_key="dr_saa_wasserstein_radius",
        display_name="Wasserstein Ambiguity Radius (DR-SAA)",
        param_scope="TIER_1",
        param_type="FLOAT",
        unit="",
        description="Radius bounding probability distribution discrepancy for distributionally robust sample average approximation.",
        latex_symbol=r"\epsilon_{\text{W}}",
        default_value=0.05,
        min_bound=0.001,
        max_bound=0.50,
        compliance_standard="Distributionally Robust Optimization",
    ),

    # -------------------------------------------------------------
    # TIER 2: 3D CONTAINERIZATION & PALLETIZING PARAMETERS
    # -------------------------------------------------------------
    "cpsat_timeout_sec": ParameterDefinition(
        param_key="cpsat_timeout_sec",
        display_name="CP-SAT 3D Packing Solver Timeout",
        param_scope="TIER_2",
        param_type="FLOAT",
        unit="s",
        description="Maximum allowable wall-clock search time for exact lazy-clause container placement formulation.",
        latex_symbol=r"T_{\max}^{\text{CPSAT}}",
        default_value=5.0,
        min_bound=0.5,
        max_bound=60.0,
        compliance_standard="OR-Tools CP-SAT Solver Config",
    ),
    "min_support_surface_ratio": ParameterDefinition(
        param_key="min_support_surface_ratio",
        display_name="Minimum Container Support Surface Ratio",
        param_scope="TIER_2",
        param_type="FLOAT",
        unit="ratio",
        description="Minimum contact area fraction beneath a stacked SKU required to guarantee gravitational equilibrium.",
        latex_symbol=r"S_{\min}^{\text{supp}}",
        default_value=0.85,
        min_bound=0.50,
        max_bound=1.00,
        compliance_standard="VDI 2700 (Pallet Overhang & Base Support)",
    ),
    "lifo_strictness_ratio": ParameterDefinition(
        param_key="lifo_strictness_ratio",
        display_name="LIFO Acyclic Extraction Constraint",
        param_scope="TIER_2",
        param_type="FLOAT",
        unit="ratio",
        description="Strictness penalty enforcing Last-In-First-Out container extraction without reshuffling.",
        latex_symbol=r"R_{\text{LIFO}}",
        default_value=1.00,
        min_bound=0.50,
        max_bound=1.00,
        compliance_standard="VDI 4400 Acyclic Stacking DAG",
    ),

    # -------------------------------------------------------------
    # TIER 3: MASTER ROUTING & QUANTUM OPTIMIZATION
    # -------------------------------------------------------------
    "hgs_population_size": ParameterDefinition(
        param_key="hgs_population_size",
        display_name="HGS-ADC Memetic Genetic Population",
        param_scope="TIER_3",
        param_type="INTEGER",
        unit="individuals",
        description="Population size for Hybrid Genetic Search managing sub-populations of feasible and infeasible tours.",
        latex_symbol=r"P_{\text{HGS}}",
        default_value=40,
        min_bound=10,
        max_bound=200,
        compliance_standard="Vidal et al. Memetic VRP Paradigm",
    ),
    "qaoa_layers_p": ParameterDefinition(
        param_key="qaoa_layers_p",
        display_name="QAOA Quantum Circuit Layers (p)",
        param_scope="QUANTUM",
        param_type="INTEGER",
        unit="layers",
        description="Depth of alternating cost and mixer Hamiltonian unitary operators in Classiq QAOA ansatz.",
        latex_symbol=r"p",
        default_value=2,
        min_bound=1,
        max_bound=10,
        compliance_standard="Classiq Quantum Optimization Synthesis",
    ),
    "shots_count": ParameterDefinition(
        param_key="shots_count",
        display_name="Quantum Circuit Execution Shots",
        param_scope="QUANTUM",
        param_type="INTEGER",
        unit="shots",
        description="Repetitions of quantum circuit execution measuring final bitstring probability distributions.",
        latex_symbol=r"N_{\text{shots}}",
        default_value=1024,
        min_bound=100,
        max_bound=10000,
        compliance_standard="Quantum Measurement Statistics",
    ),
    "qubits_allocated": ParameterDefinition(
        param_key="qubits_allocated",
        display_name="Quantum Co-Processor Active Qubits",
        param_scope="QUANTUM",
        param_type="INTEGER",
        unit="qubits",
        description="Total physical or simulated qubits allocated to the QUBO vehicle routing cost Hamiltonian.",
        latex_symbol=r"N_q",
        default_value=32,
        min_bound=8,
        max_bound=127,
        compliance_standard="Classiq Quantum SDK Architecture",
    ),
    "backend_target": ParameterDefinition(
        param_key="backend_target",
        display_name="Quantum Backend Execution Provider",
        param_scope="QUANTUM",
        param_type="STRING",
        unit="",
        description="Target execution platform (e.g. 'classiq_statevector_simulator', 'ibm_brisbane', 'ionq_harmony').",
        latex_symbol=r"\mathcal{B}_{\text{target}}",
        default_value="classiq_simulator",
        compliance_standard="QPU Hardware Backend Specs",
    ),
    "penalty_multiplier_lambda": ParameterDefinition(
        param_key="penalty_multiplier_lambda",
        display_name="SLA Open-Window Penalty Multiplier",
        param_scope="SLA",
        param_type="FLOAT",
        unit="cost/s",
        description="Lagrangian multiplier penalizing late arrival beyond customer open delivery time windows.",
        latex_symbol=r"\lambda_{\text{SLA}}",
        default_value=50.0,
        min_bound=1.0,
        max_bound=1000.0,
        compliance_standard="Logistics SLA Penalty Standard",
    ),

    # -------------------------------------------------------------
    # TIER 4: KINODYNAMICS & COLLISION AVOIDANCE
    # -------------------------------------------------------------
    "sipp_time_resolution_sec": ParameterDefinition(
        param_key="sipp_time_resolution_sec",
        display_name="SIPP Trajectory Time Discretization",
        param_scope="TIER_4",
        param_type="FLOAT",
        unit="s",
        description="Temporal resolution for Safe Interval Path Planning safe space-time conflict intervals.",
        latex_symbol=r"\Delta t_{\text{SIPP}}",
        default_value=0.10,
        min_bound=0.01,
        max_bound=1.00,
        compliance_standard="SIPP Space-Time Planning",
    ),
    "hri_deceleration_gain": ParameterDefinition(
        param_key="hri_deceleration_gain",
        display_name="HRI Adaptive Deceleration Factor",
        param_scope="TIER_4",
        param_type="FLOAT",
        unit="",
        description="Damping factor reducing velocity when proximity sensors detect human workers in shared picking zones.",
        latex_symbol=r"k_{\text{HRI}}",
        default_value=0.50,
        min_bound=0.10,
        max_bound=1.00,
        compliance_standard="DIN EN ISO 3691-4:2020 Clause 5.2.2 (Human Presence)",
    ),
}


def get_parameter_catalog() -> Dict[str, ParameterDefinition]:
    """Returns the immutable standard parameter dictionary."""
    return PARAMETER_CATALOG


def get_parameter_metadata(key: str) -> Optional[ParameterDefinition]:
    """Lookup metadata definition for a single parameter key."""
    return PARAMETER_CATALOG.get(key)


def build_run_parameters_snapshot(
    user_config: Optional[Dict[str, Any]] = None,
    overrides: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Merges defaults with incoming request config and produces a fully annotated list of parameters ready for DB persistence."""
    merged: Dict[str, Any] = {}
    overridden_keys = set()

    # 1. Base defaults from catalog
    for key, defn in PARAMETER_CATALOG.items():
        merged[key] = defn.default_value

    # 2. Merge user config
    if user_config:
        for k, v in user_config.items():
            if v is not None:
                merged[k] = v
                if k in PARAMETER_CATALOG and v != PARAMETER_CATALOG[k].default_value:
                    overridden_keys.add(k)

    # 3. Explicit overrides
    if overrides:
        for k, v in overrides.items():
            if v is not None:
                merged[k] = v
                overridden_keys.add(k)

    # 4. Build output records
    snapshot = []
    for key, val in merged.items():
        meta = PARAMETER_CATALOG.get(key)
        if meta:
            snapshot.append({
                "param_scope": meta.param_scope,
                "param_key": key,
                "display_name": meta.display_name,
                "param_value": str(val),
                "param_type": meta.param_type,
                "unit": meta.unit,
                "description": meta.description,
                "latex_symbol": meta.latex_symbol,
                "min_bound": meta.min_bound,
                "max_bound": meta.max_bound,
                "compliance_standard": meta.compliance_standard,
                "is_overridden": 1 if key in overridden_keys else 0,
            })
        else:
            snapshot.append({
                "param_scope": "CUSTOM",
                "param_key": key,
                "display_name": key.replace("_", " ").title(),
                "param_value": str(val),
                "param_type": "STRING",
                "unit": "",
                "description": f"Custom dispatch engine configuration parameter: {key}",
                "latex_symbol": "",
                "min_bound": None,
                "max_bound": None,
                "compliance_standard": "",
                "is_overridden": 1,
            })

    return snapshot


PARAMETER_DEFINITIONS = PARAMETER_CATALOG
