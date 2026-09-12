import React, { useState, useEffect } from 'react';
import {
  fetchDataset,
  createOrder,
  updateOrder,
  deleteOrder,
  cloneScenario,
  generateScenario,
  CONFIG_LIMITS,
  ParameterLimitSpec,
  DatasetDTO,
  OrderDTO,
} from '../services/api';
import { ParameterCard } from './ParameterCard';
import { CodeLmnBadge } from './CodeLmnBadge';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Copy,
  RefreshCw,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Box,
  MapPin,
  Play,
  Sliders,
  Sparkles,
  RotateCcw,
  X,
  Wand2,
  Check,
  Volume2,
  VolumeX,
  BookOpen,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  ArrowRight,
} from 'lucide-react';

interface DatasetStudioProps {
  scenarioId: string;
  onSelectScenario: (scenId: string) => void;
  onDispatchDataset: (scenId: string) => void;
}

export const DatasetStudio: React.FC<DatasetStudioProps> = ({
  scenarioId,
  onSelectScenario,
  onDispatchDataset,
}) => {
  const [dataset, setDataset] = useState<DatasetDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hazardFilter, setHazardFilter] = useState('ALL');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderDTO | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  // New Order Form State
  const [newOrder, setNewOrder] = useState<Partial<OrderDTO>>({
    sku_id: 'SKU-NEW-01',
    depot_id: 'DEPOT_1',
    aisle_id: 'AISLE-01',
    pickup_pos: [12.0, 15.0, 1.2],
    drop_chute_id: 'CHUTE_1',
    mass_kg: 8.5,
    volume_m3: 0.05,
    open_window_start: 0,
    drop_deadline: 480,
    hazard_class: 'NONE',
    is_atomic: true,
  });

  // Pre-requested Generator Parameters State
  const [generateParams, setGenerateParams] = useState({
    scenario_name: `WAVE-RAND-${Math.floor(Math.random() * 9000 + 1000)}`,
    archetype: 'MEGA_FULFILLMENT_E_COMMERCE',
    num_orders: 25,
    num_vehicles: 4,
    num_depots: 2,
    num_chutes: 4,
    hazard_ratio: 15.0,
    seed: 42,
  });

  // Pre-requested Generator Limits & Defaults Specs
  const generateSpecs: Record<string, ParameterLimitSpec> = {
    num_orders: CONFIG_LIMITS.num_orders || {
      min: 5,
      max: 150,
      step: 1,
      default: 25,
      unit: 'orders',
      category: 'Orders',
    },
    num_vehicles: CONFIG_LIMITS.fleet_size || {
      min: 2,
      max: 16,
      step: 1,
      default: 4,
      unit: 'AMRs',
      category: 'Kinematics',
    },
    num_depots: {
      min: 1,
      max: 6,
      step: 1,
      default: 2,
      unit: 'depots',
      category: 'Facility',
    },
    num_chutes: {
      min: 2,
      max: 12,
      step: 1,
      default: 4,
      unit: 'chutes',
      category: 'Facility',
    },
    hazard_ratio: {
      min: 0.0,
      max: 60.0,
      step: 5.0,
      default: 15.0,
      unit: '%',
      category: 'Orders',
    },
  };

  const generatePresets = [
    {
      id: 'QUICK',
      name: '⚡ Quick Benchmark',
      desc: '15 Orders, 3 AMRs, 2 Depots, Uniform',
      apply: () =>
        setGenerateParams((prev) => ({
          ...prev,
          num_orders: 15,
          num_vehicles: 3,
          num_depots: 2,
          num_chutes: 2,
          hazard_ratio: 10,
          archetype: 'UNIFORM_RANDOM',
        })),
    },
    {
      id: 'STANDARD',
      name: '📦 Standard E-Commerce',
      desc: '25 Orders, 4 AMRs, 2 Depots, 4 Chutes',
      apply: () =>
        setGenerateParams((prev) => ({
          ...prev,
          num_orders: 25,
          num_vehicles: 4,
          num_depots: 2,
          num_chutes: 4,
          hazard_ratio: 15,
          archetype: 'MEGA_FULFILLMENT_E_COMMERCE',
        })),
    },
    {
      id: 'SURGE',
      name: '🏢 Enterprise Surge',
      desc: '60 Orders, 8 AMRs, 4 Depots, 6 Chutes',
      apply: () =>
        setGenerateParams((prev) => ({
          ...prev,
          num_orders: 60,
          num_vehicles: 8,
          num_depots: 4,
          num_chutes: 6,
          hazard_ratio: 20,
          archetype: 'PEAK_SURGE_HEAVY_TAIL',
        })),
    },
    {
      id: 'HAZMAT',
      name: '🔥 Hazmat Heavy',
      desc: '20 Orders, 4 AMRs, 45% Hazmat ADR',
      apply: () =>
        setGenerateParams((prev) => ({
          ...prev,
          num_orders: 20,
          num_vehicles: 4,
          num_depots: 2,
          num_chutes: 3,
          hazard_ratio: 45,
          archetype: 'HAZMAT_SEGREGATION',
        })),
    },
  ];

  const [selectedParamKey, setSelectedParamKey] = useState<string>('num_orders');
  const [paramSubPanelTab, setParamSubPanelTab] = useState<'meaning' | 'influence' | 'quantum' | 'limits'>('meaning');
  const [isParamSpeaking, setIsParamSpeaking] = useState<boolean>(false);
  const [isParamCopied, setIsParamCopied] = useState<boolean>(false);
  const [isParamSubPanelOpen, setIsParamSubPanelOpen] = useState<boolean>(true);

  const parameterExplanations: Record<string, {
    key: string;
    name: string;
    symbol: string;
    unit: string;
    logisticsRole: string;
    detailedMeaning: string;
    influenceTiers: {
      tier1: string;
      tier2: string;
      tier3: string;
      tier4: string;
    };
    quantumImpact: string;
    sensitivityGuidance: string;
    tradeoffs: string;
  }> = {
    num_orders: {
      key: 'num_orders',
      name: 'Order Pool Size',
      symbol: 'N',
      unit: 'orders',
      logisticsRole: 'Raw SKU pick demand volume released into the fulfillment wave',
      detailedMeaning:
        'Order Pool Size (N) determines the total quantity of customer orders, pick lists, and physical carton payloads synthesized into the dispatch wave. In industrial fulfillment centers, this controls the density of active picking tasks across high-bay storage racks. Higher order counts maximize batching economies of scale but increase combinatorial complexity across all downstream solvers.',
      influenceTiers: {
        tier1:
          'Directly dictates the dimension of the Fuzzy C-Means partition matrix U ∈ R^{N × K}. High N tests the macro-clustering solver’s capability to group orders into compact pick clusters without overloading single induction chute buffers.',
        tier2:
          'Increases parcel count competing for AMR cargo bay volume. Stricter physical packing requires deeper recursive checking of Invariant R10 (LIFO Acyclicity) to ensure that parcels for earlier customer delivery are never blocked underneath parcels for later delivery.',
        tier3:
          'Combinatorial explosion: Vehicle routing search space scales as O(N!). Larger N forces multi-depot tours to branch into split vehicle dispatches, driving total fleet makespan and testing AMR weight capacity limits (500 kg).',
        tier4:
          'Generates denser corridor transit traffic as AMRs execute pick stops across aisles, resulting in more frequent spatiotemporal obstacle reservations and potential intersection bottlenecks in SIPP.',
      },
      quantumImpact:
        'In Classiq SC-QFCM (Tier 1), order feature vectors are mapped into quantum registers with logarithmic depth O(log N). In Classiq QAOA (Tier 3), order nodes form the Ising spin Hamiltonian graph, requiring 32 qubits and 1024 measurement shots for combinatorial tour sampling.',
      sensitivityGuidance:
        'Nominal range: 10 to 60 orders. Values below 10 underutilize the AMR fleet and result in inefficient travel-to-pick ratios. Values above 60 represent high-surge conditions that test chute accumulation capacities (5.0 m³).',
      tradeoffs:
        'Increasing N improves vehicle payload fill rate (+15-20%) but increases total wave dispatch solve time and aisle collision risk.',
    },
    num_vehicles: {
      key: 'num_vehicles',
      name: 'AMR Fleet Size',
      symbol: 'V',
      unit: 'AMRs',
      logisticsRole: 'Available mobile robot concurrency and parallel aisle throughput',
      detailedMeaning:
        'AMR Fleet Size (V) specifies the number of active Autonomous Mobile Robots assigned to execute the picking wave. In warehouse operations, fleet size dictates concurrent material handling capacity, parallel transport bandwidth, and charging station turnover rates.',
      influenceTiers: {
        tier1:
          'Establishes the number of spatial wave clusters K = V. Each cluster corresponds to a dedicated AMR tour. Higher V yields tighter, localized pick clusters with reduced intra-cluster travel distance.',
        tier2:
          'Distributes 3D volumetric bin packing across V distinct robot cargo bays, allowing parallel loading operations without cross-vehicle payload interference.',
        tier3:
          'Directly compresses fleet makespan (T_makespan ≈ T_total / V). More vehicles allow simultaneous order execution, drastically reducing customer SLA latencies.',
        tier4:
          'High sensitivity! Crucial kinematic impact: More AMRs on the floor sharply increases multi-agent conflict density at 2-way aisle intersections, heavily exercising Priority-Based Search (PBS) and ISO 3691-4 safety speed throttling.',
      },
      quantumImpact:
        'Scales the number of vehicle tour sub-circuits and multi-depot conservation-of-flow constraint penalties within the Classiq QAOA variational ansatz.',
      sensitivityGuidance:
        'Nominal range: 2 to 8 AMRs. V = 1 creates a severe makespan bottleneck and single point of failure. V > 8 introduces aisle congestion, requiring conservative kinematic speed limits to maintain collision-free invariants (Φ < 1.0).',
      tradeoffs:
        'Adding AMRs reduces makespan (-30% to -50%) but increases total fleet battery consumption and corridor traffic conflict probability.',
    },
    num_depots: {
      key: 'num_depots',
      name: 'Depot Locations',
      symbol: 'D',
      unit: 'depots',
      logisticsRole: 'Multi-hub perimeter staging and battery exchange topology',
      detailedMeaning:
        'Depot Locations (D) governs the number of decentralized staging nodes, charging stations, and cross-dock transfer points situated along the warehouse perimeter. AMRs initiate their shifts at depots, return to deposit picked waves, and perform autonomous battery swaps.',
      influenceTiers: {
        tier1:
          'Partitions the facility into Voronoi-like attraction zones, steering order clusters toward the nearest or least-congested depot to eliminate wasteful cross-facility deadheading.',
        tier2:
          'Enforces depot-specific packing manifests, ensuring that parcel loading sequences conform to the outbound staging dock destination.',
        tier3:
          'Transforms standard routing into NP-Hard Multi-Depot VRPTW (MD-VRPTW), introducing conservation-of-flow constraints at D distinct origins and destinations.',
        tier4:
          'Disperses robot convergence zones away from a single chokepoint, decreasing entrance congestion around staging zones by up to 40%.',
      },
      quantumImpact:
        'Adds multi-depot boundary penalty terms into the QAOA cost Hamiltonian, requiring additional ancilla qubits to preserve tour closure constraints.',
      sensitivityGuidance:
        'Nominal range: 1 to 4 depots. D = 1 concentrates traffic into a single hub bottleneck. D ≥ 3 provides optimal distributed flow for mega-fulfillment centers with multi-aisle cross-docking.',
      tradeoffs:
        'More depots reduce total travel distance (-12-18%) but require balanced fleet charging and inventory distribution across hubs.',
    },
    num_chutes: {
      key: 'num_chutes',
      name: 'Consolidation Chutes',
      symbol: 'C',
      unit: 'chutes',
      logisticsRole: 'Outbound sorting drop stations with 5.0m³ buffer accumulation',
      detailedMeaning:
        'Consolidation Chutes (C) configures the number of automated sorter drop-off chutes equipped with 5.0 m³ physical accumulation buffers where AMRs discharge collected orders for downstream packaging and shipping.',
      influenceTiers: {
        tier1:
          'Directly influences the chute variance penalty λ_chute · Var(L_chute). Enforces Invariant R4 (chute induction variance σ²_chute ≤ 15%) to prevent downstream sorter starvation or jam overflows.',
        tier2:
          'Chute drop-off assignments dictate the final parcel unloading sequence, directly establishing the LIFO precedence graph inside the AMR cargo bay.',
        tier3:
          'Establishes the final delivery stop time windows for each route, ensuring balanced arrival pacing across all sorting lanes.',
        tier4:
          'Chute approaches are high-precision docking zones where AMRs decelerate to v ≤ 0.3 m/s, requiring dedicated space-time approach reservations.',
      },
      quantumImpact:
        'Chute balance constraints map into linear inequality penalties in the variational Hamiltonian, shaping the quantum ground state toward balanced wave distributions.',
      sensitivityGuidance:
        'Nominal range: 2 to 8 chutes. C < 3 risks chute buffer overflow (5.0 m³) and AMR queuing delays. C ≥ 6 supports high-throughput continuous wave sorting.',
      tradeoffs:
        'Higher chute counts distribute sorter workload evenly but require longer terminal distribution runs if chutes are physically spread out.',
    },
    hazard_ratio: {
      key: 'hazard_ratio',
      name: 'Hazardous Cargo Ratio',
      symbol: 'η_haz',
      unit: '%',
      logisticsRole: 'ADR dangerous goods regulation, quarantine, and safety standoff',
      detailedMeaning:
        'Hazardous Ratio (η_haz) defines the percentage of synthesized parcel orders containing flammable, corrosive, or toxic items requiring strict ADR regulatory segregation and dedicated handling protocols.',
      influenceTiers: {
        tier1:
          'Enforces quarantine partitioning during clustering, strictly preventing chemically reactive items from being assigned to the same pick cluster or shared AMR wave.',
        tier2:
          'Requires physical bay barriers and limits parcel stacking height to prevent box crushing or hazardous liquid leakage.',
        tier3:
          'Restricts hazardous AMRs to certified transit corridors, avoiding high-density manual picking aisles and enforcing strict maximum route durations.',
        tier4:
          'Expands human safety standoff buffer from 1.5m to 2.5m under ISO 3691-4, forcing kinematic speed throttling to v ≤ 0.4 m/s in shared corridors.',
      },
      quantumImpact:
        'Introduces hard exclusion oracle constraints in the quantum circuit, utilizing phase kicks to eliminate illegal hazardous co-assignment states.',
      sensitivityGuidance:
        'Nominal range: 0% to 30%. 0% represents standard retail e-commerce. Values > 30% trigger significant routing detours, increasing makespan by 25-35%.',
      tradeoffs:
        'Higher hazard ratios ensure regulatory safety and compliance but reduce AMR cargo fill rate and increase tour transit duration.',
    },
    seed: {
      key: 'seed',
      name: 'Stochastic Generator Seed',
      symbol: 'S',
      unit: 'seed',
      logisticsRole: 'Bit-exact deterministic reproducibility for benchmarking and testing',
      detailedMeaning:
        'Stochastic Seed (S) initializes the Mersenne Twister pseudo-random number generator. It deterministically controls parcel 3D dimensions, rack coordinate distributions, pick order deadlines, and SKU weights.',
      influenceTiers: {
        tier1: 'Controls exact spatial coordinate clustering and demand dispersion.',
        tier2: 'Determines the exact box dimensions and mass properties for 3D bin packing.',
        tier3: 'Defines the distance matrix and delivery time-window deadlines.',
        tier4: 'Sets the starting positions and arrival targets for AMR kinematic trajectory generation.',
      },
      quantumImpact:
        'Ensures that Quantum vs Classical solver comparisons evaluate identical physical problem instances, validating quantum speedup metrics rigorously.',
      sensitivityGuidance:
        'Any integer between 0 and 999999. Use the Randomize button to test varied random topologies or enter a fixed seed to replicate benchmark tests.',
      tradeoffs:
        'Deterministic seeds allow repeatable debugging and regression validation without stochastic variance.',
    },
    archetype: {
      key: 'archetype',
      name: 'Facility Archetype Topology',
      symbol: 'A',
      unit: 'type',
      logisticsRole: 'Industrial warehouse layout, rack spacing, and demand distribution',
      detailedMeaning:
        'Facility Archetype defines the physical architecture of the warehouse, including rack layout, aisle widths, pick station densities, and pedestrian corridor placements (e.g. Mega E-Commerce Fulfillment, Pareto 80/20 Hot Zone, Dual-Depot Cross-Dock, Peak Surge Wave, Hazmat Segregation).',
      influenceTiers: {
        tier1: 'Shapes spatial clustering boundaries according to facility floor layout.',
        tier2: 'Sets packaging dimension standards and weight categories for storage bins.',
        tier3: 'Defines aisle connectivity graphs and multi-depot routing topologies.',
        tier4: 'Establishes speed zones, intersection clearances, and ISO 3691-4 pedestrian zones.',
      },
      quantumImpact:
        'Determines graph degree and connectivity for the QAOA routing Hamiltonian.',
      sensitivityGuidance:
        'Select the archetype matching your operational deployment model.',
      tradeoffs:
        'Specialized archetypes (like Pareto 80/20) concentrate traffic into specific hot-aisles, challenging collision avoidance.',
    },
  };

  const handleToggleParamSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isParamSpeaking) {
      window.speechSynthesis.cancel();
      setIsParamSpeaking(false);
      return;
    }

    const item = parameterExplanations[selectedParamKey] || parameterExplanations.num_orders;
    const text = `${item.name}. Symbol ${item.symbol}. ${item.logisticsRole}. ${item.detailedMeaning}. Tier 1 impact: ${item.influenceTiers.tier1}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsParamSpeaking(false);
    utterance.onerror = () => setIsParamSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsParamSpeaking(true);
  };

  const handleCopyParamExplanation = () => {
    const item = parameterExplanations[selectedParamKey] || parameterExplanations.num_orders;
    const md = `# Parameter: ${item.name} (${item.symbol})\n**Role**: ${item.logisticsRole}\n\n## Detailed Meaning\n${item.detailedMeaning}\n\n## Influence on Multi-Tier Architecture\n- **Tier 1 (Clustering)**: ${item.influenceTiers.tier1}\n- **Tier 2 (Bin Packing)**: ${item.influenceTiers.tier2}\n- **Tier 3 (Routing)**: ${item.influenceTiers.tier3}\n- **Tier 4 (Kinematics)**: ${item.influenceTiers.tier4}\n\n## Quantum Impact\n${item.quantumImpact}\n\n## Sensitivity Guidance\n${item.sensitivityGuidance}\n\n## Trade-offs\n${item.tradeoffs}`;

    navigator.clipboard.writeText(md).then(() => {
      setIsParamCopied(true);
      setTimeout(() => setIsParamCopied(false), 2000);
    });
  };

  const handleResetGenerateDefaults = () => {
    setGenerateParams({
      scenario_name: `WAVE-RAND-${Math.floor(Math.random() * 9000 + 1000)}`,
      archetype: 'MEGA_FULFILLMENT_E_COMMERCE',
      num_orders: 25,
      num_vehicles: 4,
      num_depots: 2,
      num_chutes: 4,
      hazard_ratio: 15.0,
      seed: 42,
    });
  };

  const handleExecuteGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateScenario({
        scenario_name:
          generateParams.scenario_name || `WAVE-RAND-${Math.floor(Math.random() * 9000 + 1000)}`,
        num_orders: generateParams.num_orders,
        num_vehicles: generateParams.num_vehicles,
        archetype: generateParams.archetype,
        seed: generateParams.seed,
        num_depots: generateParams.num_depots,
        num_chutes: generateParams.num_chutes,
        hazard_ratio: generateParams.hazard_ratio / 100.0,
      });

      if (res && res.scenario_id) {
        setGenerationMsg(
          `Generated scenario ${res.scenario_id} with ${res.order_count} orders and ${res.fleet_size} AMRs!`
        );
        setIsGenerateModalOpen(false);
        onSelectScenario(res.scenario_id);

        const newDataset = await fetchDataset(res.scenario_id);
        if (newDataset) {
          setDataset(newDataset);
        }
        setTimeout(() => setGenerationMsg(null), 5000);
      }
    } catch (err) {
      console.error('Scenario generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDataset = async () => {
    if (!scenarioId) return;
    setIsLoading(true);
    try {
      const data = await fetchDataset(scenarioId);
      if (data && data.orders) {
        setDataset(data);
      }
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataset();
  }, [scenarioId]);

  const handleAddOrder = async () => {
    if (!dataset) return;
    try {
      await createOrder(dataset.scenario_id, newOrder);
      setIsAddModalOpen(false);
      loadDataset();
    } catch (err) {
      console.error('Add order error:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!dataset || !editingOrder) return;
    try {
      await updateOrder(dataset.scenario_id, editingOrder.order_id, editingOrder);
      setEditingOrder(null);
      loadDataset();
    } catch (err) {
      console.error('Update order error:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!dataset) return;
    try {
      await deleteOrder(dataset.scenario_id, orderId);
      loadDataset();
    } catch (err) {
      console.error('Delete order error:', err);
    }
  };

  const handleClone = async () => {
    if (!dataset) return;
    try {
      const cloned = await cloneScenario(dataset.scenario_id, `${dataset.name} (Copy)`);
      if (cloned && cloned.cloned_scenario_id) {
        onSelectScenario(cloned.cloned_scenario_id);
      }
    } catch (err) {
      console.error('Clone scenario error:', err);
    }
  };

  const handleExportJson = () => {
    if (!dataset) return;
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_${dataset.scenario_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = (dataset?.orders || []).filter((ord) => {
    const matchesSearch =
      ord.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.aisle_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHazard = hazardFilter === 'ALL' || ord.hazard_class === hazardFilter;
    return matchesSearch && matchesHazard;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#050810',
        overflow: 'hidden',
      }}
    >
      {/* Studio Header Bar */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#0c101c',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              color: '#00f0ff',
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f0f4f8' }}>
              Dataset & Mock Data Studio (Full CRUD)
            </h2>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Active Scenario:{' '}
              <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>
                {scenarioId || 'None'}
              </span>{' '}
              | Orders:{' '}
              <span style={{ color: '#fff', fontWeight: 600 }}>
                {dataset?.order_count || 0}
              </span>{' '}
              | Fleet:{' '}
              <span style={{ color: '#fff', fontWeight: 600 }}>
                {dataset?.fleet_size || 0} AMRs
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* GENERATE RANDOM DATASET BUTTON */}
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(0, 240, 255, 0.3))',
              border: '1px solid #00f0ff',
              borderRadius: '6px',
              color: '#00f0ff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
              transition: 'all 0.2s ease',
            }}
            title="Generate a custom random synthetic dataset with pre-requested parameters, defaults, and limits"
          >
            <Sparkles size={15} color="#00f0ff" />
            <span>Generate Random Dataset</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              borderRadius: '6px',
              color: '#00f0ff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Order
          </button>
          <button
            onClick={handleClone}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#f0f4f8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Copy size={15} /> Clone Scenario
          </button>
          <button
            onClick={handleExportJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#f0f4f8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={15} /> Export JSON
          </button>
          <button
            onClick={() => onDispatchDataset(scenarioId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #0070f3 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#050810',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Play size={15} /> Dispatch Dataset
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {generationMsg && (
        <div
          style={{
            margin: '12px 24px 0',
            padding: '10px 16px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#6ee7b7',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{generationMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '500px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0c101c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '6px 12px',
              width: '100%',
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by SKU, Order ID, or Aisle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f0f4f8',
                fontSize: '12px',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hazard:</span>
          {['ALL', 'NONE', 'FLAMMABLE', 'CORROSIVE', 'HAZ_A'].map((hz) => (
            <button
              key={hz}
              onClick={() => setHazardFilter(hz)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor:
                  hazardFilter === hz ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border:
                  hazardFilter === hz ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: hazardFilter === hz ? '#00f0ff' : '#94a3b8',
              }}
            >
              {hz}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ flex: 1, minHeight: 0, padding: '16px 24px', paddingBottom: '36px', overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ padding: '10px' }}>Order ID</th>
              <th style={{ padding: '10px' }}>SKU</th>
              <th style={{ padding: '10px' }}>Depot</th>
              <th style={{ padding: '10px' }}>Aisle</th>
              <th style={{ padding: '10px' }}>Coordinates (X,Y,Z)</th>
              <th style={{ padding: '10px' }}>Mass (kg)</th>
              <th style={{ padding: '10px' }}>Volume (m³)</th>
              <th style={{ padding: '10px' }}>Deadline</th>
              <th style={{ padding: '10px' }}>Hazard</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((ord) => (
              <tr
                key={ord.order_id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  color: '#f0f4f8',
                }}
              >
                <td style={{ padding: '10px', fontFamily: 'monospace', color: '#00f0ff' }}>
                  {ord.order_id}
                </td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{ord.sku_id}</td>
                <td style={{ padding: '10px' }}>{ord.depot_id}</td>
                <td style={{ padding: '10px' }}>{ord.aisle_id}</td>
                <td style={{ padding: '10px', color: '#94a3b8' }}>
                  ({ord.pickup_pos[0].toFixed(1)}, {ord.pickup_pos[1].toFixed(1)},{' '}
                  {ord.pickup_pos[2].toFixed(1)})
                </td>
                <td style={{ padding: '10px' }}>{ord.mass_kg.toFixed(1)}</td>
                <td style={{ padding: '10px' }}>{ord.volume_m3.toFixed(3)}</td>
                <td style={{ padding: '10px' }}>{ord.drop_deadline.toFixed(0)}s</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      backgroundColor:
                        ord.hazard_class !== 'NONE'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(16, 185, 129, 0.1)',
                      color: ord.hazard_class !== 'NONE' ? '#f87171' : '#34d399',
                      border:
                        ord.hazard_class !== 'NONE'
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {ord.hazard_class}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  <button
                    onClick={() => setEditingOrder(ord)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                    title="Edit Order"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(ord.order_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                    title="Delete Order"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: GENERATE RANDOM DATASET MODAL (PRE-REQUESTED PARAMS, DEFAULTS & LIMITS) */}
      {isGenerateModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '1120px',
              maxWidth: '96vw',
              maxHeight: '90vh',
              minHeight: 0,
              backgroundColor: '#0c101c',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#080c16',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #00f0ff, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#050810',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>
                    Generate Random Synthetic Dataset
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Pre-requested scenario parameters, defaults, and boundary limits
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setIsParamSubPanelOpen(!isParamSubPanelOpen)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isParamSubPanelOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: isParamSubPanelOpen ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    color: isParamSubPanelOpen ? '#00f0ff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <BookOpen size={14} />
                  {isParamSubPanelOpen ? 'Hide Parameter Influence' : 'Show Parameter Influence'}
                </button>

                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Layout (Left: Controls, Right: Parameter Sub-Panel) */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
              {/* Left Column: Parameter Configuration & Sliders */}
              <div
                style={{
                  flex: '1 1 580px',
                  minHeight: 0,
                  minWidth: 0,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Quick Presets Bar */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                    One-Click Archetype Presets:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {generatePresets.map((p) => (
                      <button
                        key={p.id}
                        onClick={p.apply}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(0, 240, 255, 0.2)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
                          e.currentTarget.style.borderColor = '#00f0ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.2)';
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>{p.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario Name & Archetype Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
                      Scenario Name
                    </label>
                    <input
                      type="text"
                      value={generateParams.scenario_name}
                      onChange={(e) =>
                        setGenerateParams((prev) => ({ ...prev, scenario_name: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#060913',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f0f4f8',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div
                    onClick={() => {
                      setSelectedParamKey('archetype');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '4px',
                      margin: '-4px',
                      borderRadius: '8px',
                      border: selectedParamKey === 'archetype' ? '1px solid #00f0ff' : '1px solid transparent',
                      backgroundColor: selectedParamKey === 'archetype' ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        Facility Archetype
                      </label>
                      {selectedParamKey === 'archetype' && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                          Inspecting
                        </span>
                      )}
                    </div>
                    <select
                      value={generateParams.archetype}
                      onChange={(e) =>
                        setGenerateParams((prev) => ({ ...prev, archetype: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#060913',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f0f4f8',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="MEGA_FULFILLMENT_E_COMMERCE">Mega E-Commerce Fulfillment</option>
                      <option value="PARETO_HOT_ZONE">Pareto 80/20 Picking Hot Zone</option>
                      <option value="DUAL_DEPOT_CROSS_DOCK">Dual-Depot Cross-Dock Transit</option>
                      <option value="PEAK_SURGE_HEAVY_TAIL">Peak Demand Surge Wave</option>
                      <option value="HAZMAT_SEGREGATION">Hazardous Materials Segregation</option>
                      <option value="UNIFORM_RANDOM">Uniform Random Baseline</option>
                    </select>
                  </div>
                </div>

                {/* Pre-Requested Parameters with ParameterCard (Dual Sliders, Limits, Defaults, Health Auras) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <ParameterCard
                    label="Order Pool Size"
                    paramKey="num_orders"
                    spec={generateSpecs.num_orders}
                    value={generateParams.num_orders}
                    onChange={(val) => setGenerateParams((prev) => ({ ...prev, num_orders: val }))}
                    nominalRange={[10, 60]}
                    description="Total stochastic parcel orders synthesized into scenario batch"
                    isSelected={selectedParamKey === 'num_orders'}
                    onInspect={() => {
                      setSelectedParamKey('num_orders');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                  />

                  <ParameterCard
                    label="AMR Fleet Size"
                    paramKey="num_vehicles"
                    spec={generateSpecs.num_vehicles}
                    value={generateParams.num_vehicles}
                    onChange={(val) => setGenerateParams((prev) => ({ ...prev, num_vehicles: val }))}
                    nominalRange={[2, 8]}
                    description="Active autonomous mobile robots available for tour dispatch"
                    isSelected={selectedParamKey === 'num_vehicles'}
                    onInspect={() => {
                      setSelectedParamKey('num_vehicles');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                  />

                  <ParameterCard
                    label="Depot Locations"
                    paramKey="num_depots"
                    spec={generateSpecs.num_depots}
                    value={generateParams.num_depots}
                    onChange={(val) => setGenerateParams((prev) => ({ ...prev, num_depots: val }))}
                    nominalRange={[1, 4]}
                    description="Multi-depot start/end staging locations along facility perimeter"
                    isSelected={selectedParamKey === 'num_depots'}
                    onInspect={() => {
                      setSelectedParamKey('num_depots');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                  />

                  <ParameterCard
                    label="Consolidation Chutes"
                    paramKey="num_chutes"
                    spec={generateSpecs.num_chutes}
                    value={generateParams.num_chutes}
                    onChange={(val) => setGenerateParams((prev) => ({ ...prev, num_chutes: val }))}
                    nominalRange={[2, 8]}
                    description="Sortation drop chutes with 5.0m³ accumulation buffers"
                    isSelected={selectedParamKey === 'num_chutes'}
                    onInspect={() => {
                      setSelectedParamKey('num_chutes');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                  />

                  <ParameterCard
                    label="Hazardous Ratio"
                    paramKey="hazard_ratio"
                    spec={generateSpecs.hazard_ratio}
                    value={generateParams.hazard_ratio}
                    onChange={(val) => setGenerateParams((prev) => ({ ...prev, hazard_ratio: val }))}
                    nominalRange={[0, 30]}
                    description="Fraction of parcels requiring ADR hazardous segregation rules"
                    isSelected={selectedParamKey === 'hazard_ratio'}
                    onInspect={() => {
                      setSelectedParamKey('hazard_ratio');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                  />

                  {/* Random Seed Control Card */}
                  <div
                    onClick={() => {
                      setSelectedParamKey('seed');
                      if (!isParamSubPanelOpen) setIsParamSubPanelOpen(true);
                    }}
                    style={{
                      backgroundColor: selectedParamKey === 'seed' ? 'rgba(0, 240, 255, 0.08)' : '#0c101c',
                      border: selectedParamKey === 'seed' ? '1px solid #00f0ff' : '1px solid rgba(0, 240, 255, 0.25)',
                      boxShadow: selectedParamKey === 'seed' ? '0 0 16px rgba(0, 240, 255, 0.35)' : 'none',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: selectedParamKey === 'seed' ? '#00f0ff' : '#f0f4f8' }}>
                          Stochastic Seed
                        </span>
                        {selectedParamKey === 'seed' && (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                            Inspecting
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGenerateParams((prev) => ({
                            ...prev,
                            seed: Math.floor(Math.random() * 100000),
                          }));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#00f0ff',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RotateCcw size={12} /> Randomize
                      </button>
                    </div>
                    <input
                      type="number"
                      value={generateParams.seed}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setGenerateParams((prev) => ({
                          ...prev,
                          seed: parseInt(e.target.value) || 0,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#060913',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f0f4f8',
                        fontSize: '12px',
                        outline: 'none',
                        marginTop: '8px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                      Reproducible Mersenne Twister pseudo-random generator seed
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Special Parameter Meaning & Influence Sub-Panel */}
              {isParamSubPanelOpen && (
                <div
                  style={{
                    width: '420px',
                    maxWidth: '44vw',
                    minWidth: '320px',
                    minHeight: 0,
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#070a14',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Sub-Panel Header */}
                  {(() => {
                    const currentExpl = parameterExplanations[selectedParamKey] || parameterExplanations.num_orders;
                    return (
                      <>
                        <div
                          style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: '#0c101c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <div
                              style={{
                                padding: '8px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Sliders size={18} color="#00f0ff" />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                    color: '#00f0ff',
                                  }}
                                >
                                  PARAM [{currentExpl.symbol}]
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: '#f0f4f8',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '2px',
                                }}
                              >
                                {currentExpl.name}
                              </div>
                            </div>
                          </div>

                          {/* TTS and Copy Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={handleToggleParamSpeech}
                              title={isParamSpeaking ? 'Stop voice readout' : 'Listen to parameter influence'}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: isParamSpeaking ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                color: isParamSpeaking ? '#00e676' : '#94a3b8',
                                cursor: 'pointer',
                              }}
                            >
                              {isParamSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            </button>

                            <button
                              onClick={handleCopyParamExplanation}
                              title="Copy parameter explanation markdown"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: isParamCopied ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                color: isParamCopied ? '#00f0ff' : '#94a3b8',
                                cursor: 'pointer',
                              }}
                            >
                              {isParamCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Quick Jump Chips Bar */}
                        <div
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#090d19',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            overflowX: 'auto',
                          }}
                        >
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>
                            Parameters:
                          </span>
                          {Object.values(parameterExplanations).map((item) => (
                            <button
                              key={item.key}
                              onClick={() => setSelectedParamKey(item.key)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border:
                                  selectedParamKey === item.key
                                    ? '1px solid #00f0ff'
                                    : '1px solid rgba(255, 255, 255, 0.06)',
                                backgroundColor:
                                  selectedParamKey === item.key
                                    ? 'rgba(0, 240, 255, 0.15)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                color: selectedParamKey === item.key ? '#00f0ff' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.name.split(' ')[0]} [{item.symbol}]
                            </button>
                          ))}
                        </div>

                        {/* Sub-Panel Tabs Navigation */}
                        <div
                          style={{
                            display: 'flex',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: '#0c101c',
                          }}
                        >
                          {[
                            { id: 'meaning', label: 'Meaning & Role' },
                            { id: 'influence', label: 'Influence (T1-T4)' },
                            { id: 'quantum', label: 'Quantum Impact' },
                            { id: 'limits', label: 'Bounds & Guidance' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setParamSubPanelTab(tab.id as any)}
                              style={{
                                flex: 1,
                                padding: '10px 4px',
                                border: 'none',
                                borderBottom: paramSubPanelTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
                                backgroundColor: 'transparent',
                                color: paramSubPanelTab === tab.id ? '#00f0ff' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Sub-Panel Scrollable Content Body */}
                        <div
                          style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            padding: '18px 20px',
                            paddingBottom: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            color: '#cbd5e1',
                          }}
                        >
                          {paramSubPanelTab === 'meaning' && (
                            <>
                              <div
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(0, 240, 255, 0.06)',
                                  border: '1px solid rgba(0, 240, 255, 0.2)',
                                }}
                              >
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', marginBottom: '2px' }}>
                                  PHYSICAL LOGISTICS ROLE
                                </div>
                                <div style={{ fontSize: '12px', color: '#f0f4f8' }}>{currentExpl.logisticsRole}</div>
                              </div>

                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '4px' }}>
                                  Detailed Operational Meaning
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                                  {currentExpl.detailedMeaning}
                                </p>
                              </div>

                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '4px' }}>
                                  Operational Trade-Offs
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                                  {currentExpl.tradeoffs}
                                </p>
                              </div>
                            </>
                          )}

                          {paramSubPanelTab === 'influence' && (
                            <>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
                                Multi-Tier Optimization Impact
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(0, 240, 255, 0.05)',
                                    border: '1px solid rgba(0, 240, 255, 0.2)',
                                  }}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '4px' }}>
                                    Tier 1: Wave Clustering & Chute Balance
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                    {currentExpl.influenceTiers.tier1}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(168, 85, 247, 0.05)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                  }}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc', marginBottom: '4px' }}>
                                    Tier 2: 3D Bin Packing & LIFO Invariant R10
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                    {currentExpl.influenceTiers.tier2}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(0, 230, 118, 0.05)',
                                    border: '1px solid rgba(0, 230, 118, 0.2)',
                                  }}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#00e676', marginBottom: '4px' }}>
                                    Tier 3: MD-VRPTW Routing & Makespan
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                    {currentExpl.influenceTiers.tier3}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                  }}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                                    Tier 4: Micro-Kinematics & ISO 3691-4 HRI
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                    {currentExpl.influenceTiers.tier4}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {paramSubPanelTab === 'quantum' && (
                            <>
                              <div
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(0, 240, 255, 0.08)',
                                  border: '1px solid rgba(0, 240, 255, 0.25)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  <Zap size={14} color="#00f0ff" />
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff' }}>
                                    CLASSIQ QUANTUM & COMPUTE SCALING
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#f0f4f8', lineHeight: '1.6' }}>
                                  {currentExpl.quantumImpact}
                                </div>
                              </div>
                            </>
                          )}

                          {paramSubPanelTab === 'limits' && (
                            <>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                                  Sensitivity & Recommended Bounds
                                </div>
                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                                  {currentExpl.sensitivityGuidance}
                                </p>
                              </div>

                              <div
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: '#0c101c',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  fontSize: '11px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}
                              >
                                <div style={{ color: '#64748b', fontWeight: 600 }}>SAFETY BOUNDARY CRITERIA</div>
                                <div style={{ color: '#38bdf8' }}>
                                  Permitted Range: {generateSpecs[currentExpl.key]?.min ?? 1} to {generateSpecs[currentExpl.key]?.max ?? 100} {currentExpl.unit}
                                </div>
                                <div style={{ color: '#a7f3d0' }}>
                                  Factory Baseline Default: {generateSpecs[currentExpl.key]?.default ?? 25} {currentExpl.unit}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Sub-Panel Footer */}
                        <div
                          style={{
                            padding: '10px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: '#0c101c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#64748b',
                          }}
                        >
                          <CodeLmnBadge variant="token" label="Invariant Certified: Verified" />
                          <span style={{ color: '#00e676', fontWeight: 600 }}>Φ &lt; 1.0 Verified</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#080c16',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={handleResetGenerateDefaults}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '7px 12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={12} /> Reset Defaults
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    padding: '8px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteGenerate}
                  disabled={isGenerating}
                  style={{
                    background: isGenerating
                      ? '#4b5563'
                      : 'linear-gradient(135deg, #00f0ff 0%, #0070f3 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#050810',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                  }}
                >
                  <Sparkles size={14} className={isGenerating ? 'spin' : ''} />
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Dataset & Load'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Order Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '92vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              backgroundColor: '#0c101c',
              border: '1px solid #00f0ff',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#00f0ff' }}>
              Add New Warehouse Order
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                  SKU Identifier
                </label>
                <input
                  type="text"
                  value={newOrder.sku_id}
                  onChange={(e) => setNewOrder({ ...newOrder, sku_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#060913',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                    Mass (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrder.mass_kg}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, mass_kg: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrder.volume_m3}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, volume_m3: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                    Deadline (sec)
                  </label>
                  <input
                    type="number"
                    value={newOrder.drop_deadline}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        drop_deadline: parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                    Hazard Class
                  </label>
                  <select
                    value={newOrder.hazard_class}
                    onChange={(e) => setNewOrder({ ...newOrder, hazard_class: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                    }}
                  >
                    <option value="NONE">NONE</option>
                    <option value="FLAMMABLE">FLAMMABLE</option>
                    <option value="CORROSIVE">CORROSIVE</option>
                    <option value="HAZ_A">HAZ_A</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrder}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#00f0ff',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#050810',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Order Modal */}
      {editingOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '92vw',
              maxHeight: '88vh',
              overflowY: 'auto',
              backgroundColor: '#0c101c',
              border: '1px solid #00f0ff',
              borderRadius: '10px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#00f0ff' }}>
              Edit Order {editingOrder.order_id}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                  Mass (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingOrder.mass_kg}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, mass_kg: parseFloat(e.target.value) || 0 })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#060913',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
                  Delivery Deadline (sec)
                </label>
                <input
                  type="number"
                  value={editingOrder.drop_deadline}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      drop_deadline: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#060913',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => setEditingOrder(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#00f0ff',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#050810',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetStudio;
