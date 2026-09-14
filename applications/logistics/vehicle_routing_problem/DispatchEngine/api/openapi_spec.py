"""Complete, Programmatic OpenAPI 3.1.0 Specification Generator for DispatchEngine.

Features rich, industrial-grade endpoint annotations, mathematical problem definitions,
exhaustive parameter descriptions, concrete request body examples, and full response samples.
"""

from __future__ import annotations
import json
import socket
from typing import Dict, Any, List, Optional


def get_detected_ip_addresses() -> List[str]:
    """Detects available network IPv4 addresses on the host machine, prioritizing standard LAN IPs."""
    detected: List[str] = []
    try:
        hostname = socket.gethostname()
        _, _, ip_list = socket.gethostbyname_ex(hostname)
        for ip in ip_list:
            if ip and not ip.startswith("127.") and ip not in detected:
                detected.append(ip)
    except Exception:
        pass

    def ip_priority(ip: str) -> int:
        if ip.startswith("192.168."):
            return 0
        if ip.startswith("10."):
            return 1
        if ip.startswith("100."):
            return 2
        return 3

    detected.sort(key=ip_priority)
    return detected


def get_servers_list(current_host: Optional[str] = None, port: int = 8080) -> List[Dict[str, str]]:
    """Builds the OpenAPI servers list prioritizing the current machine published IP."""
    servers: List[Dict[str, str]] = []
    seen_urls = set()

    def add_server(url: str, desc: str):
        normalized = url if url == "/" else url.rstrip("/")
        if normalized not in seen_urls:
            seen_urls.add(normalized)
            servers.append({"url": normalized, "description": desc})

    detected_ips = get_detected_ip_addresses()
    primary_ip = detected_ips[0] if detected_ips else "192.168.102.85"

    # 1. Primary Published Server: Current machine LAN IP (shown and selected by default in Swagger UI)
    add_server(
        f"http://{primary_ip}:{port}",
        f"Published Standalone DispatchEngine Server (Current IP: {primary_ip})"
    )

    # 2. If client connected via explicit host or domain differing from primary and loopback
    if current_host:
        clean_host = current_host.strip()
        host_no_port = clean_host.split(":")[0].lower()
        if host_no_port not in ("127.0.0.1", "localhost", primary_ip.lower()):
            req_url = clean_host if clean_host.startswith("http") else f"http://{clean_host}"
            add_server(req_url, f"Published DispatchEngine Server (Request Host: {clean_host})")

    # 3. Other detected network interfaces (VPN, Hyper-V, WSL)
    for ip in detected_ips:
        if ip != primary_ip:
            if ip.startswith("100."):
                add_server(f"http://{ip}:{port}", f"DispatchEngine Server (WARP / VPN: {ip})")
            elif ip.startswith("172."):
                add_server(f"http://{ip}:{port}", f"DispatchEngine Server (Virtual Switch / WSL: {ip})")
            else:
                add_server(f"http://{ip}:{port}", f"DispatchEngine Server (Interface: {ip})")

    # 4. Local loopback and localhost
    add_server(f"http://127.0.0.1:{port}", f"Local Standalone DispatchEngine Server (127.0.0.1:{port})")
    add_server(f"http://localhost:{port}", f"Localhost Standalone DispatchEngine Server (localhost:{port})")
    add_server("http://localhost:8000", "FastAPI ASGI Server (Port 8000)")
    add_server("/", "Relative Current Origin (Browser Host)")

    return servers


def generate_openapi_spec(current_host: Optional[str] = None, port: int = 8080) -> Dict[str, Any]:
    """Builds a 100% compliant, fully annotated OpenAPI 3.1.0 specification document."""
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Industrial Multi-Tier Warehouse Optimization Engine (DispatchEngine) API",
            "version": "1.0.0",
            "description": (
                "### Enterprise REST & Streaming API for Extended Rich Multi-Depot VRPTW with "
                "Classiq Quantum Co-Processor Acceleration ($\\mathcal{P}_{\\text{ER-MD-VRPTW-3D-HRI-Q}}$).\n\n"
                "$$\\min_{\\mathbf{x}, \\mathbf{u}, \\mathbf{p}} \\quad \\mathcal{J} = "
                "\\alpha_1 \\max_{k \\in \\mathcal{K}} T_k + \\alpha_2 \\sum_{k \\in \\mathcal{K}} D_k + "
                "\\alpha_3 \\operatorname{Var}(L_c) + \\alpha_4 \\sum_{i=1}^N \\max(0, t_i - l_i) + \\mathcal{M} \\cdot \\Phi$$\n\n"
                "$$\\text{Subject to:} \\quad \\Phi = \\sum_{m=1}^4 w_m \\max\\left(0, g_m(\\mathbf{x}, t)\\right) = 0.000 < 1.000$$\n\n"
                "#### 4-Tier Optimization Hierarchy:\n"
                "- **Tier 1 (Macro-Clustering)**: Decomposes $N$ order picking requests into $K$ vehicle work batches while "
                "balancing accumulation chute buffer inflows using Classiq Quantum Fuzzy C-Means (SC-QFCM) or Distributionally Robust SAA.\n"
                "- **Tier 2 (3D Bin Packing & LIFO DAG)**: Computes extreme-point 3D cargo loading within vehicle bays, enforces physical stability "
                "(friction $\\mu = 0.45$, support surface $> 85\\%$, dynamic Center-of-Gravity bounds), and builds an acyclic LIFO extraction DAG.\n"
                "- **Tier 3 (Multi-Depot Routing & Scheduling)**: Sequences pickups, depot dispatches, and chute drop-offs via Classiq QAOA subtour "
                "optimization on parameterized Ising Hamiltonians or Hybrid Genetic Search (HGS-ADC).\n"
                "- **Tier 4 (Continuous Kinematics & SIPP)**: Generates 50Hz quintic B-spline trajectories, verifies continuous space-time non-overlap, "
                "and enforces dynamic deceleration in Human-Robot Interaction (HRI) congestion zones.\n\n"
                "#### Mathematical Invariants & Recourse:\n"
                "The engine continuously checks **Invariant Gates 1 through 4**, mathematically certifying physical safety under cryptographic "
                "invariant code `'lmn'` and bounding the unified falsification ratio $\\Phi < 1.000$ via automated Benders cuts."
            ),
            "contact": {
                "name": "Classiq Logistics Team",
                "url": "https://classiq.io",
            },
            "license": {
                "name": "Apache 2.0",
                "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
            },
        },
        "servers": get_servers_list(current_host=current_host, port=port),
        "tags": [
            {
                "name": "Scenarios & Mock Data Engine",
                "description": "Synthetic warehouse generation, canonical benchmark presets, live sample previews, and full CRUD over order pools and warehouse topology.",
            },
            {
                "name": "Wave Orchestration",
                "description": "Master multi-tier dispatch pipeline coordinating Tiers 1-4, Benders recourse loop, run comparisons, and AI execution explanations.",
            },
            {
                "name": "Isolated Tier Solvers",
                "description": "Unit-level isolated execution for Tier 1 (Batching), Tier 2 (3D Bin Packing), Tier 3 (Routing), and Tier 4 (Kinematic Trajectories).",
            },
            {
                "name": "Invariant Validation Gates & Recourse",
                "description": "Formal mathematical validation of physical, temporal, and spatial invariants (Gates 1-4) with automated Benders cut generation.",
            },
            {
                "name": "Quantum Co-Processor (Classiq)",
                "description": "Swap-Test state fidelity, ZZ feature maps, parameterized QAOA subtour synthesis, Shannon entropy, and 32Q register hardware telemetry.",
            },
            {
                "name": "Comparative Benchmarks",
                "description": "4-Way algorithmic benchmarking (FIFO vs Hard K-Means vs Classical SC-QFCM vs Classiq Quantum) and automated regression detection.",
            },
            {
                "name": "Presentation HUD & Simulation Streaming",
                "description": "6-panel executive dashboard HUD, 10Hz/20Hz time-series vehicle poses, real-time SSE event streams, PDF dossier compiler, and graph rendering.",
            },
            {
                "name": "Telemetry & Falsification Audit",
                "description": "Distributed OpenTelemetry spans and immutable audit trail certifying verification invariant code 'lmn' and Lyapunov stability.",
            },
            {
                "name": "System Health & Diagnostics",
                "description": "Engine health status, physical limits specification, SQLite database downloads, and OpenAPI 3.1.0 JSON definitions.",
            },
        ],
        "paths": {
            # =========================================================================
            # TAG 1: SCENARIOS & MOCK DATA ENGINE
            # =========================================================================
            "/api/v1/scenarios/archetypes": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "List Warehouse Scenario Archetypes",
                    "description": (
                        "### Operational & Algorithmic Meaning\n"
                        "Retrieves the 7 canonical industrial warehouse archetypes supported by the synthetic mocking engine. "
                        "Each archetype targets distinct operational stress modes:\n"
                        "- **UNIFORM_RANDOM**: Baseline uniform spatial distribution across all aisles.\n"
                        "- **PARETO_HOT_ZONE**: 80/20 order concentration in front fast-mover aisles near packing chutes, testing consolidation buffer saturation.\n"
                        "- **DUAL_DEPOT_CROSS_DOCK**: Split inventory between opposing perimeter depots, testing AMR battery endurance and cross-facility transit.\n"
                        "- **PEAK_SURGE_HEAVY_TAIL**: Ultra-tight deadline windows (80-240s) stressing time-window feasibility and SLA penalty minimization.\n"
                        "- **HAZMAT_SEGREGATION**: High concentration (45%) of FLAMMABLE/CORROSIVE parcels requiring Tier 2 physical bin separation.\n"
                        "- **HRI_STOCHASTIC_BOTTLENECK**: Pedestrian crossing corridors triggering dynamic vehicle speed throttling down to 0.4 m/s.\n"
                        "- **ENTERPRISE_SCALE_STRESS**: Massive order waves (up to 35,000 orders) across 25 aisles and 64 AMRs for scalability stress testing."
                    ),
                    "operationId": "listScenarioArchetypes",
                    "responses": {
                        "200": {
                            "description": "List of available archetypes with physical characteristics and stress targets.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ArchetypeListResponse"},
                                    "example": {
                                        "archetypes": [
                                            {
                                                "archetype_key": "PARETO_HOT_ZONE",
                                                "title": "Pareto Hot-Zone (80/20 Clustering)",
                                                "description": "80% of orders concentrated in fast-mover front aisles 1-5 near packing chutes.",
                                                "stress_target": "Consolidation chute balance and density bottlenecks"
                                            },
                                            {
                                                "archetype_key": "DUAL_DEPOT_CROSS_DOCK",
                                                "title": "Dual-Depot Cross-Dock Transit",
                                                "description": "Orders split between opposing perimeter depots, requiring long inter-depot transit.",
                                                "stress_target": "AMR battery endurance and fleet travel distance"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/presets": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "List Canonical Benchmark Presets",
                    "description": (
                        "### Operational Meaning\n"
                        "Returns pre-configured benchmark configurations (`small-smoke-40`, `pareto-cluster-200`, `hazmat-heavy-500`, "
                        "`surge-deadline-1000`, `enterprise-35k`). These presets are standardized test beds for regression testing and "
                        "algorithm comparison across quantum and classical solvers."
                    ),
                    "operationId": "listCanonicalPresets",
                    "responses": {
                        "200": {
                            "description": "Dictionary of pre-configured benchmark presets.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "additionalProperties": {"$ref": "#/components/schemas/MockScenarioCreateRequest"}
                                    },
                                    "example": {
                                        "small-smoke-40": {
                                            "scenario_name": "Small Smoke Test (40 Orders)",
                                            "archetype": "UNIFORM_RANDOM",
                                            "num_orders": 40,
                                            "num_vehicles": 4,
                                            "num_depots": 2,
                                            "num_chutes": 2,
                                            "seed": 42
                                        },
                                        "pareto-cluster-200": {
                                            "scenario_name": "Pareto Hot-Zone Cluster (200 Orders)",
                                            "archetype": "PARETO_HOT_ZONE",
                                            "num_orders": 200,
                                            "num_vehicles": 8,
                                            "num_depots": 2,
                                            "num_chutes": 4,
                                            "seed": 101
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/presets/{preset_name}": {
                "post": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Generate Scenario from Canonical Preset",
                    "description": (
                        "### Operational Meaning\n"
                        "Instantly instantiates and persists a standardized warehouse benchmark scenario by preset key. "
                        "Generates all physical coordinates, SKU attributes, depot origins, and consolidation chute targets in SQLite."
                    ),
                    "operationId": "generateFromPreset",
                    "parameters": [
                        {
                            "name": "preset_name",
                            "in": "path",
                            "required": True,
                            "schema": {
                                "type": "string",
                                "enum": ["small-smoke-40", "pareto-cluster-200", "hazmat-heavy-500", "surge-deadline-1000", "enterprise-35k"],
                                "example": "pareto-cluster-200"
                            },
                            "description": "Unique key identifier of the canonical benchmark preset"
                        }
                    ],
                    "responses": {
                        "201": {
                            "description": "Scenario generated and committed to SQLite database.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ScenarioDetailResponse"},
                                    "example": {
                                        "scenario_id": "SCEN-D148745B",
                                        "name": "Pareto Hot-Zone Cluster (200 Orders)",
                                        "archetype": "PARETO_HOT_ZONE",
                                        "created_at": "2026-09-14T12:00:00Z",
                                        "random_seed": 101,
                                        "order_count": 200,
                                        "fleet_size": 8,
                                        "depot_count": 2,
                                        "chute_count": 4,
                                        "is_mock": True
                                    }
                                }
                            }
                        },
                        "404": {"description": "Preset key not found in CANONICAL_PRESETS registry."}
                    }
                }
            },
            "/api/v1/scenarios/mock-sample": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Live Sample Order Preview (Non-Persisted)",
                    "description": (
                        "### Operational Meaning\n"
                        "Generates an in-memory sample of 1 to 50 simulated warehouse picking orders without writing to SQLite. "
                        "Used by frontend studios and automated UI visualizers to preview order coordinate distributions, volumetric dimensions, "
                        "SLA deadlines, and ADR hazard classifications before running full wave synthesis."
                    ),
                    "operationId": "previewMockSample",
                    "parameters": [
                        {
                            "name": "archetype",
                            "in": "query",
                            "schema": {"type": "string", "default": "PARETO_HOT_ZONE"},
                            "description": "Target warehouse spatial distribution archetype"
                        },
                        {
                            "name": "count",
                            "in": "query",
                            "schema": {"type": "integer", "default": 5, "minimum": 1, "maximum": 50},
                            "description": "Number of sample order lines to preview"
                        },
                        {
                            "name": "seed",
                            "in": "query",
                            "schema": {"type": "integer", "default": 42},
                            "description": "Random seed for reproducible preview distributions"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Array of preview order lines.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/OrderLineSchema"}
                                    },
                                    "example": [
                                        {
                                            "order_id": "ORD_00001",
                                            "sku_id": "SKU_4912",
                                            "depot_id": "DEPOT_1",
                                            "aisle_id": "AISLE_02",
                                            "pickup_pos": {"x": 12.5, "y": 18.0, "z": 1.6},
                                            "drop_chute_id": "CHUTE_1",
                                            "mass_kg": 4.2,
                                            "volume_m3": 0.0125,
                                            "dimensions_m": {"length": 0.35, "width": 0.25, "height": 0.14},
                                            "open_window_start": 0.0,
                                            "drop_deadline": 380.0,
                                            "hazard_class": "NONE",
                                            "sla_priority": 0.85
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/generate": {
                "post": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Synthesize Custom Warehouse Scenario",
                    "description": (
                        "### Operational & Mathematical Meaning\n"
                        "Generates a complete custom warehouse dataset parameterized by order count $N \\in [10, 35000]$, fleet size $K$, "
                        "depots, consolidation chutes, and hazard ratio. Generates:\n"
                        "- 3D picking coordinates $(x_i, y_i, z_i)$ based on rack aisle layout geometries.\n"
                        "- Parcel mass $m_i \\sim \\text{Gamma}(\\alpha, \\beta)$ and volume $v_i = l_i w_i h_i$.\n"
                        "- Pickup availability times $e_i$ and delivery deadlines $l_i = e_i + \\Delta t_{\\text{SLA}}$.\n"
                        "- ADR chemical hazard classes (`NONE`, `FLAMMABLE`, `CORROSIVE`, `HAZ_A`) for Tier 2 bin segregation.\n"
                        "Persists the scenario into SQLite and returns the scenario identifier."
                    ),
                    "operationId": "generateCustomScenario",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/MockScenarioCreateRequest"},
                                "examples": {
                                    "StandardParetoWave": {
                                        "summary": "Standard Pareto Hot-Zone Wave (80 Orders)",
                                        "description": "Typical e-commerce fulfillment wave with 80 orders, 4 AMRs, 2 depots, and 2 packing chutes.",
                                        "value": {
                                            "scenario_name": "Wave-2026-Pareto-ZoneA",
                                            "archetype": "PARETO_HOT_ZONE",
                                            "num_orders": 80,
                                            "num_vehicles": 4,
                                            "num_depots": 2,
                                            "num_chutes": 2,
                                            "hazard_ratio": 0.10,
                                            "seed": 42
                                        }
                                    },
                                    "HazardousChemicalSurge": {
                                        "summary": "Hazardous Materials Stress Wave (120 Orders)",
                                        "description": "High hazard ratio (35%) wave testing Tier 2 bin chemical segregation cuts.",
                                        "value": {
                                            "scenario_name": "Wave-HAZMAT-Chemical-ZoneB",
                                            "archetype": "HAZMAT_SEGREGATION",
                                            "num_orders": 120,
                                            "num_vehicles": 6,
                                            "num_depots": 3,
                                            "num_chutes": 3,
                                            "hazard_ratio": 0.35,
                                            "seed": 107
                                        }
                                    },
                                    "CrossDockTransitSurge": {
                                        "summary": "Cross-Dock Perimeter Wave (150 Orders)",
                                        "description": "Dual-depot cross-dock scenario with AMRs traversing long perimeter corridors.",
                                        "value": {
                                            "scenario_name": "Wave-CrossDock-LongHaul",
                                            "archetype": "DUAL_DEPOT_CROSS_DOCK",
                                            "num_orders": 150,
                                            "num_vehicles": 8,
                                            "num_depots": 2,
                                            "num_chutes": 4,
                                            "hazard_ratio": 0.05,
                                            "seed": 999
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Custom scenario created and committed to database.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ScenarioDetailResponse"},
                                    "example": {
                                        "scenario_id": "SCEN-D148745B",
                                        "name": "Wave-2026-Pareto-ZoneA",
                                        "archetype": "PARETO_HOT_ZONE",
                                        "created_at": "2026-09-14T12:00:00Z",
                                        "random_seed": 42,
                                        "order_count": 80,
                                        "fleet_size": 4,
                                        "depot_count": 2,
                                        "chute_count": 2,
                                        "is_mock": True
                                    }
                                }
                            }
                        },
                        "400": {"description": "Invalid parameter configuration (e.g. order count out of bounds [10, 35000])."}
                    }
                }
            },
            "/api/v1/scenarios": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "List Persisted Scenarios",
                    "description": (
                        "### Operational Meaning\n"
                        "Queries all warehouse scenario instances currently stored in the SQLite database with pagination. "
                        "Returns scenario metadata, order counts, fleet sizes, and creation timestamps."
                    ),
                    "operationId": "listScenarios",
                    "parameters": [
                        {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}, "description": "Page index (1-based)"},
                        {"name": "page_size", "in": "query", "schema": {"type": "integer", "default": 20}, "description": "Maximum scenarios per page"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Paginated array of scenario summary records.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/ScenarioDetailResponse"}
                                    },
                                    "example": [
                                        {
                                            "scenario_id": "SCEN-D148745B",
                                            "name": "Wave-2026-Pareto-ZoneA",
                                            "archetype": "PARETO_HOT_ZONE",
                                            "created_at": "2026-09-14T12:00:00Z",
                                            "random_seed": 42,
                                            "order_count": 80,
                                            "fleet_size": 4,
                                            "depot_count": 2,
                                            "chute_count": 2,
                                            "is_mock": True
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/{scenario_id}": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Get Scenario Metadata",
                    "description": "Retrieves comprehensive metadata, depot counts, and bounding box dimensions for a specific scenario by ID.",
                    "operationId": "getScenarioById",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string", "example": "SCEN-D148745B"}, "description": "Unique scenario ID"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Scenario metadata record.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ScenarioDetailResponse"}
                                }
                            }
                        },
                        "404": {"description": "Scenario ID not found in database."}
                    }
                },
                "delete": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Delete Scenario & Associated Orders",
                    "description": "Cascades deletion across orders, chutes, depots, and execution runs tied to this scenario ID.",
                    "operationId": "deleteScenario",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string", "example": "SCEN-D148745B"}, "description": "Scenario ID to delete"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Scenario deleted successfully.",
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object", "properties": {"success": {"type": "boolean"}, "scenario_id": {"type": "string"}}},
                                    "example": {"success": True, "scenario_id": "SCEN-D148745B", "deleted": True}
                                }
                            }
                        },
                        "404": {"description": "Scenario ID not found."}
                    }
                }
            },
            "/api/v1/scenarios/{scenario_id}/orders": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Get Scenario Orders Pool",
                    "description": (
                        "### Operational Meaning\n"
                        "Queries individual order lines belonging to a scenario. Returns exact 3D coordinates, SKU identifiers, "
                        "volumetric dimensions, weight, deadlines, hazard class, and SLA priority weighting."
                    ),
                    "operationId": "getScenarioOrders",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string", "example": "SCEN-D148745B"}, "description": "Scenario identifier"},
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 50}, "description": "Maximum orders to fetch"},
                        {"name": "offset", "in": "query", "schema": {"type": "integer", "default": 0}, "description": "Pagination offset"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Array of order line records.",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/OrderLineSchema"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/{scenario_id}/dataset": {
                "get": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Export Complete Scenario Dataset",
                    "description": (
                        "### Operational Meaning\n"
                        "Exports the unified dataset bundle (scenario metadata, all order lines, depot coordinates, and accumulation chute locations) "
                        "in a single consolidated payload for offline ML model training or digital twin synchronization."
                    ),
                    "operationId": "getScenarioDataset",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string", "example": "SCEN-D148745B"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Full scenario dataset payload.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ScenarioDatasetResponse"}
                                }
                            }
                        },
                        "404": {"description": "Scenario not found."}
                    }
                }
            },
            "/api/v1/scenarios/{scenario_id}/orders/add": {
                "post": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Inject Single Order into Scenario Pool",
                    "description": "Injects an ad-hoc emergency pick order into an active scenario order pool.",
                    "operationId": "addOrderToScenario",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string", "example": "SCEN-D148745B"}}
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/OrderLineSchema"},
                                "example": {
                                    "order_id": "ORD_EMERGENCY_999",
                                    "sku_id": "SKU_RUSH_01",
                                    "depot_id": "DEPOT_1",
                                    "aisle_id": "AISLE_01",
                                    "pickup_pos": {"x": 5.0, "y": 10.0, "z": 1.2},
                                    "drop_chute_id": "CHUTE_1",
                                    "mass_kg": 2.5,
                                    "volume_m3": 0.008,
                                    "dimensions_m": {"length": 0.25, "width": 0.20, "height": 0.16},
                                    "open_window_start": 0.0,
                                    "drop_deadline": 180.0,
                                    "hazard_class": "NONE",
                                    "sla_priority": 1.0
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Order injected successfully.",
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object", "properties": {"success": {"type": "boolean"}, "order_id": {"type": "string"}}}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/scenarios/{scenario_id}/orders/{order_id}": {
                "put": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Update Order Attributes (Deadline / SLA / Mass)",
                    "description": "Dynamically updates parcel deadline, SLA priority, mass, or drop chute target in the database.",
                    "operationId": "updateOrderInScenario",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "order_id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"type": "object"},
                                "example": {"drop_deadline": 240.0, "sla_priority": 0.95, "hazard_class": "FLAMMABLE"}
                            }
                        }
                    },
                    "responses": {
                        "200": {"description": "Order updated successfully."},
                        "404": {"description": "Order not found."}
                    }
                },
                "delete": {
                    "tags": ["Scenarios & Mock Data Engine"],
                    "summary": "Cancel / Remove Order from Scenario",
                    "description": "Removes a specific order line from the scenario pool prior to wave dispatch.",
                    "operationId": "deleteOrderFromScenario",
                    "parameters": [
                        {"name": "scenario_id", "in": "path", "required": True, "schema": {"type": "string"}},
                        {"name": "order_id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {"description": "Order removed successfully."},
                        "404": {"description": "Order not found."}
                    }
                }
            },

            # =========================================================================
            # TAG 2: WAVE ORCHESTRATION
            # =========================================================================
            "/api/v1/dispatch/waves": {
                "post": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Execute Synchronous Wave Dispatch (Tiers 1-4 + Gates)",
                    "description": (
                        "### Operational & Algorithmic Meaning\n"
                        "Executes the end-to-end multi-tier warehouse optimization pipeline ($\\mathcal{P}_{\\text{ER-MD-VRPTW-3D-HRI-Q}}$):\n"
                        "$$\\min_{\\mathbf{x}, \\mathbf{u}, \\mathbf{p}} \\quad \\mathcal{J}_{\\text{wave}} = "
                        "\\alpha_1 \\max_{k \\in \\mathcal{K}} T_k + \\alpha_2 \\sum_{k \\in \\mathcal{K}} D_k + "
                        "\\alpha_3 \\operatorname{Var}(L_c) + \\alpha_4 \\sum_{i=1}^N \\max(0, t_i - l_i)$$\n\n"
                        "1. **Tier 1**: Batching & Chute Balancing via Classiq Quantum Fuzzy C-Means (SC-QFCM) or DR-SAA.\n"
                        "2. **Tier 2**: 3D Bin Packing with LIFO acyclic extraction DAG construction and center-of-gravity stability checks.\n"
                        "3. **Tier 3**: Multi-depot routing and vehicle scheduling via Classiq QAOA subtour optimization ($p=2, 32\\text{Q}$) or HGS-ADC.\n"
                        "4. **Tier 4**: Kinematic spline generation and Safe Interval Path Planning (SIPP) space-time corridor reservation.\n"
                        "5. **Invariant Validation Gates 1-4**: Physical and temporal validation; on violation, generates Benders feasibility/optimality cuts and re-solves.\n"
                        "6. **Commit Snapshot**: Writes mission routes, stops, KPIs, and 200 simulation frames to SQLite."
                    ),
                    "operationId": "executeWaveDispatch",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/WaveDispatchRequest"},
                                "examples": {
                                    "Quantum32QExecution": {
                                        "summary": "Classiq Quantum Co-Processor Wave (32 Qubits)",
                                        "description": "Production quantum hybrid wave with 32-qubit QAOA subtour solver and SC-QFCM clustering.",
                                        "value": {
                                            "scenario_id": "SCEN-D148745B",
                                            "num_orders": 80,
                                            "num_vehicles": 4,
                                            "operational_mode": "QUANTUM",
                                            "mode": "32Q",
                                            "seed": 42,
                                            "enable_benders_recourse": True,
                                            "quantum_config": {
                                                "shots": 2048,
                                                "p_steps": 2,
                                                "transpilation_level": 2
                                            }
                                        }
                                    },
                                    "ClassicalBaselineExecution": {
                                        "summary": "Classical Baseline Wave (CPU / HGS-ADC)",
                                        "description": "Full classical execution using DR-SAA for clustering, CP-SAT for packing, and HGS-ADC for routing.",
                                        "value": {
                                            "scenario_id": "SCEN-D148745B",
                                            "num_orders": 80,
                                            "num_vehicles": 4,
                                            "operational_mode": "CLASSICAL",
                                            "mode": "CPU",
                                            "seed": 42,
                                            "enable_benders_recourse": True
                                        }
                                    },
                                    "AgilityHighThroughput": {
                                        "summary": "Agility High-Throughput Wave (Short Deadlines)",
                                        "description": "Prioritizes minimum makespan over energy conservation for rush e-commerce shifts.",
                                        "value": {
                                            "scenario_id": None,
                                            "num_orders": 100,
                                            "num_vehicles": 6,
                                            "operational_mode": "AGILITY",
                                            "mode": "32Q",
                                            "seed": 77,
                                            "enable_benders_recourse": True
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Wave dispatch complete with fleet makespan, routes, and invariant certification.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/WaveDispatchResponse"},
                                    "example": {
                                        "run_id": "RUN-933D5052",
                                        "scenario_id": "SCEN-D148745B",
                                        "wave_id": "WAVE-2DA292A7",
                                        "operational_mode": "QUANTUM",
                                        "mode": "32Q",
                                        "algorithm_ranks_used": {
                                            "Tier1": "RANK_1Q_QUANTUM_FCM",
                                            "Tier2": "RANK_1_CPSAT_MISOCP",
                                            "Tier3": "RANK_1Q_QAOA_ROUTING",
                                            "Tier4": "RANK_1_PBS_SIPP"
                                        },
                                        "total_fleet_makespan_sec": 949.3,
                                        "total_distance_km": 3.706,
                                        "chute_balance_variance": 0.45,
                                        "total_solve_latency_sec": 0.14,
                                        "falsification_ratio_phi": 0.880,
                                        "is_falsified": False,
                                        "routes": [
                                            {
                                                "vehicle_id": "AMR_01",
                                                "origin_depot": "DEPOT_1",
                                                "stops_count": 22,
                                                "route_makespan_sec": 912.4,
                                                "route_distance_km": 0.942,
                                                "carried_mass_kg": 42.5,
                                                "packed_volume_m3": 0.38,
                                                "sla_violations": 0
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Zero orders rejected or invalid configuration payload."
                        }
                    }
                }
            },
            "/api/v1/dispatch/runs": {
                "get": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Query Historical Execution Runs",
                    "description": "Lists past wave dispatch runs from SQLite ordered by timestamp descending.",
                    "operationId": "listExecutionRuns",
                    "parameters": [
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 20}, "description": "Maximum runs to return"}
                    ],
                    "responses": {
                        "200": {
                            "description": "List of historical execution runs.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ExecutionRunsListResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/dispatch/runs/{run_id}": {
                "put": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Update Run Metadata / Operational Status",
                    "description": "Modifies operator notes, verification status, or tags on an execution run.",
                    "operationId": "updateExecutionRun",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}}
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"type": "object"},
                                "example": {"status": "CERTIFIED", "notes": "Audited by chief operations officer; zero SLA violations."}
                            }
                        }
                    },
                    "responses": {
                        "200": {"description": "Run updated successfully."},
                        "404": {"description": "Run not found."}
                    }
                },
                "delete": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Delete Execution Run & Associated Telemetry",
                    "description": "Deletes the execution run record, vehicle routes, route stops, and produced telemetry.",
                    "operationId": "deleteExecutionRun",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}}
                    ],
                    "responses": {
                        "200": {"description": "Run deleted successfully."},
                        "404": {"description": "Run not found."}
                    }
                }
            },
            "/api/v1/dispatch/runs/{run_id}/explanation": {
                "get": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Get Human/AI Narrative Explanation for Run",
                    "description": (
                        "### Operational Meaning\n"
                        "Generates a multi-paragraph technical audit narrative explaining why the mission executed in its observed manner. "
                        "Decomposes the run into executive summary, mock data distribution analysis, tier-by-tier algorithmic decisions, "
                        "classical vs quantum co-processor synergy, and cryptographic Invariant `'lmn'` certification."
                    ),
                    "operationId": "getRunExplanation",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Structured narrative explanation.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/RunExplanationResponse"},
                                    "example": {
                                        "run_id": "RUN-933D5052",
                                        "scenario_id": "SCEN-D148745B",
                                        "operational_mode": "QUANTUM",
                                        "executive_summary": "Mission RUN-933D5052 executed an industrial dispatch wave under QUANTUM mode, achieving makespan of 949.3s across 3.71 km.",
                                        "mock_data": "The operating scenario simulates an active fulfillment floor with 80 orders and 4 AMRs across 10 aisles.",
                                        "tiers": {
                                            "tier1": "Tier 1: Macro-clustering groups spatial picking batches to minimize cross-aisle AMR transit dispersion.",
                                            "tier2": "Tier 2: 3D Volumetric packing packs parcel bays with LIFO acyclicity.",
                                            "tier3": "Tier 3: Multi-depot vehicle routing schedules optimal pickup/drop sequences.",
                                            "tier4": "Tier 4: Kinematics & collision avoidance computes 50Hz safe trajectories."
                                        },
                                        "algorithms": {
                                            "tier1": "Classiq Quantum Fuzzy C-Means (SC-QFCM)",
                                            "tier2": "Google OR-Tools CP-SAT with MISOCP bounds",
                                            "tier3": "Classiq QAOA Parameterized Angles (p=2)",
                                            "tier4": "Safe Interval Path Planning (SIPP)"
                                        },
                                        "classical_vs_quantum": "Quantum co-processor eliminates exponential combinatorial bottlenecks in Tiers 1 and 3; classical hardware handles 3D geometries and continuous 50Hz safety integration.",
                                        "verification_invariant": {"code": "lmn", "phi": 0.880, "is_certified": True}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/dispatch/runs/compare": {
                "get": {
                    "tags": ["Wave Orchestration"],
                    "summary": "Compare Two Execution Runs (Quantum vs Classical Delta)",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Computes direct deltas and energy conservation between baseline run $A$ and candidate run $B$:\n"
                        "$$\\Delta T = T_A - T_B \\quad [\\text{s}], \\qquad \\rho_T = \\frac{T_A - T_B}{T_A} \\times 100\\%$$\n\n"
                        "$$\\Delta D = D_A - D_B \\quad [\\text{km}], \\qquad \\Delta E \\approx 1.84 \\cdot \\Delta D \\quad [\\text{kWh saved}]$$"
                    ),
                    "operationId": "compareExecutionRuns",
                    "parameters": [
                        {"name": "run_a", "in": "query", "required": True, "schema": {"type": "string", "example": "RUN-CLASSICAL-01"}, "description": "Baseline run ID (typically classical)"},
                        {"name": "run_b", "in": "query", "required": True, "schema": {"type": "string", "example": "RUN-QUANTUM-01"}, "description": "Candidate run ID (typically quantum)"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Comparative diff metrics.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/RunComparisonDiffResponse"}
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 3: ISOLATED TIERS
            # =========================================================================
            "/api/v1/tiers/tier1-batching/solve": {
                "post": {
                    "tags": ["Isolated Tier Solvers"],
                    "summary": "Solve Tier 1: Order Clustering & Chute Balancing",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Partitions $N$ orders into $K$ vehicle picking clusters $\\{C_1, \\dots, C_K\\}$ while minimizing chute buffer variance:\n"
                        "$$\\min_{\\mathbf{U}, \\mathbf{V}} \\quad \\mathcal{J}_{\\text{Tier1}} = "
                        "\\sum_{k=1}^K \\sum_{i=1}^N u_{ik}^m \\, D_Q^2(\\mathbf{x}_i, \\mathbf{v}_k) + "
                        "\\lambda_{\\text{chute}} \\cdot \\frac{1}{C} \\sum_{c=1}^C \\left( L_c - \\bar{L} \\right)^2$$\n\n"
                        "$$\\text{Where:} \\quad D_Q(\\mathbf{x}_i, \\mathbf{v}_k) = \\sqrt{2 \\left(1 - \\sqrt{\\mathcal{F}(\\mathbf{x}_i, \\mathbf{v}_k)}\\right)}, "
                        "\\quad \\mathcal{F}(\\mathbf{x}_i, \\mathbf{v}_k) = \\left|\\langle \\psi(\\mathbf{x}_i) \\mid \\psi(\\mathbf{v}_k) \\rangle\\right|^2$$\n\n"
                        "When `use_quantum=True`, uses **Classiq Quantum Fuzzy C-Means (SC-QFCM)** with Swap-Test kernel fidelity in Hilbert space; "
                        "when `False`, solves via Distributionally Robust Sample Average Approximation (DR-SAA)."
                    ),
                    "operationId": "solveTier1",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Tier1BatchingRequest"},
                                "examples": {
                                    "QuantumFCMClustering": {
                                        "summary": "Quantum Fuzzy C-Means (SC-QFCM)",
                                        "value": {"scenario_id": "SCEN-D148745B", "num_vehicles": 4, "use_quantum": True}
                                    },
                                    "ClassicalDRSAABatching": {
                                        "summary": "Classical DR-SAA Clustering",
                                        "value": {"scenario_id": "SCEN-D148745B", "num_vehicles": 4, "use_quantum": False}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Tier 1 batch assignments and chute balance variance.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Tier1BatchingResponse"},
                                    "example": {
                                        "wave_id": "WAVE-2DA292A7",
                                        "batches": [{"batch_id": "B1", "vehicle_id": "AMR_01", "order_count": 20, "chute_id": "CHUTE_1"}],
                                        "chute_balance_variance": 0.45,
                                        "algorithm_used": "RANK_1Q_QUANTUM_FCM"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/tiers/tier2-containerization/solve": {
                "post": {
                    "tags": ["Isolated Tier Solvers"],
                    "summary": "Solve Tier 2: 3D Bin Packing & LIFO DAG Acyclicity",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Packs parcels into the rectangular vehicle cargo bay $\\mathcal{B} = [0, L] \\times [0, W] \\times [0, H]$ under physical stability:\n"
                        "$$\\forall i \\ne j \\in \\mathcal{B}_k: \\quad (x_i + l_i \\le x_j) \\lor (x_j + l_j \\le x_i) \\lor "
                        "(y_i + w_i \\le y_j) \\lor (y_j + w_j \\le y_i) \\lor (z_i + h_i \\le z_j) \\lor (z_j + h_j \\le z_i)$$\n\n"
                        "$$\\mathbf{r}_{\\text{CoG}} = \\frac{\\sum_{i \\in \\mathcal{B}_k} m_i \\cdot \\mathbf{c}_i}{\\sum_{i \\in \\mathcal{B}_k} m_i}, "
                        "\\qquad \\|\\mathbf{r}_{\\text{CoG}}^{xy} - \\mathbf{r}_{\\text{bay\\_center}}^{xy}\\| \\le \\Delta r_{\\max}, "
                        "\\qquad z_{\\text{CoG}} \\le 0.60 \\cdot H_{\\text{bay}}$$\n\n"
                        "$$(i, j) \\in \\mathcal{E}_{\\text{LIFO}} \\implies t_{\\text{drop}}(i) \\le t_{\\text{drop}}(j), "
                        "\\qquad \\operatorname{cycle}(\\mathcal{G}_{\\text{LIFO}}) = \\emptyset$$\n\n"
                        "- Enforces non-overlapping geometric placement and gravity support (friction $\\mu = 0.45$, support surface $\\ge 85\\%$).\n"
                        "- Constructs the LIFO precedence extraction Directed Acyclic Graph (DAG) certifying zero buried parcel inversions."
                    ),
                    "operationId": "solveTier2",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Tier2PackingRequest"},
                                "examples": {
                                    "StandardAMRBay": {
                                        "summary": "Standard AMR Cargo Bay (1.2m x 0.8m x 1.0m)",
                                        "value": {"batch_index": 0, "bay_dimensions_m": [1.2, 0.8, 1.0], "max_payload_kg": 150.0}
                                    },
                                    "CompactHeavyBay": {
                                        "summary": "Compact Heavy AMR Bay (0.8m x 0.6m x 0.8m)",
                                        "value": {"batch_index": 0, "bay_dimensions_m": [0.8, 0.6, 0.8], "max_payload_kg": 250.0}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "3D placement coordinates, volume packing density, and LIFO DAG edges.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Tier2PackingResponse"},
                                    "example": {
                                        "vehicle_id": "AMR_01",
                                        "total_packed_items": 20,
                                        "volume_utilization_ratio": 0.785,
                                        "center_of_mass": [0.58, 0.39, 0.42],
                                        "lifo_dag_edges_count": 18,
                                        "is_acyclic": True
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/tiers/tier3-routing/solve": {
                "post": {
                    "tags": ["Isolated Tier Solvers"],
                    "summary": "Solve Tier 3: Multi-Depot Vehicle Routing & Sequencing",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Solves extended multi-depot vehicle routing with pickup and delivery (MD-VRPTW-PD):\n"
                        "$$\\min_{\\mathbf{x}} \\quad \\sum_{k=1}^K \\sum_{i,j} c_{ij} x_{ijk} + \\lambda_{\\text{makespan}} \\max_{k \\in \\mathcal{K}} T_k$$\n\n"
                        "$$\\text{Ising Subtour Hamiltonian:} \\quad H_C = \\sum_{i=1}^n \\sum_{j \\ne i}^n c_{ij} \\, Z_i Z_j + "
                        "A \\sum_{i=1}^n \\left(1 - \\sum_j x_{ij}\\right)^2 + B \\sum_{S \\subset V, 2 \\le |S| \\le n-1} \\left(\\sum_{i,j \\in S} x_{ij} - |S| + 1\\right)$$\n\n"
                        "When `use_qaoa_subtour=True`, synthesizes a $p$-layer Classiq QAOA ansatz $|\\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta})\\rangle = "
                        "\\prod_{l=1}^p \\left( e^{-i \\beta_l H_M} e^{-i \\gamma_l H_C} \\right) |+\\rangle^{\\otimes n}$; "
                        "otherwise uses Hybrid Genetic Search with Advanced Diversity Control (HGS-ADC)."
                    ),
                    "operationId": "solveTier3",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Tier3RoutingRequest"},
                                "examples": {
                                    "QAOARouting": {
                                        "summary": "Classiq QAOA Quantum Routing",
                                        "value": {"use_qaoa_subtour": True, "p_steps": 2, "shots": 2048}
                                    },
                                    "HGSADCRouting": {
                                        "summary": "Classical HGS-ADC Routing",
                                        "value": {"use_qaoa_subtour": False}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Sequenced routes, fleet makespan, and tour distances.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Tier3RoutingResponse"},
                                    "example": {
                                        "total_fleet_makespan_sec": 949.3,
                                        "total_distance_km": 3.706,
                                        "routes_count": 4
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/tiers/tier4-kinematics/solve": {
                "post": {
                    "tags": ["Isolated Tier Solvers"],
                    "summary": "Solve Tier 4: Kinematics & Swept Corridor Reservations",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Smooths topological waypoint paths into $C^2$-continuous quintic B-spline trajectories $\\mathbf{p}_k(t) \\in \\mathbb{R}^2$:\n"
                        "$$\\mathbf{p}_k(t) = \\sum_{i=0}^n N_{i, 5}(t) \\, \\mathbf{P}_{k, i}, \\qquad t \\in [0, T_k]$$\n\n"
                        "$$\\|\\dot{\\mathbf{p}}_k(t)\\|_2 \\le v_{\\max} = 1.5\\,\\text{m/s}, "
                        "\\qquad \\|\\ddot{\\mathbf{p}}_k(t)\\|_2 \\le a_{\\max} = 1.0\\,\\text{m/s}^2, "
                        "\\qquad \\|\\dddot{\\mathbf{p}}_k(t)\\|_2 \\le j_{\\max} = 2.0\\,\\text{m/s}^3$$\n\n"
                        "$$\\forall a \\ne b, \\, \\forall t: \\quad \\|\\mathbf{p}_a(t) - \\mathbf{p}_b(t)\\|_2 \\ge R_a + R_b + d_{\\text{safety}} \\quad (1.20\\,\\text{m})$$\n\n"
                        "$$\\mathbf{p}_k(t) \\in \\Omega_{\\text{HRI}} \\implies \\|\\dot{\\mathbf{p}}_k(t)\\|_2 \\le 0.40\\,\\text{m/s}$$"
                    ),
                    "operationId": "solveTier4",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Tier4KinematicsRequest"},
                                "examples": {
                                    "HighFidelity10Hz": {
                                        "summary": "10Hz Discretization (Production Default)",
                                        "value": {"discretization_step_s": 0.1, "max_velocity_mps": 1.5, "max_acceleration_mps2": 1.0}
                                    },
                                    "FineFidelity50Hz": {
                                        "summary": "50Hz Discretization (Safety Critical)",
                                        "value": {"discretization_step_s": 0.02, "max_velocity_mps": 1.5, "max_acceleration_mps2": 1.0}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Kinematic trajectories count, time horizon, and HRI throttle events.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Tier4KinematicsResponse"},
                                    "example": {
                                        "total_trajectories_count": 4,
                                        "time_horizon_sec": 949.3,
                                        "corridor_reservations_count": 48,
                                        "hri_speed_throttle_events": 2
                                    }
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 4: VALIDATION GATES
            # =========================================================================
            "/api/v1/gates/validate": {
                "post": {
                    "tags": ["Invariant Validation Gates & Recourse"],
                    "summary": "Validate Invariant Gate (1, 2, 3, or 4)",
                    "description": (
                        "### Operational & Mathematical Meaning\n"
                        "Executes rigorous mathematical invariant validation against physical, spatial, and temporal boundaries:\n"
                        "$$g_1 = \\sigma^2_{\\text{chute}} - 1.50 \\le 0, \\qquad g_2 = t_{\\text{drop}}(i) - t_{\\text{drop}}(j) \\le 0$$\n\n"
                        "$$g_3 = t_i - l_i \\le 0, \\qquad g_4 = d_{\\text{safety}} - \\|\\mathbf{p}_a(t) - \\mathbf{p}_b(t)\\|_2 \\le 0$$\n\n"
                        "$$\\text{Benders Feasibility Cut:} \\quad \\sum_{i,j \\in \\mathcal{V}_{\\text{viol}}} x_{ij} \\le |\\mathcal{V}_{\\text{viol}}| - 1$$\n\n"
                        "- **Gate 1 (Capacity & Chute Buffer Inflow)**: Bounded accumulation chute buffers $\\sigma^2_{\\text{chute}} \\le 1.50$ and vehicle mass/volume limits.\n"
                        "- **Gate 2 (3D Stability & LIFO DAG)**: Center-of-gravity stability and acyclicity of item unstacking sequence: $\\operatorname{cycle}(\\mathcal{G}_{\\text{LIFO}}) = \\emptyset$.\n"
                        "- **Gate 3 (Dynamic Time Windows & Subtours)**: Arrival feasibility $t_i \\in [e_i, l_i]$ and subtour elimination MTZ constraints.\n"
                        "- **Gate 4 (Kinematic Non-Overlap & Headway)**: Continuous Euclidean clearance $\\|\\mathbf{p}_a(t) - \\mathbf{p}_b(t)\\| \\ge 1.20\\,\\text{m}$.\n\n"
                        "If violations are detected, returns violation codes and recommended **Benders cuts** for automatic recourse injection."
                    ),
                    "operationId": "validateGate",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/GateValidationRequest"},
                                "examples": {
                                    "ValidateGate1Capacity": {
                                        "summary": "Gate 1: Capacity & Chute Balance Check",
                                        "value": {
                                            "gate_number": 1,
                                            "scenario_id": "SCEN-D148745B",
                                            "validation_payload": {"chute_variance": 0.45, "max_vehicle_mass_kg": 142.0, "mass_limit_kg": 150.0}
                                        }
                                    },
                                    "ValidateGate2LIFO": {
                                        "summary": "Gate 2: 3D Stability & LIFO DAG Check",
                                        "value": {
                                            "gate_number": 2,
                                            "scenario_id": "SCEN-D148745B",
                                            "validation_payload": {"is_acyclic": True, "min_support_surface_ratio": 0.88, "cog_height_m": 0.42}
                                        }
                                    },
                                    "ValidateGate3TimeWindows": {
                                        "summary": "Gate 3: Temporal Deadlines Check",
                                        "value": {
                                            "gate_number": 3,
                                            "scenario_id": "SCEN-D148745B",
                                            "validation_payload": {"late_deliveries_count": 0, "max_deadline_margin_sec": 12.5}
                                        }
                                    },
                                    "ValidateGate4Kinematics": {
                                        "summary": "Gate 4: Kinematic Clearance & Headway Check",
                                        "value": {
                                            "gate_number": 4,
                                            "scenario_id": "SCEN-D148745B",
                                            "validation_payload": {"min_fleet_clearance_m": 1.35, "headway_violation_count": 0}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Validation result with violation codes and Benders cuts.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/GateValidationResponse"},
                                    "example": {
                                        "gate_number": 1,
                                        "gate_name": "Gate 1: Capacity & Chute Balance",
                                        "is_valid": True,
                                        "violation_codes": [],
                                        "metrics": {"chute_variance": 0.45, "status": "PASSED"}
                                    }
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 5: QUANTUM CO-PROCESSOR
            # =========================================================================
            "/api/v1/quantum/swap-test": {
                "post": {
                    "tags": ["Quantum Co-Processor (Classiq)"],
                    "summary": "Calculate Swap-Test Quantum State Fidelity",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Prepares two high-dimensional order feature states $|\\psi_a\\rangle$ and $|\\psi_b\\rangle$ on qubit registers. "
                        "Uses an ancilla qubit initialized in $|+\\rangle$ to execute controlled-SWAP operations:\n"
                        "$$P(\\text{ancilla} = |0\\rangle) = \\frac{1}{2} + \\frac{1}{2} |\\langle \\psi_a | \\psi_b \\rangle|^2$$\n"
                        "Returns the quantum state fidelity $\\mathcal{F} = |\\langle \\psi_a | \\psi_b \\rangle|^2$ and quantum distance "
                        "$D_Q = \\sqrt{2(1 - \\sqrt{\\mathcal{F}})}$ for non-Euclidean clustering."
                    ),
                    "operationId": "calculateSwapTestFidelity",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/SwapTestRequest"},
                                "examples": {
                                    "NearbyParcels": {
                                        "summary": "Nearby Picking Parcels (High Overlap)",
                                        "value": {
                                            "vector_a": [0.30, 0.40, 0.50, 0.60],
                                            "vector_b": [0.32, 0.38, 0.49, 0.61],
                                            "shots": 2048
                                        }
                                    },
                                    "DistantParcels": {
                                        "summary": "Opposing Facility Parcels (Low Overlap)",
                                        "value": {
                                            "vector_a": [0.90, 0.10, 0.85, 0.05],
                                            "vector_b": [0.05, 0.88, 0.10, 0.92],
                                            "shots": 2048
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Fidelity, quantum distance, and circuit execution metrics.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/SwapTestResponse"},
                                    "example": {
                                        "state_fidelity": 0.9982,
                                        "quantum_distance": 0.06,
                                        "shots_evaluated": 2048,
                                        "circuit_depth": 14,
                                        "qubits_used": 5,
                                        "execution_time_ms": 3.2
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/quantum/distance-matrix": {
                "post": {
                    "tags": ["Quantum Co-Processor (Classiq)"],
                    "summary": "Generate Pairwise Quantum Kernel Distance Matrix",
                    "description": (
                        "### Operational Meaning\n"
                        "Constructs the full $M \\times M$ pairwise quantum kernel distance matrix for an array of feature vectors. "
                        "Used by Tier 1 Quantum Fuzzy C-Means (SC-QFCM) to cluster orders based on quantum Hilbert space geometries."
                    ),
                    "operationId": "generateQuantumDistanceMatrix",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/QuantumDistanceMatrixRequest"},
                                "examples": {
                                    "ThreeWayKernel": {
                                        "summary": "3-Node Feature Matrix",
                                        "value": {
                                            "features": [
                                                [0.10, 0.20, 0.30],
                                                [0.12, 0.22, 0.28],
                                                [0.85, 0.90, 0.78]
                                            ],
                                            "shots": 1024
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Symmetric pairwise quantum distance matrix.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/QuantumDistanceMatrixResponse"},
                                    "example": {
                                        "dimension": 3,
                                        "distance_matrix": [
                                            [0.000, 0.045, 0.892],
                                            [0.045, 0.000, 0.876],
                                            [0.892, 0.876, 0.000]
                                        ],
                                        "total_circuits_simulated": 3
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/quantum/qaoa-subtour": {
                "post": {
                    "tags": ["Quantum Co-Processor (Classiq)"],
                    "summary": "Solve QAOA VRP Subtour Circuit (Ising Formulation)",
                    "description": (
                        "### Mathematical Formulation\n"
                        "Encodes the Traveling Salesperson subtour problem into a problem Hamiltonian $H_C$:\n"
                        "$$H_C = \\sum_{i=1}^n \\sum_{j \\ne i}^n c_{ij} \\, Z_i Z_j + A H_{\\text{penalty}}$$\n\n"
                        "$$\\text{Classiq QAOA Ansatz:} \\quad |\\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta})\\rangle = "
                        "\\prod_{l=1}^p \\left( e^{-i \\beta_l H_M} e^{-i \\gamma_l H_C} \\right) |+\\rangle^{\\otimes n}, "
                        "\\qquad H_M = \\sum_{j=1}^n \\sigma_j^x$$\n\n"
                        "$$\\min_{\\boldsymbol{\\gamma}, \\boldsymbol{\\beta}} \\quad \\langle H_C \\rangle = "
                        "\\langle \\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta}) \\mid H_C \\mid \\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta}) \\rangle$$\n\n"
                        "Applies classical COBYLA variational parameter optimization to minimize expectation $\\langle H_C \\rangle$ and samples the optimal subtour bitstring."
                    ),
                    "operationId": "solveQAOASubtour",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/QAOASubtourRequest"},
                                "examples": {
                                    "FourNodeSubtour": {
                                        "summary": "4-Node Picking Subtour Matrix",
                                        "value": {
                                            "cost_matrix": [
                                                [0.0, 12.5, 18.2, 9.4],
                                                [12.5, 0.0, 14.1, 11.0],
                                                [18.2, 14.1, 0.0, 15.6],
                                                [9.4, 11.0, 15.6, 0.0]
                                            ],
                                            "p_steps": 2,
                                            "shots": 2048
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Optimal node sequence, variational ground-state energy, and circuit telemetry.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/QAOASubtourResponse"},
                                    "example": {
                                        "optimal_sequence": [0, 3, 1, 2, 0],
                                        "subtour_cost": 50.1,
                                        "best_bitstring": "100110",
                                        "variational_energy": -42.85,
                                        "shannon_entropy": 2.14,
                                        "circuit_width_qubits": 16,
                                        "circuit_depth": 48,
                                        "cx_gate_count": 64
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/quantum/utilization": {
                "get": {
                    "tags": ["Quantum Co-Processor (Classiq)"],
                    "summary": "Get Quantum Co-Processor Hardware Utilization",
                    "description": (
                        "### Operational Meaning\n"
                        "Reports live telemetry on the 32-qubit register allocation, gate counts, depth, fidelity, "
                        "transpilation level, and simulated quantum backend target (e.g. Aer simulator vs IBM Quantum Eagle/Heron)."
                    ),
                    "operationId": "getQuantumUtilization",
                    "parameters": [
                        {"name": "run_id", "in": "query", "schema": {"type": "string"}, "description": "Optional execution run ID to query historic utilization"}
                    ],
                    "responses": {
                        "200": {
                            "description": "Quantum co-processor utilization statistics.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/QuantumUtilizationResponse"}
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 6: BENCHMARKS
            # =========================================================================
            "/api/v1/benchmarks/compare": {
                "post": {
                    "tags": ["Comparative Benchmarks"],
                    "summary": "Run 4-Way Algorithmic Benchmark",
                    "description": (
                        "### Operational & Scientific Meaning\n"
                        "Executes identical order pools across 4 algorithmic tiers:\n"
                        "1. **FIFO Greedy Baseline**: First-in, first-out allocation.\n"
                        "2. **Hard K-Means + MTZ**: Standard classical spatial clustering.\n"
                        "3. **Classical SC-QFCM + HGS-ADC**: High-grade classical heuristic.\n"
                        "4. **Classiq Quantum Hybrid**: 32Q QAOA + Quantum Fuzzy C-Means.\n\n"
                        "Computes comparative makespan reduction, fleet distance saved, chute variance, and speedup factors."
                    ),
                    "operationId": "runComparativeBenchmark",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/BenchmarkRunRequest"},
                                "examples": {
                                    "QuickBenchmark40": {
                                        "summary": "Quick Benchmark (40 Orders)",
                                        "value": {"scenario_id": None, "num_orders": 40, "num_vehicles": 4, "seed": 42}
                                    },
                                    "StressBenchmark100": {
                                        "summary": "Heavy Benchmark (100 Orders)",
                                        "value": {"scenario_id": None, "num_orders": 100, "num_vehicles": 6, "seed": 101}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Comparative benchmark report.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/BenchmarkComparisonResponse"},
                                    "example": {
                                        "scenario_id": "SCEN-BENCH-01",
                                        "algorithms_evaluated": ["FIFO", "HARD_KMEANS", "CLASSICAL_SC_QFCM", "CLASSIQ_QUANTUM"],
                                        "makespan_by_algo": {"FIFO": 1280.4, "HARD_KMEANS": 1140.2, "CLASSICAL_SC_QFCM": 1050.1, "CLASSIQ_QUANTUM": 949.3},
                                        "distance_by_algo": {"FIFO": 5.42, "HARD_KMEANS": 4.80, "CLASSICAL_SC_QFCM": 4.25, "CLASSIQ_QUANTUM": 3.71},
                                        "chute_variance_by_algo": {"FIFO": 1.82, "HARD_KMEANS": 1.25, "CLASSICAL_SC_QFCM": 0.85, "CLASSIQ_QUANTUM": 0.45},
                                        "latency_by_algo": {"FIFO": 0.02, "HARD_KMEANS": 0.05, "CLASSICAL_SC_QFCM": 0.18, "CLASSIQ_QUANTUM": 0.14},
                                        "improvement_makespan_percent": 21.4,
                                        "improvement_distance_percent": 21.8
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/benchmarks/history": {
                "get": {
                    "tags": ["Comparative Benchmarks"],
                    "summary": "Query Historical Algorithmic Benchmarks",
                    "description": "Retrieves the chronological audit log of past 4-way comparative benchmark runs.",
                    "operationId": "getBenchmarkHistory",
                    "responses": {
                        "200": {
                            "description": "List of benchmark runs.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/BenchmarkHistoryResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/benchmarks/regression-test": {
                "post": {
                    "tags": ["Comparative Benchmarks"],
                    "summary": "Detect Algorithmic Performance Regression",
                    "description": (
                        "### Operational Meaning\n"
                        "Compares a candidate execution run against a golden baseline run. Flags regression if "
                        "makespan or latency increases by more than `threshold_percent` (default 5.0%)."
                    ),
                    "operationId": "detectRegression",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/RegressionTestRequest"},
                                "examples": {
                                    "GoldenBaselineCheck": {
                                        "summary": "Compare Against Golden Baseline",
                                        "value": {
                                            "baseline_run_id": "RUN-933D5052",
                                            "candidate_run_id": "RUN-C094BAD5",
                                            "threshold_percent": 5.0
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Regression test evaluation.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/RegressionTestResponse"},
                                    "example": {
                                        "baseline_run_id": "RUN-933D5052",
                                        "candidate_run_id": "RUN-C094BAD5",
                                        "has_regressed": False,
                                        "makespan_delta_percent": -1.2,
                                        "latency_delta_percent": 0.5
                                    }
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 7: PRESENTATION & STREAMING
            # =========================================================================
            "/api/v1/presentation/hud/{wave_id}": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Get 6-Panel Executive Dashboard HUD",
                    "description": (
                        "### Operational Meaning\n"
                        "Consolidates executive KPI metrics for a completed wave: fleet makespan, total distance, "
                        "chute variance, cargo density percentage, HRI speed throttling events, and falsification ratio $\\Phi$."
                    ),
                    "operationId": "getDashboardHUD",
                    "parameters": [
                        {"name": "wave_id", "in": "path", "required": True, "schema": {"type": "string", "example": "WAVE-2DA292A7"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Consolidated executive HUD payload.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/DashboardHUDResponse"},
                                    "example": {
                                        "wave_id": "WAVE-2DA292A7",
                                        "operational_mode": "QUANTUM",
                                        "total_fleet_makespan_sec": 949.3,
                                        "total_distance_km": 3.706,
                                        "chute_balance_variance": 0.45,
                                        "pack_volume_density_percent": 78.5,
                                        "hri_throttle_events": 2,
                                        "falsification_ratio_phi": 0.880,
                                        "simulation_frames_count": 200
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/presentation/frames/{run_id}": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Get Simulation Animation Frames (Time-Series)",
                    "description": "Retrieves 10Hz/20Hz time-series vehicle poses $(x, y, \\theta)$, velocity, battery SoC, and chute buffer levels.",
                    "operationId": "getSimulationFrames",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}},
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 200}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Time-series simulation frames array.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/SimulationFramesResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/presentation/stream/{run_id}": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Server-Sent Events (SSE) Animation Frame Stream",
                    "description": "Real-time streaming endpoint yielding SSE frames (`text/event-stream`) for live 3D warehouse twin visualization.",
                    "operationId": "streamSimulationFrames",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Continuous text/event-stream.",
                            "content": {
                                "text/event-stream": {"schema": {"type": "string"}}
                            }
                        }
                    }
                }
            },
            "/api/v1/presentation/reports": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "List Produced Reports (PDF, JSON, CSV)",
                    "description": "Queries compiled audit reports and downloadable dossiers with cryptographic SHA-256 hashes.",
                    "operationId": "listProducedReports",
                    "parameters": [
                        {"name": "run_id", "in": "query", "schema": {"type": "string"}, "description": "Filter by run ID"},
                        {"name": "format", "in": "query", "schema": {"type": "string", "enum": ["ALL", "PDF", "JSON", "CSV"], "default": "ALL"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Reports index list.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ReportsListResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/presentation/reports/generate": {
                "post": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Generate PDF / JSON / CSV Dossier",
                    "description": (
                        "### Operational Meaning\n"
                        "Compiles formal warehouse mission documentation:\n"
                        "- **EXECUTIVE**: 2-page executive summary for plant managers.\n"
                        "- **COMPREHENSIVE**: 7-page technical dossier with proof certificates.\n"
                        "- **QUANTUM**: 3-page quantum monograph with Hamiltonian parameters.\n"
                        "- **SAFETY**: Safety audit certificate validating Invariant code `'lmn'`."
                    ),
                    "operationId": "generateReport",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ReportGenerateRequest"},
                                "examples": {
                                    "ExecutivePDF": {
                                        "summary": "Executive PDF Brief",
                                        "value": {"run_id": "RUN-933D5052", "profile": "EXECUTIVE", "format": "PDF"}
                                    },
                                    "ComprehensiveDossier": {
                                        "summary": "Comprehensive Audit Dossier",
                                        "value": {"run_id": "RUN-933D5052", "profile": "COMPREHENSIVE", "format": "PDF"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Report compiled successfully.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/ReportDetailResponse"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/presentation/reports/{report_id}/download": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Download Report Binary File",
                    "description": "Downloads the compiled PDF, CSV, or JSON document.",
                    "operationId": "downloadReportBinary",
                    "parameters": [
                        {"name": "report_id", "in": "path", "required": True, "schema": {"type": "string", "example": "REP-D3A1B49C"}}
                    ],
                    "responses": {
                        "200": {
                            "description": "Binary file payload (application/pdf, text/csv, or application/json).",
                            "content": {
                                "application/pdf": {"schema": {"type": "string", "format": "binary"}},
                                "text/csv": {"schema": {"type": "string"}},
                                "application/json": {"schema": {"type": "object"}}
                            }
                        },
                        "404": {"description": "Report not found."}
                    }
                }
            },
            "/api/v1/presentation/runs/{run_id}/graphs/{graph_type}": {
                "get": {
                    "tags": ["Presentation HUD & Simulation Streaming"],
                    "summary": "Render Dynamic Visualizer Chart (PNG)",
                    "description": (
                        "### Operational Meaning\n"
                        "Generates dynamic high-resolution PNG charts:\n"
                        "- **spatial**: Physical warehouse floor plan with vehicle routes.\n"
                        "- **lifo**: Directed Acyclic Graph (DAG) of item packing dependencies.\n"
                        "- **chutes**: Accumulation curves for staging chutes over time.\n"
                        "- **velocity**: AMR kinematic velocity profiles with HRI speed limit zones.\n"
                        "- **qaoa**: QAOA variational energy optimization landscape.\n"
                        "- **benders**: Benders cut convergence step chart."
                    ),
                    "operationId": "renderVisualizerChart",
                    "parameters": [
                        {"name": "run_id", "in": "path", "required": True, "schema": {"type": "string", "example": "RUN-933D5052"}},
                        {
                            "name": "graph_type",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string", "enum": ["spatial", "lifo", "chutes", "velocity", "qaoa", "benders"]},
                            "description": "Chart type to render"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Image binary payload (image/png).",
                            "content": {
                                "image/png": {"schema": {"type": "string", "format": "binary"}}
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 8: TELEMETRY & AUDIT
            # =========================================================================
            "/api/v1/telemetry/audit": {
                "get": {
                    "tags": ["Telemetry & Falsification Audit"],
                    "summary": "Get Falsification Protocol Audit Trail",
                    "description": (
                        "### Mathematical & Verification Context\n"
                        "Retrieves immutable chronological falsification audit events certifying zero safety violations:\n"
                        "$$\\Phi = \\sum_{m=1}^4 w_m \\max\\left(0, g_m(\\mathbf{x}, t)\\right) = 0.000 < 1.000 "
                        "\\qquad [\\text{Cryptographic Invariant 'lmn' Certified}]$$\n\n"
                        "Enforces verification invariant code `'lmn'` and verifies that all spatial, temporal, chute, and battery bounds remain strictly within the Lyapunov stability envelope."
                    ),
                    "operationId": "getFalsificationAuditTrail",
                    "responses": {
                        "200": {
                            "description": "Falsification audit trail array.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/AuditTrailResponse"},
                                    "example": {
                                        "total_events": 5,
                                        "verification_code_enforced": "lmn",
                                        "events": [
                                            {
                                                "timestamp": "2026-09-14T12:00:00Z",
                                                "wave_id": "WAVE-2DA292A7",
                                                "falsification_ratio_phi": 0.880,
                                                "status": "CERTIFIED_INVARIANT_SAFE",
                                                "chute_variance": 0.45,
                                                "code": "lmn"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },

            # =========================================================================
            # TAG 9: SYSTEM HEALTH & DOCS
            # =========================================================================
            "/api/v1/health": {
                "get": {
                    "tags": ["System Health & Diagnostics"],
                    "summary": "System Health & Diagnostics",
                    "description": "Reports server health, uptime, operational mode, SQLite connectivity, and Classiq SDK readiness.",
                    "operationId": "getHealthStatus",
                    "responses": {
                        "200": {
                            "description": "Health status payload.",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/HealthStatusResponse"},
                                    "example": {
                                        "status": "healthy",
                                        "engine_name": "DispatchEngine",
                                        "version": "1.0.0",
                                        "active_operational_mode": "QUANTUM",
                                        "database_connected": True,
                                        "classiq_sdk_available": True,
                                        "uptime_seconds": 128.4
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/config/limits": {
                "get": {
                    "tags": ["System Health & Diagnostics"],
                    "summary": "Get Physical & Operational Limits Specification",
                    "description": "Returns system physical bounds: maximum fleet size (100 AMRs), order capacity (35,000 orders), velocity bounds, and safety headways.",
                    "operationId": "getConfigLimits",
                    "responses": {
                        "200": {
                            "description": "Config limits payload.",
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object"}
                                }
                            }
                        }
                    }
                }
            },
            "/api/v1/database/download": {
                "get": {
                    "tags": ["System Health & Diagnostics"],
                    "summary": "Download Raw SQLite Database (`dispatchengine.db`)",
                    "description": "Streams raw SQLite3 database binary for external inspection, backups, or forensic audit.",
                    "operationId": "downloadRawDatabase",
                    "responses": {
                        "200": {
                            "description": "SQLite binary file download.",
                            "content": {
                                "application/vnd.sqlite3": {"schema": {"type": "string", "format": "binary"}}
                            }
                        }
                    }
                }
            },
            "/openapi.json": {
                "get": {
                    "tags": ["System Health & Diagnostics"],
                    "summary": "Get OpenAPI 3.1.0 JSON Specification",
                    "description": "Returns the complete OpenAPI 3.1.0 document in JSON format.",
                    "operationId": "getOpenApiSpecJson",
                    "responses": {
                        "200": {
                            "description": "OpenAPI 3.1.0 document.",
                            "content": {
                                "application/json": {"schema": {"type": "object"}}
                            }
                        }
                    }
                }
            }
        },

        # =========================================================================
        # COMPONENTS & SCHEMAS
        # =========================================================================
        "components": {
            "schemas": {
                "MockScenarioCreateRequest": {
                    "type": "object",
                    "description": "Configuration payload for synthesizing warehouse scenarios.",
                    "properties": {
                        "scenario_name": {
                            "type": "string",
                            "description": "Human-readable scenario title",
                            "example": "Wave-2026-Pareto-ZoneA"
                        },
                        "archetype": {
                            "type": "string",
                            "enum": [
                                "UNIFORM_RANDOM",
                                "PARETO_HOT_ZONE",
                                "DUAL_DEPOT_CROSS_DOCK",
                                "PEAK_SURGE_HEAVY_TAIL",
                                "HAZMAT_SEGREGATION",
                                "HRI_STOCHASTIC_BOTTLENECK",
                                "ENTERPRISE_SCALE_STRESS"
                            ],
                            "default": "PARETO_HOT_ZONE",
                            "description": "Warehouse physical layout and demand archetype"
                        },
                        "num_orders": {"type": "integer", "minimum": 10, "maximum": 35000, "default": 80, "description": "Number of customer order lines to synthesize"},
                        "num_vehicles": {"type": "integer", "minimum": 1, "maximum": 100, "default": 4, "description": "AMR fleet size"},
                        "num_depots": {"type": "integer", "minimum": 1, "maximum": 10, "default": 2, "description": "Number of depot origin hubs"},
                        "num_chutes": {"type": "integer", "minimum": 1, "maximum": 10, "default": 2, "description": "Number of packing consolidation chutes"},
                        "hazard_ratio": {"type": "number", "minimum": 0.0, "maximum": 1.0, "default": 0.10, "description": "Fraction of orders carrying hazardous chemicals"},
                        "seed": {"type": "integer", "default": 42, "description": "Random seed for reproducible spatial placement"}
                    },
                    "required": ["scenario_name"]
                },
                "ScenarioDetailResponse": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string", "example": "SCEN-D148745B"},
                        "name": {"type": "string", "example": "Wave-2026-Pareto-ZoneA"},
                        "archetype": {"type": "string", "example": "PARETO_HOT_ZONE"},
                        "created_at": {"type": "string", "example": "2026-09-14T12:00:00Z"},
                        "random_seed": {"type": "integer", "example": 42},
                        "order_count": {"type": "integer", "example": 80},
                        "fleet_size": {"type": "integer", "example": 4},
                        "depot_count": {"type": "integer", "example": 2},
                        "chute_count": {"type": "integer", "example": 2},
                        "is_mock": {"type": "boolean", "example": True}
                    },
                    "required": ["scenario_id", "name", "order_count", "fleet_size"]
                },
                "OrderLineSchema": {
                    "type": "object",
                    "description": "Detailed order picking specification.",
                    "properties": {
                        "order_id": {"type": "string", "example": "ORD_00001"},
                        "sku_id": {"type": "string", "example": "SKU_4912"},
                        "depot_id": {"type": "string", "example": "DEPOT_1"},
                        "aisle_id": {"type": "string", "example": "AISLE_02"},
                        "pickup_pos": {
                            "type": "object",
                            "properties": {
                                "x": {"type": "number", "example": 12.5},
                                "y": {"type": "number", "example": 18.0},
                                "z": {"type": "number", "example": 1.6}
                            }
                        },
                        "drop_chute_id": {"type": "string", "example": "CHUTE_1"},
                        "mass_kg": {"type": "number", "example": 4.2},
                        "volume_m3": {"type": "number", "example": 0.0125},
                        "dimensions_m": {
                            "type": "object",
                            "properties": {
                                "length": {"type": "number", "example": 0.35},
                                "width": {"type": "number", "example": 0.25},
                                "height": {"type": "number", "example": 0.14}
                            }
                        },
                        "open_window_start": {"type": "number", "example": 0.0},
                        "drop_deadline": {"type": "number", "example": 380.0},
                        "hazard_class": {"type": "string", "example": "NONE"},
                        "sla_priority": {"type": "number", "example": 0.85}
                    }
                },
                "ScenarioDatasetResponse": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string", "example": "SCEN-D148745B"},
                        "metadata": {"$ref": "#/components/schemas/ScenarioDetailResponse"},
                        "orders": {"type": "array", "items": {"$ref": "#/components/schemas/OrderLineSchema"}},
                        "depots": {"type": "array", "items": {"type": "object"}},
                        "chutes": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "ArchetypeListResponse": {
                    "type": "object",
                    "properties": {
                        "archetypes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "archetype_key": {"type": "string"},
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "stress_target": {"type": "string"}
                                }
                            }
                        }
                    }
                },
                "WaveDispatchRequest": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string", "nullable": True, "example": "SCEN-D148745B"},
                        "num_orders": {"type": "integer", "default": 80},
                        "num_vehicles": {"type": "integer", "default": 4},
                        "operational_mode": {
                            "type": "string",
                            "enum": ["NORMAL", "AGILITY", "DEGRADED_RECOVERY", "EMERGENCY_RECEDE", "HIGH_THROUGHPUT", "QUANTUM", "CLASSICAL"],
                            "default": "QUANTUM"
                        },
                        "mode": {"type": "string", "enum": ["32Q", "CPU"], "default": "32Q"},
                        "seed": {"type": "integer", "default": 42},
                        "enable_benders_recourse": {"type": "boolean", "default": True},
                        "quantum_config": {
                            "type": "object",
                            "properties": {
                                "shots": {"type": "integer", "default": 2048},
                                "p_steps": {"type": "integer", "default": 2},
                                "transpilation_level": {"type": "integer", "default": 2}
                            }
                        }
                    }
                },
                "WaveDispatchResponse": {
                    "type": "object",
                    "properties": {
                        "run_id": {"type": "string", "example": "RUN-933D5052"},
                        "scenario_id": {"type": "string", "example": "SCEN-D148745B"},
                        "wave_id": {"type": "string", "example": "WAVE-2DA292A7"},
                        "operational_mode": {"type": "string", "example": "QUANTUM"},
                        "mode": {"type": "string", "example": "32Q"},
                        "algorithm_ranks_used": {"type": "object"},
                        "total_fleet_makespan_sec": {"type": "number", "example": 949.3},
                        "total_distance_km": {"type": "number", "example": 3.706},
                        "chute_balance_variance": {"type": "number", "example": 0.45},
                        "total_solve_latency_sec": {"type": "number", "example": 0.14},
                        "falsification_ratio_phi": {"type": "number", "example": 0.880},
                        "is_falsified": {"type": "boolean", "example": False},
                        "routes": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "ExecutionRunsListResponse": {
                    "type": "object",
                    "properties": {
                        "runs_count": {"type": "integer", "example": 1},
                        "runs": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "RunExplanationResponse": {
                    "type": "object",
                    "properties": {
                        "run_id": {"type": "string", "example": "RUN-933D5052"},
                        "scenario_id": {"type": "string", "example": "SCEN-D148745B"},
                        "operational_mode": {"type": "string", "example": "QUANTUM"},
                        "executive_summary": {"type": "string"},
                        "mock_data": {"type": "string"},
                        "tiers": {"type": "object"},
                        "algorithms": {"type": "object"},
                        "classical_vs_quantum": {"type": "string"},
                        "verification_invariant": {"type": "object"}
                    }
                },
                "RunComparisonDiffResponse": {
                    "type": "object",
                    "properties": {
                        "baseline_run": {"type": "object"},
                        "candidate_run": {"type": "object"},
                        "makespan_delta_sec": {"type": "number", "example": -100.8},
                        "makespan_improvement_percent": {"type": "number", "example": 9.6},
                        "distance_delta_km": {"type": "number", "example": -0.54},
                        "distance_improvement_percent": {"type": "number", "example": 12.7},
                        "energy_saved_kwh": {"type": "number", "example": 0.994}
                    }
                },
                "SwapTestRequest": {
                    "type": "object",
                    "properties": {
                        "vector_a": {"type": "array", "items": {"type": "number"}, "example": [0.3, 0.4, 0.5, 0.6]},
                        "vector_b": {"type": "array", "items": {"type": "number"}, "example": [0.32, 0.38, 0.49, 0.61]},
                        "shots": {"type": "integer", "default": 2048}
                    },
                    "required": ["vector_a", "vector_b"]
                },
                "SwapTestResponse": {
                    "type": "object",
                    "properties": {
                        "state_fidelity": {"type": "number", "example": 0.9982},
                        "quantum_distance": {"type": "number", "example": 0.06},
                        "shots_evaluated": {"type": "integer", "example": 2048},
                        "circuit_depth": {"type": "integer", "example": 14},
                        "qubits_used": {"type": "integer", "example": 5},
                        "execution_time_ms": {"type": "number", "example": 3.2}
                    }
                },
                "QuantumDistanceMatrixRequest": {
                    "type": "object",
                    "properties": {
                        "features": {
                            "type": "array",
                            "items": {"type": "array", "items": {"type": "number"}}
                        },
                        "shots": {"type": "integer", "default": 1024}
                    }
                },
                "QuantumDistanceMatrixResponse": {
                    "type": "object",
                    "properties": {
                        "dimension": {"type": "integer", "example": 3},
                        "distance_matrix": {
                            "type": "array",
                            "items": {"type": "array", "items": {"type": "number"}}
                        },
                        "total_circuits_simulated": {"type": "integer", "example": 6}
                    }
                },
                "QAOASubtourRequest": {
                    "type": "object",
                    "properties": {
                        "cost_matrix": {
                            "type": "array",
                            "items": {"type": "array", "items": {"type": "number"}}
                        },
                        "p_steps": {"type": "integer", "default": 2},
                        "shots": {"type": "integer", "default": 2048}
                    }
                },
                "QAOASubtourResponse": {
                    "type": "object",
                    "properties": {
                        "optimal_sequence": {"type": "array", "items": {"type": "integer"}, "example": [0, 3, 1, 2, 0]},
                        "subtour_cost": {"type": "number", "example": 50.1},
                        "best_bitstring": {"type": "string", "example": "100110"},
                        "variational_energy": {"type": "number", "example": -42.85},
                        "shannon_entropy": {"type": "number", "example": 2.14},
                        "circuit_width_qubits": {"type": "integer", "example": 16},
                        "circuit_depth": {"type": "integer", "example": 48},
                        "cx_gate_count": {"type": "integer", "example": 64}
                    }
                },
                "QuantumUtilizationResponse": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "example": "ONLINE"},
                        "operational_mode": {"type": "string", "example": "QUANTUM"},
                        "total_qubits_allocated": {"type": "integer", "example": 32},
                        "total_shots_executed": {"type": "integer", "example": 1024},
                        "circuit_depth": {"type": "integer", "example": 48},
                        "two_qubit_gate_count": {"type": "integer", "example": 36},
                        "single_qubit_gate_count": {"type": "integer", "example": 52},
                        "quantum_fidelity": {"type": "number", "example": 0.942},
                        "backend": {"type": "object"},
                        "qubit_register_allocation": {"type": "object"}
                    }
                },
                "GateValidationRequest": {
                    "type": "object",
                    "properties": {
                        "gate_number": {"type": "integer", "minimum": 1, "maximum": 4, "example": 1},
                        "scenario_id": {"type": "string", "nullable": True},
                        "validation_payload": {"type": "object"}
                    },
                    "required": ["gate_number"]
                },
                "GateValidationResponse": {
                    "type": "object",
                    "properties": {
                        "gate_number": {"type": "integer", "example": 1},
                        "gate_name": {"type": "string", "example": "Gate 1: Capacity & Chute Balance"},
                        "is_valid": {"type": "boolean", "example": True},
                        "violation_codes": {"type": "array", "items": {"type": "string"}},
                        "metrics": {"type": "object"}
                    }
                },
                "Tier1BatchingRequest": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string", "nullable": True},
                        "num_vehicles": {"type": "integer", "default": 4},
                        "use_quantum": {"type": "boolean", "default": True}
                    }
                },
                "Tier1BatchingResponse": {
                    "type": "object",
                    "properties": {
                        "wave_id": {"type": "string"},
                        "batches": {"type": "array", "items": {"type": "object"}},
                        "chute_balance_variance": {"type": "number", "example": 0.45},
                        "algorithm_used": {"type": "string", "example": "RANK_1Q_QUANTUM_FCM"}
                    }
                },
                "Tier2PackingRequest": {
                    "type": "object",
                    "properties": {
                        "batch_index": {"type": "integer", "default": 0},
                        "bay_dimensions_m": {"type": "array", "items": {"type": "number"}, "default": [1.2, 0.8, 1.0]},
                        "max_payload_kg": {"type": "number", "default": 150.0}
                    }
                },
                "Tier2PackingResponse": {
                    "type": "object",
                    "properties": {
                        "vehicle_id": {"type": "string", "example": "AMR_01"},
                        "total_packed_items": {"type": "integer", "example": 20},
                        "volume_utilization_ratio": {"type": "number", "example": 0.785},
                        "center_of_mass": {"type": "array", "items": {"type": "number"}},
                        "lifo_dag_edges_count": {"type": "integer", "example": 18},
                        "is_acyclic": {"type": "boolean", "example": True}
                    }
                },
                "Tier3RoutingRequest": {
                    "type": "object",
                    "properties": {
                        "use_qaoa_subtour": {"type": "boolean", "default": True},
                        "p_steps": {"type": "integer", "default": 2},
                        "shots": {"type": "integer", "default": 2048}
                    }
                },
                "Tier3RoutingResponse": {
                    "type": "object",
                    "properties": {
                        "total_fleet_makespan_sec": {"type": "number", "example": 949.3},
                        "total_distance_km": {"type": "number", "example": 3.706},
                        "routes_count": {"type": "integer", "example": 4}
                    }
                },
                "Tier4KinematicsRequest": {
                    "type": "object",
                    "properties": {
                        "discretization_step_s": {"type": "number", "default": 0.1},
                        "max_velocity_mps": {"type": "number", "default": 1.5},
                        "max_acceleration_mps2": {"type": "number", "default": 1.0}
                    }
                },
                "Tier4KinematicsResponse": {
                    "type": "object",
                    "properties": {
                        "total_trajectories_count": {"type": "integer", "example": 4},
                        "time_horizon_sec": {"type": "number", "example": 949.3},
                        "corridor_reservations_count": {"type": "integer", "example": 48},
                        "hri_speed_throttle_events": {"type": "integer", "example": 2}
                    }
                },
                "BenchmarkRunRequest": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string", "nullable": True},
                        "num_orders": {"type": "integer", "default": 40},
                        "num_vehicles": {"type": "integer", "default": 4},
                        "seed": {"type": "integer", "default": 42}
                    }
                },
                "BenchmarkComparisonResponse": {
                    "type": "object",
                    "properties": {
                        "scenario_id": {"type": "string"},
                        "algorithms_evaluated": {"type": "array", "items": {"type": "string"}},
                        "makespan_by_algo": {"type": "object"},
                        "distance_by_algo": {"type": "object"},
                        "chute_variance_by_algo": {"type": "object"},
                        "latency_by_algo": {"type": "object"},
                        "improvement_makespan_percent": {"type": "number", "example": 21.4},
                        "improvement_distance_percent": {"type": "number", "example": 21.8}
                    }
                },
                "BenchmarkHistoryResponse": {
                    "type": "object",
                    "properties": {
                        "benchmarks": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "RegressionTestRequest": {
                    "type": "object",
                    "properties": {
                        "baseline_run_id": {"type": "string", "example": "RUN-933D5052"},
                        "candidate_run_id": {"type": "string", "example": "RUN-C094BAD5"},
                        "threshold_percent": {"type": "number", "default": 5.0}
                    },
                    "required": ["baseline_run_id", "candidate_run_id"]
                },
                "RegressionTestResponse": {
                    "type": "object",
                    "properties": {
                        "baseline_run_id": {"type": "string"},
                        "candidate_run_id": {"type": "string"},
                        "has_regressed": {"type": "boolean", "example": False},
                        "makespan_delta_percent": {"type": "number", "example": -1.2},
                        "latency_delta_percent": {"type": "number", "example": 0.5}
                    }
                },
                "DashboardHUDResponse": {
                    "type": "object",
                    "properties": {
                        "wave_id": {"type": "string", "example": "WAVE-2DA292A7"},
                        "operational_mode": {"type": "string", "example": "QUANTUM"},
                        "total_fleet_makespan_sec": {"type": "number", "example": 949.3},
                        "total_distance_km": {"type": "number", "example": 3.706},
                        "chute_balance_variance": {"type": "number", "example": 0.45},
                        "pack_volume_density_percent": {"type": "number", "example": 78.5},
                        "hri_throttle_events": {"type": "integer", "example": 2},
                        "falsification_ratio_phi": {"type": "number", "example": 0.880},
                        "simulation_frames_count": {"type": "integer", "example": 200}
                    }
                },
                "SimulationFramesResponse": {
                    "type": "object",
                    "properties": {
                        "wave_id": {"type": "string", "example": "WAVE-2DA292A7"},
                        "total_frames": {"type": "integer", "example": 200},
                        "sampling_rate_hz": {"type": "number", "example": 10.0},
                        "duration_sec": {"type": "number", "example": 20.0},
                        "frames": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "ReportsListResponse": {
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer", "example": 3},
                        "reports": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "ReportGenerateRequest": {
                    "type": "object",
                    "properties": {
                        "run_id": {"type": "string", "example": "RUN-933D5052"},
                        "profile": {"type": "string", "enum": ["EXECUTIVE", "COMPREHENSIVE", "QUANTUM", "SAFETY"], "default": "EXECUTIVE"},
                        "format": {"type": "string", "enum": ["PDF", "JSON", "CSV"], "default": "PDF"},
                        "custom_title": {"type": "string", "nullable": True}
                    },
                    "required": ["run_id"]
                },
                "ReportDetailResponse": {
                    "type": "object",
                    "properties": {
                        "success": {"type": "boolean", "example": True},
                        "report": {"type": "object"}
                    }
                },
                "AuditTrailResponse": {
                    "type": "object",
                    "properties": {
                        "total_events": {"type": "integer", "example": 5},
                        "verification_code_enforced": {"type": "string", "example": "lmn"},
                        "events": {"type": "array", "items": {"type": "object"}}
                    }
                },
                "HealthStatusResponse": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "example": "healthy"},
                        "engine_name": {"type": "string", "example": "DispatchEngine"},
                        "version": {"type": "string", "example": "1.0.0"},
                        "active_operational_mode": {"type": "string", "example": "QUANTUM"},
                        "database_connected": {"type": "boolean", "example": True},
                        "classiq_sdk_available": {"type": "boolean", "example": True},
                        "uptime_seconds": {"type": "number", "example": 128.4}
                    }
                }
            }
        }
    }


def export_openapi_json(indent: int = 2, current_host: Optional[str] = None, port: int = 8080) -> str:
    """Returns formatted JSON string of the complete OpenAPI 3.1.0 specification."""
    return json.dumps(generate_openapi_spec(current_host=current_host, port=port), indent=indent)
