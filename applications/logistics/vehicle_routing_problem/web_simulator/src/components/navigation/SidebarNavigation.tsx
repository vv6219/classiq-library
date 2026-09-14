import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  MapPin,
  Database,
  Layers,
  Atom,
  BarChart3,
  GitCompare,
  Terminal,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Truck,
  Camera,
  Sliders,
  Cpu,
  Sparkles,
  FileText,
  Lightbulb,
  BookOpen,
  ListOrdered,
  Code,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Layout,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Building2,
  Eye,
  Radio,
  FileDown,
  Warehouse,
  SlidersHorizontal,
  Gauge,
} from 'lucide-react';
import { trackButtonClick, trackTabChange, trackSidebarNavigation } from '../../utils/analytics';
import { PDFProfileId } from '../../data/reportsRegistry';
import { StudioTabId } from '../../types/navigationState';
import { findRouteByItemId, matchNavigationRoute, NAVIGATION_ROUTES } from '../../utils/navigationRoutes';
import { updatePageMetadata } from '../../utils/headMetadata';

export interface SidebarNavigationProps {
  activeTab: StudioTabId;
  onSelectTab: (tab: StudioTabId) => void;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  onSelectEntity: (entity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any }) => void;
  onClearEntity: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
  onOpenConfig: () => void;
  onOpenQuickDrawer: () => void;
  onOpenPDF: (profile?: PDFProfileId) => void;
  onToggleExplainer: () => void;
  onToggleQuantumPanel: () => void;
  onOpenConceptModal: () => void;
  onOpenStepsModal: () => void;
  onToggleReportsPanel: () => void;
  onOpenReportsStudio?: () => void;
  onSetCameraPreset?: (preset: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus') => void;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null;
  onSelectArchetype?: (key: string) => void;
  selectedArchetype?: string;
  reportsCount?: number;
  onOpenOrdersDepotGenerator?: (paramKey?: string) => void;
  onMinimizeAllPanels?: () => void;
  onRestoreAllPanels?: () => void;
  selectedTier?: string;
  onSelectTier?: (tierKey: string) => void;
  onNavigate?: (item: SubMenuItem, pillar?: PillarCategory, parentGroup?: SubMenuItem) => void;
  isExplainerOpen?: boolean;
  selectedGraphId?: string;
  onSelectGraph?: (graphId: string) => void;
  selectedComparisonMode?: 'DELTA_AUDIT' | 'ALL' | 'GRID_FOCUS' | 'COMPARISON_FOCUS';
  onSelectComparisonMode?: (mode: 'DELTA_AUDIT' | 'ALL' | 'GRID_FOCUS' | 'COMPARISON_FOCUS') => void;
  selectedInvestigationSubTab?: 'timeline' | 'gates' | 'chutes' | 'quantum' | 'carbon';
  onSelectInvestigationSubTab?: (subTab: 'timeline' | 'gates' | 'chutes' | 'quantum' | 'carbon') => void;
}

export type MenuItemType = 'tab' | 'action' | 'command' | 'external' | 'group';

export interface SubMenuItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
  type: MenuItemType;
  targetTab?: StudioTabId;
  badge?: string | number;
  badgeColor?: string;
  shortcut?: string;
  tooltip?: string;
  externalUrl?: string;
  children?: SubMenuItem[];
  onExecute?: () => void;
}

export interface PillarCategory {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  badgeColor?: string;
  items: SubMenuItem[];
  onExecute?: () => void;
  isActive?: boolean;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onSelectTab,
  selectedEntity,
  onSelectEntity,
  onClearEntity,
  sidebarWidth,
  setSidebarWidth,
  isExpanded,
  setIsExpanded,
  isPinned,
  setIsPinned,
  onOpenConfig,
  onOpenQuickDrawer,
  onOpenPDF,
  onToggleExplainer,
  onToggleQuantumPanel,
  onOpenConceptModal,
  onOpenStepsModal,
  onToggleReportsPanel,
  onOpenReportsStudio,
  onSetCameraPreset,
  cameraPreset,
  onSelectArchetype,
  selectedArchetype = 'MEGA_FULFILLMENT_E_COMMERCE',
  reportsCount = 0,
  onOpenOrdersDepotGenerator,
  onMinimizeAllPanels,
  onRestoreAllPanels,
  selectedTier,
  onSelectTier,
  onNavigate,
  isExplainerOpen = false,
  selectedGraphId,
  onSelectGraph,
  selectedComparisonMode,
  onSelectComparisonMode,
  selectedInvestigationSubTab,
  onSelectInvestigationSubTab,
}) => {
  // Helper to normalize entity IDs for robust match (AMR_001, AMR-01, amr_1)
  const normalizeEntityId = (id?: string | null) => {
    if (!id) return '';
    return id.toUpperCase().replace(/[-_]/g, '').replace(/^AMR0*/, 'AMR');
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Accordion expansion states: On load, collapse all items so only top level (pillars) show
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(() => new Set<string>());
  const [expandedSubGroups, setExpandedSubGroups] = useState<Set<string>>(() => new Set<string>());

  // Track initial mount so initial page load keeps all items collapsed
  const isInitialMountRef = useRef(true);
  const isInitialEntityRef = useRef(true);

  // Dragging splitter state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  // Hover flyout in collapsed mode
  const [hoveredPillar, setHoveredPillar] = useState<PillarCategory | null>(null);
  const flyoutTimeoutRef = useRef<any>(null);

  // Persist expansion states during active session
  useEffect(() => {
    localStorage.setItem('wms_sidebar_expanded_pillars_v1', JSON.stringify(Array.from(expandedPillars)));
  }, [expandedPillars]);

  useEffect(() => {
    localStorage.setItem('wms_sidebar_expanded_subgroups_v1', JSON.stringify(Array.from(expandedSubGroups)));
  }, [expandedSubGroups]);

  // Deep-link initial route auto-expand: If user loaded a specific sub-route (e.g. /tiers/tier3 or /simulation/amr/AMR_001), reveal the pillar and sub-group
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialRoute = matchNavigationRoute(window.location.pathname || window.location.hash);
      if (initialRoute && initialRoute.path !== '/') {
        setExpandedPillars((prev) => new Set([...prev, initialRoute.pillarId]));
        if (initialRoute.id.startsWith('AMR_') || initialRoute.path.includes('/amr/')) {
          setExpandedSubGroups((prev) => new Set([...prev, 'amr-fleet']));
        } else if (initialRoute.id.startsWith('arch-') || initialRoute.path.includes('/archetype/')) {
          setExpandedSubGroups((prev) => new Set([...prev, 'archetypes-group']));
        } else if (initialRoute.id.startsWith('cam-') || initialRoute.path.includes('/camera/')) {
          setExpandedSubGroups((prev) => new Set([...prev, 'camera-presets']));
        }
      }
    }
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+K: Focus search
      if ((e.ctrlKey && e.key === '/') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsExpanded(true);
        searchInputRef.current?.focus();
      }
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
      // Ctrl+G: Open A-Z Engineering Glossary Studio
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        onSelectTab('glossary');
        if (typeof window !== 'undefined' && window.location.pathname !== '/glossary') {
          window.history.pushState(null, '', '/glossary');
        }
      }
      // Alt+E: Expand All
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExpandAll();
      }
      // Alt+C: Collapse All
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCollapseAll();
      }
      // Alt+R: Open Reports Manager Studio
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (onOpenReportsStudio) onOpenReportsStudio();
        else onToggleReportsPanel();
      }
      // Alt+X: Toggle Mission Explainer Drawer
      if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        onToggleExplainer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Auto-reveal active studio tab in sidebar only when user actively switches tabs after load
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    const tabPillarMap: Record<string, string> = {
      '3d-sim': 'pillar-1',
      '2d-route-map': 'pillar-1',
      'telemetry': 'pillar-1',
      'dataset': 'pillar-2',
      'tiers': 'pillar-2',
      'quantum': 'pillar-3',
      'graphs': 'pillar-4',
      'comparison': 'pillar-4',
      'investigation': 'pillar-4',
    };
    const targetPillar = tabPillarMap[activeTab];
    if (targetPillar && !expandedPillars.has(targetPillar)) {
      setExpandedPillars((prev) => new Set([...prev, targetPillar]));
    }
  }, [activeTab]);

  // Auto-reveal selected entity only when user actively selects an AMR after load
  useEffect(() => {
    if (isInitialEntityRef.current) {
      isInitialEntityRef.current = false;
      return;
    }
    if (selectedEntity && selectedEntity.type === 'AMR') {
      setExpandedPillars((prev) => new Set([...prev, 'pillar-1']));
      setExpandedSubGroups((prev) => new Set([...prev, 'amr-fleet']));
    }
  }, [selectedEntity]);

  // Pillar & Sub-Menu Tree Definition
  const pillars: PillarCategory[] = useMemo(
    () => [
      {
        id: 'pillar-1',
        title: 'Digital Twin & Fleet Operations',
        shortTitle: 'Fleet & Twin',
        icon: <Box size={16} />,
        color: '#00f0ff',
        badge: 'Live',
        items: [
          {
            id: 'menu-3d-sim',
            label: '3D Warehouse Digital Twin',
            shortLabel: '3D Twin',
            icon: <Box size={14} />,
            type: 'tab',
            targetTab: '3d-sim',
            shortcut: 'Ctrl+1',
            tooltip: 'Real-time WebGL Three.js warehouse simulation',
            children: [
              {
                id: 'sub-facility-envelope',
                label: 'Facility Overview (150m×100m)',
                type: 'command',
                icon: <Compass size={12} />,
                shortcut: 'F1',
                tooltip: 'Reset camera to full facility bounds',
                onExecute: () => onSetCameraPreset?.('overview'),
              },
              {
                id: 'amr-fleet',
                label: 'Active AMR Fleet (4 AMRs)',
                type: 'group',
                icon: <Truck size={12} />,
                badge: '4 Units',
                badgeColor: '#00f0ff',
                children: [
                  {
                    id: 'AMR_001',
                    label: 'AMR-01 (Heavy Payload)',
                    type: 'command',
                    badge: '88% • 1.38m/s',
                    badgeColor: '#10b981',
                    tooltip: 'Heavy payload AMR transporter',
                    onExecute: () => {
                      onSelectEntity({ type: 'AMR', id: 'AMR_001', telemetry: { soc: 88, speed: 1.38 } });
                      onSetCameraPreset?.('follow');
                    },
                  },
                  {
                    id: 'AMR_002',
                    label: 'AMR-02 (Standard Toter)',
                    type: 'command',
                    badge: '92% • 1.45m/s',
                    badgeColor: '#10b981',
                    tooltip: 'Standard tote carrier',
                    onExecute: () => {
                      onSelectEntity({ type: 'AMR', id: 'AMR_002', telemetry: { soc: 92, speed: 1.45 } });
                      onSetCameraPreset?.('follow');
                    },
                  },
                  {
                    id: 'AMR_003',
                    label: 'AMR-03 (Narrow Aisle)',
                    type: 'command',
                    badge: '76% • 1.20m/s',
                    badgeColor: '#fbbf24',
                    tooltip: 'High-density rack navigator',
                    onExecute: () => {
                      onSelectEntity({ type: 'AMR', id: 'AMR_003', telemetry: { soc: 76, speed: 1.20 } });
                      onSetCameraPreset?.('follow');
                    },
                  },
                  {
                    id: 'AMR_004',
                    label: 'AMR-04 (High-Speed)',
                    type: 'command',
                    badge: '84% • 1.62m/s',
                    badgeColor: '#10b981',
                    tooltip: 'High-velocity sprint vehicle',
                    onExecute: () => {
                      onSelectEntity({ type: 'AMR', id: 'AMR_004', telemetry: { soc: 84, speed: 1.62 } });
                      onSetCameraPreset?.('follow');
                    },
                  },
                ],
              },
              {
                id: 'camera-presets',
                label: 'Camera Perspectives',
                type: 'group',
                icon: <Camera size={12} />,
                children: [
                  {
                    id: 'cam-top',
                    label: 'Top-Down Orthographic',
                    type: 'command',
                    shortcut: 'F2',
                    onExecute: () => onSetCameraPreset?.('top'),
                  },
                  {
                    id: 'cam-iso',
                    label: 'Isometric 45° Cyber-Perspective',
                    type: 'command',
                    shortcut: 'F3',
                    onExecute: () => onSetCameraPreset?.('isometric'),
                  },
                  {
                    id: 'cam-follow',
                    label: 'Floor Follower (Cab Ride)',
                    type: 'command',
                    shortcut: 'F4',
                    onExecute: () => onSetCameraPreset?.('follow'),
                  },
                  {
                    id: 'cam-chute',
                    label: 'Chute Array Focus (C1–C4)',
                    type: 'command',
                    onExecute: () => onSetCameraPreset?.('chute-focus'),
                  },
                ],
              },
              {
                id: 'hud-panel-manager',
                label: 'Floating HUD Panels Manager',
                type: 'group',
                icon: <Layout size={12} />,
                children: [
                  {
                    id: 'panels-min-all',
                    label: 'Minimize All Floating Panels',
                    type: 'command',
                    onExecute: () => onMinimizeAllPanels?.(),
                  },
                  {
                    id: 'panels-restore-all',
                    label: 'Restore & Expand Active Panel',
                    type: 'command',
                    onExecute: () => onRestoreAllPanels?.(),
                  },
                ],
              },
            ],
          },
          {
            id: 'menu-2d-route-map',
            label: '2D Coordinate Routing Map',
            shortLabel: '2D Map',
            icon: <MapPin size={14} />,
            type: 'tab',
            targetTab: '2d-route-map',
            shortcut: 'Ctrl+2',
            children: [
              {
                id: 'sub-trajectories',
                label: 'Route Trajectories & Waypoints',
                type: 'command',
                onExecute: () => onSelectTab('2d-route-map'),
              },
              {
                id: 'sub-chute-contention',
                label: 'Chute Contention & Queues',
                type: 'command',
                onExecute: () => onSelectTab('2d-route-map'),
              },
            ],
          },
          {
            id: 'menu-telemetry',
            label: 'Real-Time Telemetry Console',
            shortLabel: 'Telemetry',
            icon: <Terminal size={14} />,
            type: 'tab',
            targetTab: 'telemetry',
            shortcut: 'Ctrl+8',
            children: [
              {
                id: 'sub-kinematics',
                label: 'AMR Kinematics Stream (x, y, θ, v)',
                type: 'command',
                onExecute: () => onSelectTab('telemetry'),
              },
              {
                id: 'sub-opentelemetry',
                label: 'OpenTelemetry Spans & Waterfall',
                type: 'command',
                onExecute: () => onSelectTab('telemetry'),
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-2',
        title: 'Workload, Scenarios & Solvers',
        shortTitle: 'Workload & Solvers',
        icon: <Layers size={16} />,
        color: '#fbbf24',
        badge: '5 Arch',
        items: [
          {
            id: 'menu-workload-params',
            label: 'Dispatch Orders & Depot Parameters',
            shortLabel: 'Orders & Depots',
            icon: <SlidersHorizontal size={14} />,
            type: 'action',
            badge: 'Generator',
            badgeColor: '#00f0ff',
            shortcut: 'Ctrl+5',
            tooltip: 'Configure dispatch orders amount (num_orders), depot locations, fleet size & workload generator parameters',
            onExecute: () => {
              onSelectTab('dataset');
              onOpenOrdersDepotGenerator?.('num_orders');
            },
            children: [
              {
                id: 'sub-orders-amount-param',
                label: 'Dispatch Orders Amount (num_orders: 5–150)',
                type: 'command',
                icon: <Box size={12} />,
                badge: 'Orders',
                badgeColor: '#00f0ff',
                tooltip: 'Set total batch orders amount to cluster and route across AMRs',
                onExecute: () => {
                  onSelectTab('dataset');
                  onOpenOrdersDepotGenerator?.('num_orders');
                },
              },
              {
                id: 'sub-depots-param',
                label: 'Depot Quantity & Positions (num_depots: 1–6)',
                type: 'command',
                icon: <Warehouse size={12} />,
                badge: 'Depots',
                badgeColor: '#10b981',
                tooltip: 'Configure replenishment and staging depots across warehouse coordinates',
                onExecute: () => {
                  onSelectTab('dataset');
                  onOpenOrdersDepotGenerator?.('num_depots');
                },
              },
              {
                id: 'sub-fleet-sizing-param',
                label: 'AMR Fleet Sizing & Vehicles (num_vehicles: 1–16)',
                type: 'command',
                icon: <Truck size={12} />,
                badge: 'Fleet',
                badgeColor: '#fbbf24',
                tooltip: 'Configure active vehicle pool size and payload capacities',
                onExecute: () => {
                  onSelectTab('dataset');
                  onOpenOrdersDepotGenerator?.('num_vehicles');
                },
              },
              {
                id: 'sub-chutes-param',
                label: 'Chute Drop Arrays & Sorters (num_chutes: 1–8)',
                type: 'command',
                icon: <MapPin size={12} />,
                badge: 'Chutes',
                badgeColor: '#a855f7',
                tooltip: 'Configure sorting conveyor chute terminals and discharge gates',
                onExecute: () => {
                  onSelectTab('dataset');
                  onOpenOrdersDepotGenerator?.('num_chutes');
                },
              },
              {
                id: 'sub-quick-workload-drawer',
                label: 'Quick Workload Drawer (Orders, Fleet & Seed)',
                type: 'action',
                icon: <Sliders size={12} />,
                badge: 'Quick',
                badgeColor: '#38bdf8',
                tooltip: 'Open slide-out drawer for instant orders and vehicles adjustment',
                onExecute: onOpenQuickDrawer,
              },
              {
                id: 'sub-engineering-limits-drawer',
                label: '36 Engineering Parameters & Limits Drawer',
                type: 'action',
                icon: <Gauge size={12} />,
                badge: '36 Specs',
                badgeColor: '#fbbf24',
                tooltip: 'Open full engineering configuration drawer with KaTeX formulas and bounds',
                onExecute: onOpenConfig,
              },
            ],
          },
          {
            id: 'menu-dataset',
            label: 'Dataset & Scenario Studio (CRUD)',
            shortLabel: 'Dataset Studio',
            icon: <Database size={14} />,
            type: 'tab',
            targetTab: 'dataset',
            shortcut: 'Ctrl+3',
            children: [
              {
                id: 'archetypes-group',
                label: 'Warehouse Archetypes (5 Matrix)',
                type: 'group',
                icon: <Building2 size={12} />,
                children: [
                  {
                    id: 'arch-mega',
                    label: 'Mega-Fulfillment E-Commerce',
                    type: 'command',
                    badge: selectedArchetype === 'MEGA_FULFILLMENT_E_COMMERCE' ? 'Active' : undefined,
                    badgeColor: '#fbbf24',
                    onExecute: () => {
                      onSelectTab('dataset');
                      onSelectArchetype?.('MEGA_FULFILLMENT_E_COMMERCE');
                    },
                  },
                  {
                    id: 'arch-auto',
                    label: 'Automotive Just-In-Sequence',
                    type: 'command',
                    badge: selectedArchetype === 'AUTOMOTIVE_JUST_IN_SEQUENCE' ? 'Active' : undefined,
                    badgeColor: '#fbbf24',
                    onExecute: () => {
                      onSelectTab('dataset');
                      onSelectArchetype?.('AUTOMOTIVE_JUST_IN_SEQUENCE');
                    },
                  },
                  {
                    id: 'arch-cold',
                    label: 'Pharmaceutical Cold-Chain',
                    type: 'command',
                    badge: selectedArchetype === 'PHARMACEUTICAL_COLD_CHAIN' ? 'Active' : undefined,
                    badgeColor: '#fbbf24',
                    onExecute: () => {
                      onSelectTab('dataset');
                      onSelectArchetype?.('PHARMACEUTICAL_COLD_CHAIN');
                    },
                  },
                  {
                    id: 'arch-micro',
                    label: 'Urban Micro-Fulfillment',
                    type: 'command',
                    badge: selectedArchetype === 'URBAN_MICRO_FULFILLMENT' ? 'Active' : undefined,
                    badgeColor: '#fbbf24',
                    onExecute: () => {
                      onSelectTab('dataset');
                      onSelectArchetype?.('URBAN_MICRO_FULFILLMENT');
                    },
                  },
                  {
                    id: 'arch-heavy',
                    label: 'Heavy Industrial Logistics',
                    type: 'command',
                    badge: selectedArchetype === 'HEAVY_INDUSTRIAL_LOGISTICS' ? 'Active' : undefined,
                    badgeColor: '#fbbf24',
                    onExecute: () => {
                      onSelectTab('dataset');
                      onSelectArchetype?.('HEAVY_INDUSTRIAL_LOGISTICS');
                    },
                  },
                ],
              },
              {
                id: 'sub-generator',
                label: 'Order Pool & Depot Generator Settings',
                type: 'command',
                icon: <Sparkles size={12} />,
                badge: 'Orders & Depots',
                badgeColor: '#00f0ff',
                onExecute: () => {
                  onSelectTab('dataset');
                  onOpenOrdersDepotGenerator?.('num_orders');
                },
              },
              {
                id: 'sub-schema',
                label: 'Relational Database Schema & Records',
                type: 'command',
                onExecute: () => onSelectTab('dataset'),
              },
            ],
          },
          {
            id: 'menu-tiers',
            label: '4-Tier Optimization Pipeline',
            shortLabel: '4 Tiers',
            icon: <Layers size={14} />,
            type: 'tab',
            targetTab: 'tiers',
            shortcut: 'Ctrl+4',
            children: [
              {
                id: 'sub-tier-1',
                label: 'Tier 1: Quantum FCM Clustering',
                type: 'command',
                badge: 'Rank 1Q',
                badgeColor: '#00f0ff',
                onExecute: () => {
                  onSelectTab('tiers');
                  onSelectTier?.('tier1');
                },
              },
              {
                id: 'sub-tier-2',
                label: 'Tier 2: CP-SAT MISOCP 3D Bin Packing',
                type: 'command',
                badge: 'LIFO DAG',
                badgeColor: '#10b981',
                onExecute: () => {
                  onSelectTab('tiers');
                  onSelectTier?.('tier2');
                },
              },
              {
                id: 'sub-tier-3',
                label: 'Tier 3: Classiq QAOA Subtour Synthesis',
                type: 'command',
                badge: '32Q',
                badgeColor: '#c084fc',
                onExecute: () => {
                  onSelectTab('tiers');
                  onSelectTier?.('tier3');
                },
              },
              {
                id: 'sub-tier-4',
                label: 'Tier 4: PBS + Continuous SIPP MAPF',
                type: 'command',
                badge: 'Swept 3D',
                badgeColor: '#fbbf24',
                onExecute: () => {
                  onSelectTab('tiers');
                  onSelectTier?.('tier4');
                },
              },
            ],
          },
          {
            id: 'menu-swagger-runner',
            label: 'OpenAPI (Swagger) Dispatch API Runner',
            shortLabel: 'Swagger API',
            icon: <Code size={14} />,
            type: 'external',
            externalUrl: 'http://127.0.0.1:8080/docs',
            badge: '8080 Live',
            badgeColor: '#10b981',
            tooltip: 'Run and test DispatchEngine REST & WebSocket endpoints in interactive Swagger UI (Port 8080)',
          },
          {
            id: 'menu-config-drawer',
            label: 'Engineering Parameters (36 Specs)',
            shortLabel: '36 Params',
            icon: <Sliders size={14} />,
            type: 'action',
            badge: 'Drawer',
            badgeColor: '#fbbf24',
            tooltip: 'Open dual-pane engineering configuration drawer',
            onExecute: onOpenConfig,
            children: [
              {
                id: 'sub-kinematics-limits',
                label: 'Kinematics & Speed Limits (v_max, a_max)',
                type: 'command',
                onExecute: onOpenConfig,
              },
              {
                id: 'sub-lagrangian',
                label: 'Lagrangian Weights (α, β, γ, λ)',
                type: 'command',
                onExecute: onOpenConfig,
              },
              {
                id: 'sub-quick-drawer',
                label: 'Quick Workload Drawer (Fleet & Orders)',
                type: 'action',
                onExecute: onOpenQuickDrawer,
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-3',
        title: 'Classiq Quantum Co-Processor',
        shortTitle: 'Classiq Co-Proc',
        icon: <Atom size={16} />,
        color: '#c084fc',
        badge: '32Q QAOA',
        items: [
          {
            id: 'menu-quantum-studio',
            label: 'Quantum Studio & Circuit Synthesis',
            shortLabel: 'Quantum Studio',
            icon: <Atom size={14} />,
            type: 'tab',
            targetTab: 'quantum',
            shortcut: 'Ctrl+5',
            children: [
              {
                id: 'sub-energy-landscape',
                label: 'QAOA Cost Surface (γ, β Landscape)',
                type: 'command',
                onExecute: () => onSelectTab('quantum'),
              },
              {
                id: 'sub-bitstring-spectrum',
                label: 'Sampled Bitstrings & Ground State Cut',
                type: 'command',
                onExecute: () => onSelectTab('quantum'),
              },
              {
                id: 'sub-qmod-specs',
                label: 'Native Qmod Circuit Specifications',
                type: 'command',
                onExecute: () => onSelectTab('quantum'),
              },
            ],
          },
          {
            id: 'menu-quantum-util',
            label: 'Quantum Utilization & Profiling',
            shortLabel: 'Quantum Profiling',
            icon: <Cpu size={14} />,
            type: 'action',
            badge: 'Modal',
            badgeColor: '#c084fc',
            onExecute: onToggleQuantumPanel,
            children: [
              {
                id: 'sub-qubit-allocation',
                label: 'Qubit Register Partition by Tier',
                type: 'command',
                onExecute: onToggleQuantumPanel,
              },
              {
                id: 'sub-entropy',
                label: 'Shannon Entropy Phase Transition S(ρ)',
                type: 'command',
                onExecute: onToggleQuantumPanel,
              },
            ],
          },
          {
            id: 'menu-quantum-pdf',
            label: 'Quantum Monograph Dossier (3P)',
            shortLabel: 'Quantum PDF',
            icon: <Sparkles size={14} />,
            type: 'action',
            badge: 'PDF',
            badgeColor: '#c084fc',
            onExecute: () => onOpenPDF('QUANTUM'),
          },
        ],
      },
      {
        id: 'pillar-4',
        title: 'Analytics, Auditing & Reports',
        shortTitle: 'Analytics & Reports',
        icon: <BarChart3 size={16} />,
        color: '#34d399',
        badge: 'Audited',
        items: [
          {
            id: 'menu-graphs',
            label: 'Performance Analytics & Pareto Graphs',
            shortLabel: 'Analytics',
            icon: <BarChart3 size={14} />,
            type: 'tab',
            targetTab: 'graphs',
            shortcut: 'Ctrl+6',
            badge: '10 Charts',
            children: [
              {
                id: 'sub-pareto',
                label: 'Fleet Makespan & Distance Pareto Front',
                shortLabel: 'Pareto Front',
                type: 'tab',
                targetTab: 'graphs',
                onExecute: () => {
                  onSelectTab('graphs');
                  if (onSelectGraph) onSelectGraph('pareto');
                },
              },
              {
                id: 'sub-benchmarks',
                label: '4-Way Solver Latency Benchmark',
                shortLabel: 'Solver Benchmarks',
                type: 'tab',
                targetTab: 'graphs',
                onExecute: () => {
                  onSelectTab('graphs');
                  if (onSelectGraph) onSelectGraph('benders');
                },
              },
              {
                id: 'sub-heatmaps',
                label: 'Chute Balance Variance Heatmaps',
                shortLabel: 'Chute Heatmaps',
                type: 'tab',
                targetTab: 'graphs',
                onExecute: () => {
                  onSelectTab('graphs');
                  if (onSelectGraph) onSelectGraph('spatiotemporal_heatmap');
                },
              },
            ],
          },
          {
            id: 'menu-comparison',
            label: 'Historical Run Comparative Benchmark',
            shortLabel: 'Comparison',
            icon: <GitCompare size={14} />,
            type: 'tab',
            targetTab: 'comparison',
            shortcut: 'Ctrl+7',
            children: [
              {
                id: 'sub-delta-audit',
                label: 'Quantum vs Classical Delta Audit',
                type: 'tab',
                targetTab: 'comparison',
                onExecute: () => {
                  onSelectTab('comparison');
                  onSelectComparisonMode?.('DELTA_AUDIT');
                },
              },
              {
                id: 'sub-regression-table',
                label: 'Historical Regression Table',
                type: 'tab',
                targetTab: 'comparison',
                onExecute: () => {
                  onSelectTab('comparison');
                  onSelectComparisonMode?.('GRID_FOCUS');
                },
              },
            ],
          },
          {
            id: 'menu-investigation',
            label: 'Incident Root-Cause Investigation',
            shortLabel: 'Investigation',
            icon: <Search size={14} />,
            type: 'tab',
            targetTab: 'investigation',
            badge: 'Root Cause',
            badgeColor: '#f43f5e',
            shortcut: 'Ctrl+9',
            onExecute: () => {
              onSelectTab('investigation');
            },
            children: [
              {
                id: 'sub-investigation-timeline',
                label: 'Timeline Micro-Scrubber (t=0..T)',
                shortLabel: 'Timeline Scrubber',
                type: 'tab',
                targetTab: 'investigation',
                badge: 't=0..T',
                badgeColor: '#38bdf8',
                tooltip: 'Second-by-second AMR trajectory scrubber, kinematic velocity v(t), and ISO 3691-4 deceleration clamping forensics.',
                onExecute: () => {
                  onSelectTab('investigation');
                  onSelectInvestigationSubTab?.('timeline');
                  trackButtonClick('SubMenu_Investigation_Timeline', 'Sidebar_Navigation', {
                    sub_tab: 'timeline',
                    target_route: '/investigation/timeline',
                  });
                  trackTabChange('investigation', 'timeline', { source: 'sidebar_sub_item' });
                },
              },
              {
                id: 'sub-investigation-gates',
                label: 'Invariant Gates 1-4 & Benders Cuts',
                shortLabel: 'Invariant Gates',
                type: 'tab',
                targetTab: 'investigation',
                badge: '4 Gates',
                badgeColor: '#10b981',
                tooltip: 'Rigorous KaTeX mathematical proofs for batching, 3D LIFO, SoC discharge, and automated Benders decomposition cuts.',
                onExecute: () => {
                  onSelectTab('investigation');
                  onSelectInvestigationSubTab?.('gates');
                  trackButtonClick('SubMenu_Investigation_Gates', 'Sidebar_Navigation', {
                    sub_tab: 'gates',
                    target_route: '/investigation/gates',
                  });
                  trackTabChange('investigation', 'gates', { source: 'sidebar_sub_item' });
                },
              },
              {
                id: 'sub-investigation-chutes',
                label: 'Spatiotemporal Chute Dynamics & Chokes',
                shortLabel: 'Chute Dynamics',
                type: 'tab',
                targetTab: 'investigation',
                badge: 'Q_c(t)',
                badgeColor: '#f59e0b',
                tooltip: 'Hydrodynamic buffer accumulation dynamics dQ/dt, 85% surge backpressure regulation, and corridor stall analytics.',
                onExecute: () => {
                  onSelectTab('investigation');
                  onSelectInvestigationSubTab?.('chutes');
                  trackButtonClick('SubMenu_Investigation_Chutes', 'Sidebar_Navigation', {
                    sub_tab: 'chutes',
                    target_route: '/investigation/chutes',
                  });
                  trackTabChange('investigation', 'chutes', { source: 'sidebar_sub_item' });
                },
              },
              {
                id: 'sub-investigation-quantum',
                label: 'Quantum Co-Processor Diagnostics',
                shortLabel: 'Quantum Diagnostics',
                type: 'tab',
                targetTab: 'investigation',
                badge: 'QAOA Lens',
                badgeColor: '#a855f7',
                tooltip: 'Classiq QAOA variational trajectory (γ, β), transpilation depth, shot-noise variance decay, and quantum crossover frontier.',
                onExecute: () => {
                  onSelectTab('investigation');
                  onSelectInvestigationSubTab?.('quantum');
                  trackButtonClick('SubMenu_Investigation_Quantum', 'Sidebar_Navigation', {
                    sub_tab: 'quantum',
                    target_route: '/investigation/quantum-lens',
                  });
                  trackTabChange('investigation', 'quantum', { source: 'sidebar_sub_item' });
                },
              },
              {
                id: 'sub-investigation-carbon',
                label: 'Fleet Energy & ISO 14064 Carbon',
                shortLabel: 'Energy & Carbon',
                type: 'tab',
                targetTab: 'investigation',
                badge: 'ISO 14064',
                badgeColor: '#00f0ff',
                tooltip: 'Dynamic battery SoC kinetics, regenerative braking recovery (KERS), and ESG greenhouse gas emissions scorecard.',
                onExecute: () => {
                  onSelectTab('investigation');
                  onSelectInvestigationSubTab?.('carbon');
                  trackButtonClick('SubMenu_Investigation_Carbon', 'Sidebar_Navigation', {
                    sub_tab: 'carbon',
                    target_route: '/investigation/carbon-forensics',
                  });
                  trackTabChange('investigation', 'carbon', { source: 'sidebar_sub_item' });
                },
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-5',
        title: 'Knowledge, Theory & Developer Tools',
        shortTitle: 'Theory & Tools',
        icon: <Lightbulb size={16} />,
        color: '#60a5fa',
        badge: '473 Eq',
        items: [
          {
            id: 'menu-concept-theory',
            label: 'Mathematical Formulation & Theory',
            shortLabel: 'Theory Dossier',
            icon: <Lightbulb size={14} />,
            type: 'action',
            badge: '473 Eq',
            badgeColor: '#60a5fa',
            onExecute: onOpenConceptModal,
            children: [
              {
                id: 'sub-vrptw-formulation',
                label: 'ER-MD-VRPTW-3D-HRI LaTeX Equations',
                type: 'command',
                onExecute: onOpenConceptModal,
              },
              {
                id: 'sub-iso-checklist',
                label: 'DIN EN ISO 3691-4 Safety Checklist (15 Rules)',
                type: 'command',
                onExecute: onOpenConceptModal,
              },
              {
                id: 'sub-popperian-phi',
                label: 'Popperian Falsification Proof (Φ = 0.880)',
                type: 'command',
                onExecute: onOpenConceptModal,
              },
            ],
          },
          {
            id: 'menu-steps-progress',
            label: 'Execution Pipeline Latency & Steps',
            shortLabel: '7-Step Pipeline',
            icon: <ListOrdered size={14} />,
            type: 'action',
            onExecute: onOpenStepsModal,
          },
          {
            id: 'menu-developer-tools',
            label: 'Developer Infrastructure & APIs',
            shortLabel: 'Dev Tools',
            icon: <Code size={14} />,
            type: 'group',
            children: [
              {
                id: 'dev-swagger',
                label: 'DispatchEngine OpenAPI / Swagger UI Runner',
                type: 'external',
                externalUrl: 'http://127.0.0.1:8080/docs',
                badge: 'Run 8080',
                badgeColor: '#10b981',
                icon: <ExternalLink size={12} />,
                tooltip: 'Interactive Swagger UI 5.x documentation & API test console (Port 8080)',
              },
              {
                id: 'dev-telegram',
                label: 'YesAndNo Community Telegram',
                type: 'external',
                externalUrl: 'https://t.me/yesandnoQ',
                icon: <ExternalLink size={12} />,
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-explainer',
        title: 'Mission & Co-Processor Explainer',
        shortTitle: 'Explainer',
        icon: <BookOpen size={16} />,
        color: '#38bdf8',
        badge: isExplainerOpen ? 'Open' : 'Drawer',
        badgeColor: isExplainerOpen ? '#00f0ff' : '#38bdf8',
        isActive: isExplainerOpen,
        onExecute: onToggleExplainer,
        items: [
          {
            id: 'menu-explainer-toggle',
            label: isExplainerOpen ? 'Close Explainer Drawer' : 'Open Explainer Drawer',
            shortLabel: 'Toggle Explainer',
            icon: <BookOpen size={14} />,
            type: 'action',
            shortcut: 'Alt+X',
            badge: isExplainerOpen ? 'Active' : 'Drawer',
            badgeColor: isExplainerOpen ? '#00f0ff' : '#94a3b8',
            tooltip: 'Toggle the bottom Mission & Co-Processor Explainer drawer (Alt+X)',
            onExecute: onToggleExplainer,
          },
          {
            id: 'sub-explainer-concept',
            label: 'Open Mathematical & Theoretical Dossier',
            type: 'command',
            icon: <Lightbulb size={12} />,
            badge: 'Theory',
            badgeColor: '#60a5fa',
            onExecute: onOpenConceptModal,
          },
          {
            id: 'sub-explainer-pipeline',
            label: 'Open 7-Step Dispatch Pipeline Modal',
            type: 'command',
            icon: <ListOrdered size={12} />,
            badge: '7-Steps',
            badgeColor: '#38bdf8',
            onExecute: onOpenStepsModal,
          },
        ],
      },
      {
        id: 'pillar-sqlite-studio',
        title: 'SQL Query Console /sqlite',
        shortTitle: 'SQLite DB',
        icon: <Database size={16} />,
        color: '#06b6d4',
        badge: 'WASM',
        badgeColor: '#06b6d4',
        onExecute: () => {
          window.open('/sqlite', '_blank', 'noopener,noreferrer');
        },
        items: [
          {
            id: 'menu-sqlite-studio-main',
            label: 'SQL Query Console (/sqlite)',
            shortLabel: 'SQL Console',
            icon: <Database size={14} />,
            type: 'external',
            externalUrl: '/sqlite',
            badge: 'WASM',
            badgeColor: '#06b6d4',
            tooltip: 'Open in-browser SQL Query Console & SQLite database workspace (/sqlite)',
          },
        ],
      },
      {
        id: 'pillar-reports-studio',
        title: 'Reports Manager Studio',
        shortTitle: 'Reports Studio',
        icon: <FileText size={16} />,
        color: '#10b981',
        badge: reportsCount > 0 ? `${reportsCount} Saved` : 'Studio',
        items: [
          {
            id: 'menu-reports-studio-main',
            label: 'Reports Manager Studio & Repository',
            shortLabel: 'Reports Studio',
            icon: <FileText size={14} />,
            type: 'action',
            badge: reportsCount > 0 ? `${reportsCount} Saved` : 'Live',
            badgeColor: '#10b981',
            shortcut: 'Alt+R',
            tooltip: 'Launch full-screen Reports Manager Studio and compliance artifact repository',
            onExecute: () => {
              if (onOpenReportsStudio) onOpenReportsStudio();
              else onToggleReportsPanel();
            },
            children: [
              {
                id: 'sub-studio-launch-panel',
                label: 'Launch Reports Repository Dock',
                type: 'command',
                icon: <FileText size={12} />,
                badge: 'Dock',
                badgeColor: '#10b981',
                onExecute: () => {
                  if (onOpenReportsStudio) onOpenReportsStudio();
                  else onToggleReportsPanel();
                },
              },
              {
                id: 'sub-studio-exec-brief',
                label: 'Generate Executive Brief (2P PDF)',
                type: 'command',
                icon: <FileDown size={12} />,
                badge: 'PDF',
                badgeColor: '#10b981',
                onExecute: () => onOpenPDF('EXECUTIVE'),
              },
              {
                id: 'sub-studio-audit-dossier',
                label: 'Generate Comprehensive Dossier (7P PDF)',
                type: 'command',
                icon: <FileDown size={12} />,
                badge: 'PDF',
                badgeColor: '#10b981',
                onExecute: () => onOpenPDF('COMPREHENSIVE'),
              },
              {
                id: 'sub-studio-safety-cert',
                label: 'Generate Safety Audit Certificate (1P PDF)',
                type: 'command',
                icon: <FileDown size={12} />,
                badge: 'PDF',
                badgeColor: '#10b981',
                onExecute: () => onOpenPDF('CERTIFICATE'),
              },
              {
                id: 'sub-studio-quantum-monograph',
                label: 'Generate Quantum Monograph Dossier (3P PDF)',
                type: 'command',
                icon: <FileDown size={12} />,
                badge: 'PDF',
                badgeColor: '#c084fc',
                onExecute: () => onOpenPDF('QUANTUM'),
              },
            ],
          },
        ],
      },
    ],
    [
      activeTab,
      selectedEntity,
      selectedArchetype,
      reportsCount,
      onSetCameraPreset,
      onSelectArchetype,
      onSelectTab,
      onSelectEntity,
      onOpenConfig,
      onOpenQuickDrawer,
      onOpenPDF,
      onToggleExplainer,
      onToggleQuantumPanel,
      onOpenConceptModal,
      onOpenStepsModal,
      onToggleReportsPanel,
      onOpenReportsStudio,
      onMinimizeAllPanels,
      onRestoreAllPanels,
      isExplainerOpen,
    ]
  );

  // Search Results filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: { item: SubMenuItem; pillar: PillarCategory; path: string }[] = [];

    const traverse = (items: SubMenuItem[], pillar: PillarCategory, currentPath: string) => {
      items.forEach((item) => {
        const itemPath = currentPath ? `${currentPath} › ${item.label}` : item.label;
        const matchesLabel = item.label.toLowerCase().includes(q);
        const matchesShort = item.shortLabel?.toLowerCase().includes(q);
        const matchesTooltip = item.tooltip?.toLowerCase().includes(q);
        if (matchesLabel || matchesShort || matchesTooltip) {
          results.push({ item, pillar, path: itemPath });
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children, pillar, itemPath);
        }
      });
    };

    pillars.forEach((pillar) => {
      traverse(pillar.items, pillar, pillar.title);
    });

    return results;
  }, [searchQuery, pillars]);

  // Global Expand / Collapse Handlers
  const handleExpandAll = () => {
    const allPillars = new Set(pillars.map((p) => p.id));
    const allGroups = new Set<string>();
    const collectGroups = (items: SubMenuItem[]) => {
      items.forEach((it) => {
        if (it.children && it.children.length > 0) {
          allGroups.add(it.id);
          collectGroups(it.children);
        }
      });
    };
    pillars.forEach((p) => collectGroups(p.items));

    setExpandedPillars(allPillars);
    setExpandedSubGroups(allGroups);
    trackButtonClick('Expand_All_Sidebar', 'Sidebar');
  };

  const handleCollapseAll = () => {
    setExpandedPillars(new Set());
    setExpandedSubGroups(new Set());
    trackButtonClick('Collapse_All_Sidebar', 'Sidebar');
  };

  // Toggle single pillar accordion
  const togglePillar = (pillarId: string) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(pillarId)) {
        next.delete(pillarId);
      } else {
        next.add(pillarId);
      }
      return next;
    });
  };

  // Toggle sub-group accordion
  const toggleSubGroup = (groupId: string) => {
    setExpandedSubGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Splitter Drag Handlers
  const handleMouseDownSplitter = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const rawWidth = dragStartWidthRef.current + deltaX;
      // Snapping thresholds
      if (rawWidth < 120) {
        setSidebarWidth(56);
        setIsExpanded(false);
      } else {
        const clamped = Math.max(200, Math.min(window.innerWidth * 0.45, Math.min(480, rawWidth)));
        setSidebarWidth(clamped);
        setIsExpanded(true);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Splitter Double Click: Cycle Preset Snaps
  const handleDoubleClickSplitter = () => {
    if (!isExpanded || sidebarWidth === 56) {
      setIsExpanded(true);
      setSidebarWidth(260);
    } else if (sidebarWidth < 320) {
      setSidebarWidth(380);
    } else {
      setIsExpanded(false);
      setSidebarWidth(56);
    }
  };

  // Execute an item action
  const handleExecuteItem = (item: SubMenuItem, pillar?: PillarCategory, parentGroup?: SubMenuItem) => {
    // 1. Resolve canonical route for this sidebar entry point
    const route =
      findRouteByItemId(item.id) ||
      (item.targetTab
        ? NAVIGATION_ROUTES.find((r) => r.targetTab === item.targetTab && r.menuLevel === 2)
        : undefined);

    if (route) {
      if (typeof window !== 'undefined' && window.location.pathname !== route.path) {
        window.history.pushState(null, '', route.path);
      }
      updatePageMetadata(route.meta);
      trackSidebarNavigation({
        routePath: route.path,
        itemId: route.id,
        itemLabel: route.label,
        menuLevel: route.menuLevel,
        pillarId: pillar?.id || route.pillarId,
        pillarTitle: pillar?.title || route.pillarTitle,
        pageTitle: route.meta.title,
        entryMethod: 'sidebar_click',
      });
    }

    if (onNavigate) {
      onNavigate(item, pillar, parentGroup);
    }
    if (item.targetTab) {
      onSelectTab(item.targetTab);
    }
    if (item.onExecute) {
      item.onExecute();
    } else if (item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to highlight matching text
  const renderHighlighted = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} style={{ color: '#00f0ff', fontWeight: 700, textDecoration: 'underline' }}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const actualWidth = isExpanded ? sidebarWidth : 56;

  return (
    <>
      {/* Global Drag Overlay during Splitter movement to prevent iframe/canvas event capture */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            cursor: 'col-resize',
            userSelect: 'none',
          }}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`sidebar-shell ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        style={{
          width: `${actualWidth}px`,
          minWidth: `${actualWidth}px`,
          maxWidth: `${actualWidth}px`,
          height: '100%',
          backgroundColor: '#070f1e',
          borderRight: '1px solid rgba(0, 240, 255, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          position: isPinned ? 'relative' : 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 80,
          transition: isDragging ? 'none' : 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isPinned ? 'none' : '10px 0 35px rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(20px)',
          userSelect: 'none',
        }}
      >
        {/* Sidebar Header & Brand / Mode Controls */}
        <div
          style={{
            padding: isExpanded ? '10px 12px' : '10px 6px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'space-between' : 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {isExpanded ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: '#00f0ff',
                    textTransform: 'uppercase',
                  }}
                >
                  NAVIGATION DECK
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    background: 'rgba(0, 240, 255, 0.12)',
                    color: '#00f0ff',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {pillars.length} PILLARS & STUDIOS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isPinned ? '#00f0ff' : '#64748b',
                    cursor: 'pointer',
                    padding: '3px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isPinned ? 'Unpin Sidebar (Floating Overlay)' : 'Pin Sidebar (Push Workspace)'}
                >
                  {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '3px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Collapse to Icon Rail (Ctrl+B)"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00f0ff',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Expand Sidebar (Ctrl+B)"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>

        {/* Search & Command Omnibar (Visible only in Expanded Mode) */}
        {isExpanded && (
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', flexShrink: 0 }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: isSearchFocused ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                padding: '0 8px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <Search size={13} color={isSearchFocused ? '#00f0ff' : '#64748b'} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menus, AMRs, Qmod..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f1f5f9',
                  fontSize: '11px',
                  padding: '5px 6px',
                }}
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                >
                  <X size={11} />
                </button>
              ) : (
                <span
                  style={{
                    fontSize: '9px',
                    color: '#64748b',
                    background: 'rgba(255, 255, 255, 0.06)',
                    padding: '1px 4px',
                    borderRadius: '3px',
                  }}
                >
                  Ctrl+/
                </span>
              )}
            </div>
          </div>
        )}

        {/* Macro Toolbar: Expand All / Collapse All */}
        {isExpanded && !searchQuery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              fontSize: '10px',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleExpandAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 4px',
                  borderRadius: '3px',
                }}
                title="Expand all pillars and sub-menus (Alt+E)"
              >
                <ChevronsDownUp size={11} /> Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 4px',
                  borderRadius: '3px',
                }}
                title="Collapse all pillars (Alt+C)"
              >
                <ChevronsUpDown size={11} /> Collapse All
              </button>
            </div>
            <span>{expandedPillars.size}/{pillars.length} Open</span>
          </div>
        )}



        {/* Search Results Display Mode */}
        {isExpanded && searchQuery.trim().length > 0 ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px' }}>
              FOUND {searchResults.length} COMMANDS / ITEMS
            </div>
            {searchResults.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#64748b', padding: '16px 8px', textAlign: 'center' }}>
                No commands matching "{searchQuery}"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searchResults.map(({ item, pillar, path }) => (
                  <div
                    key={item.id}
                    onClick={() => handleExecuteItem(item, pillar)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                        {renderHighlighted(item.label, searchQuery)}
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>{path}</div>
                    </div>
                    {item.shortcut && (
                      <span style={{ fontSize: '9px', color: '#00f0ff', opacity: 0.8 }}>{item.shortcut}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isExpanded ? (
          /* Multi-Level Hierarchical Navigation Tree (Expanded) */
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '8px 10px 50px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pillars.map((pillar) => {
              const isPillarExpanded = expandedPillars.has(pillar.id);
              return (
                <div key={pillar.id} style={{ borderRadius: '6px' }}>
                  {/* Pillar Header Accordion */}
                  <div
                    onClick={() => {
                      const route = findRouteByItemId(pillar.id);
                      if (route) {
                        if (typeof window !== 'undefined' && window.location.pathname !== route.path) {
                          window.history.pushState(null, '', route.path);
                        }
                        updatePageMetadata(route.meta);
                        trackSidebarNavigation({
                          routePath: route.path,
                          itemId: route.id,
                          itemLabel: route.label,
                          menuLevel: 1,
                          pillarId: pillar.id,
                          pillarTitle: pillar.title,
                          pageTitle: route.meta.title,
                          entryMethod: 'sidebar_click',
                        });
                      }
                      if (pillar.onExecute) {
                        pillar.onExecute();
                      }
                      togglePillar(pillar.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      borderRadius: '6px',
                      backgroundColor: pillar.isActive
                        ? `${pillar.color}22`
                        : isPillarExpanded
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'transparent',
                      border: pillar.isActive ? `1px solid ${pillar.color}60` : '1px solid transparent',
                      boxShadow: pillar.isActive ? `0 0 10px ${pillar.color}25` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!pillar.isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                    }}
                    onMouseLeave={(e) => {
                      if (!pillar.isActive) e.currentTarget.style.backgroundColor = isPillarExpanded ? 'rgba(255, 255, 255, 0.04)' : 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: pillar.color }}>{pillar.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: pillar.isActive ? '#ffffff' : '#f1f5f9' }}>{pillar.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {pillar.badge && (
                        <span
                          style={{
                            fontSize: '9px',
                            color: pillar.badgeColor || pillar.color,
                            backgroundColor: `${pillar.badgeColor || pillar.color}1a`,
                            border: `1px solid ${pillar.badgeColor || pillar.color}40`,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {pillar.badge}
                        </span>
                      )}
                      {isPillarExpanded ? <ChevronDown size={12} color="#94a3b8" /> : <ChevronRight size={12} color="#94a3b8" />}
                    </div>
                  </div>

                  {/* Pillar Sub-Items List */}
                  {isPillarExpanded && (
                    <div
                      style={{
                        paddingLeft: '12px',
                        marginLeft: '8px',
                        borderLeft: `1px solid ${pillar.color}35`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        marginTop: '3px',
                        marginBottom: '4px',
                      }}
                    >
                      {pillar.items.map((menuItem) => {
                        const isTabActive = menuItem.type === 'tab' && menuItem.targetTab === activeTab;
                        const hasChildren = menuItem.children && menuItem.children.length > 0;
                        const isGroupExpanded = expandedSubGroups.has(menuItem.id);

                        return (
                          <div key={menuItem.id}>
                            <div
                              onClick={() => {
                                if (hasChildren) {
                                  toggleSubGroup(menuItem.id);
                                }
                                handleExecuteItem(menuItem, pillar);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                backgroundColor: isTabActive ? `${pillar.color}22` : 'transparent',
                                border: isTabActive ? `1px solid ${pillar.color}60` : '1px solid transparent',
                                color: isTabActive ? pillar.color : '#cbd5e1',
                                cursor: 'pointer',
                                fontSize: '11px',
                                transition: 'all 0.12s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isTabActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isTabActive) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title={menuItem.tooltip || menuItem.label}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                {menuItem.icon && (
                                  <span style={{ color: isTabActive ? pillar.color : '#94a3b8', flexShrink: 0 }}>
                                    {menuItem.icon}
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontWeight: isTabActive ? 700 : 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {menuItem.label}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {menuItem.badge && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      backgroundColor: `${menuItem.badgeColor || pillar.color}1f`,
                                      color: menuItem.badgeColor || pillar.color,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {menuItem.badge}
                                  </span>
                                )}
                                {hasChildren && (
                                  <span style={{ color: '#64748b' }}>
                                    {isGroupExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Nested Level-3 Sub-Menus / Entity Leaves */}
                            {hasChildren && isGroupExpanded && (
                              <div
                                style={{
                                  paddingLeft: '10px',
                                  marginLeft: '6px',
                                  borderLeft: '1px dashed rgba(255, 255, 255, 0.12)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  marginTop: '2px',
                                }}
                              >
                                {menuItem.children!.map((child) => {
                                  const isChildEntityActive =
                                    (selectedEntity && normalizeEntityId(selectedEntity.id) === normalizeEntityId(child.id)) ||
                                    (cameraPreset && (
                                      (child.id === 'sub-facility-envelope' && cameraPreset === 'overview') ||
                                      (child.id === 'cam-top' && cameraPreset === 'top') ||
                                      (child.id === 'cam-iso' && cameraPreset === 'isometric') ||
                                      (child.id === 'cam-follow' && cameraPreset === 'follow') ||
                                      (child.id === 'cam-chute' && cameraPreset === 'chute-focus')
                                    )) ||
                                    (selectedTier && (
                                      (child.id === 'sub-tier-1' && selectedTier === 'tier1') ||
                                      (child.id === 'sub-tier-2' && selectedTier === 'tier2') ||
                                      (child.id === 'sub-tier-3' && selectedTier === 'tier3') ||
                                      (child.id === 'sub-tier-4' && selectedTier === 'tier4')
                                    )) ||
                                    (activeTab === 'graphs' && (
                                      (child.id === 'sub-pareto' && (selectedGraphId === 'pareto' || !selectedGraphId)) ||
                                      (child.id === 'sub-benchmarks' && (selectedGraphId === 'benders' || selectedGraphId === 'velocity')) ||
                                      (child.id === 'sub-heatmaps' && (selectedGraphId === 'spatiotemporal_heatmap' || selectedGraphId === 'chutes'))
                                    )) ||
                                    (activeTab === 'comparison' && (
                                      (child.id === 'sub-delta-audit' && (selectedComparisonMode === 'DELTA_AUDIT' || !selectedComparisonMode)) ||
                                      (child.id === 'sub-regression-table' && selectedComparisonMode === 'GRID_FOCUS')
                                    )) ||
                                    (activeTab === 'investigation' && (
                                      (child.id === 'sub-investigation-timeline' && (selectedInvestigationSubTab === 'timeline' || !selectedInvestigationSubTab)) ||
                                      (child.id === 'sub-investigation-gates' && selectedInvestigationSubTab === 'gates') ||
                                      (child.id === 'sub-investigation-chutes' && selectedInvestigationSubTab === 'chutes') ||
                                      (child.id === 'sub-investigation-quantum' && selectedInvestigationSubTab === 'quantum') ||
                                      (child.id === 'sub-investigation-carbon' && selectedInvestigationSubTab === 'carbon')
                                    ));
                                  const hasSubSubChildren = child.children && child.children.length > 0;
                                  const isSubSubExpanded = expandedSubGroups.has(child.id);

                                  return (
                                    <div key={child.id}>
                                      <div
                                        onClick={() => {
                                          if (hasSubSubChildren) {
                                            toggleSubGroup(child.id);
                                          }
                                          handleExecuteItem(child, pillar, menuItem);
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: isChildEntityActive
                                            ? 'rgba(0, 240, 255, 0.22)'
                                            : 'transparent',
                                          border: isChildEntityActive
                                            ? '1px solid #00f0ff'
                                            : '1px solid transparent',
                                          boxShadow: isChildEntityActive
                                            ? '0 0 8px rgba(0, 240, 255, 0.3)'
                                            : 'none',
                                          color: isChildEntityActive ? '#ffffff' : '#94a3b8',
                                          fontWeight: isChildEntityActive ? 700 : 500,
                                          cursor: 'pointer',
                                          fontSize: '10.5px',
                                          transition: 'all 0.1s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isChildEntityActive)
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isChildEntityActive) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          {isChildEntityActive && (
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }} />
                                          )}
                                          {child.icon}
                                          <span>{child.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          {isChildEntityActive && !hasSubSubChildren ? (
                                            <span
                                              style={{
                                                fontSize: '8px',
                                                padding: '1px 5px',
                                                borderRadius: '3px',
                                                backgroundColor: 'rgba(0, 240, 255, 0.3)',
                                                color: '#00f0ff',
                                                fontWeight: 800,
                                                border: '1px solid #00f0ff',
                                              }}
                                            >
                                              ● ACTIVE
                                            </span>
                                          ) : child.badge && (
                                            <span
                                              style={{
                                                fontSize: '8.5px',
                                                padding: '1px 4px',
                                                borderRadius: '3px',
                                                backgroundColor: `${child.badgeColor || '#64748b'}20`,
                                                color: child.badgeColor || '#94a3b8',
                                                fontWeight: 600,
                                              }}
                                            >
                                              {child.badge}
                                            </span>
                                          )}
                                          {hasSubSubChildren && (
                                            <span style={{ color: '#64748b' }}>
                                              {isSubSubExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Level 4 Leaf Nodes (e.g. AMRs under Fleet list) */}
                                      {hasSubSubChildren && isSubSubExpanded && (
                                        <div
                                          style={{
                                            paddingLeft: '10px',
                                            marginLeft: '6px',
                                            borderLeft: '1px dotted rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1px',
                                            marginTop: '1px',
                                          }}
                                        >
                                          {child.children!.map((leaf) => {
                                            const isLeafActive =
                                              (selectedEntity && normalizeEntityId(selectedEntity.id) === normalizeEntityId(leaf.id)) ||
                                              (cameraPreset && (
                                                (leaf.id === 'cam-top' && cameraPreset === 'top') ||
                                                (leaf.id === 'cam-iso' && cameraPreset === 'isometric') ||
                                                (leaf.id === 'cam-follow' && cameraPreset === 'follow') ||
                                                (leaf.id === 'cam-chute' && cameraPreset === 'chute-focus')
                                              )) ||
                                              (selectedArchetype && (
                                                (leaf.id === 'arch-mega' && selectedArchetype === 'MEGA_FULFILLMENT_E_COMMERCE') ||
                                                (leaf.id === 'arch-auto' && selectedArchetype === 'AUTOMOTIVE_JUST_IN_SEQUENCE') ||
                                                (leaf.id === 'arch-cold' && selectedArchetype === 'PHARMACEUTICAL_COLD_CHAIN') ||
                                                (leaf.id === 'arch-micro' && selectedArchetype === 'URBAN_MICRO_FULFILLMENT') ||
                                                (leaf.id === 'arch-heavy' && selectedArchetype === 'HEAVY_INDUSTRIAL_LOGISTICS')
                                              ));
                                            return (
                                              <div
                                                key={leaf.id}
                                                onClick={() => handleExecuteItem(leaf, pillar, child)}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  padding: '4px 8px',
                                                  borderRadius: '4px',
                                                  backgroundColor: isLeafActive
                                                    ? 'rgba(0, 240, 255, 0.25)'
                                                    : 'transparent',
                                                  border: isLeafActive
                                                    ? '1px solid #00f0ff'
                                                    : '1px solid transparent',
                                                  boxShadow: isLeafActive
                                                    ? '0 0 10px rgba(0, 240, 255, 0.35)'
                                                    : 'none',
                                                  color: isLeafActive ? '#ffffff' : '#94a3b8',
                                                  fontWeight: isLeafActive ? 700 : 500,
                                                  cursor: 'pointer',
                                                  fontSize: '10px',
                                                  transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                  if (!isLeafActive)
                                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                  if (!isLeafActive) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                  {isLeafActive && (
                                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#00f0ff', boxShadow: '0 0 6px #00f0ff' }} />
                                                  )}
                                                  <span>{leaf.label}</span>
                                                </div>
                                                {isLeafActive ? (
                                                  <span
                                                    style={{
                                                      fontSize: '8.5px',
                                                      padding: '1px 5px',
                                                      borderRadius: '3px',
                                                      backgroundColor: 'rgba(0, 240, 255, 0.3)',
                                                      color: '#00f0ff',
                                                      fontWeight: 800,
                                                      border: '1px solid #00f0ff',
                                                      boxShadow: '0 0 6px rgba(0, 240, 255, 0.4)',
                                                      letterSpacing: '0.04em',
                                                    }}
                                                  >
                                                    ● FOCUS
                                                  </span>
                                                ) : leaf.badge && (
                                                  <span
                                                    style={{
                                                      fontSize: '8px',
                                                      padding: '1px 4px',
                                                      borderRadius: '3px',
                                                      backgroundColor: `${leaf.badgeColor || '#64748b'}20`,
                                                      color: leaf.badgeColor || '#94a3b8',
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {leaf.badge}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Collapsed Icon Rail (56px) */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 0',
              gap: '10px',
            }}
          >


            {pillars.map((pillar) => {
              const isPillarActive = pillar.isActive || pillar.items.some(
                (item) => item.type === 'tab' && item.targetTab === activeTab
              );
              return (
                <div
                  key={pillar.id}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => {
                    clearTimeout(flyoutTimeoutRef.current);
                    setHoveredPillar(pillar);
                  }}
                  onMouseLeave={() => {
                    flyoutTimeoutRef.current = setTimeout(() => {
                      setHoveredPillar(null);
                    }, 200);
                  }}
                >
                  <button
                    onClick={() => {
                      if (pillar.onExecute) {
                        pillar.onExecute();
                      } else {
                        setIsExpanded(true);
                        setExpandedPillars(new Set([pillar.id]));
                      }
                    }}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: isPillarActive ? `${pillar.color}25` : 'rgba(255, 255, 255, 0.03)',
                      border: isPillarActive ? `1px solid ${pillar.color}70` : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isPillarActive ? pillar.color : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: isPillarActive ? `0 0 12px ${pillar.color}40` : 'none',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    title={pillar.title}
                  >
                    {pillar.icon}
                    {pillar.isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: pillar.color,
                          boxShadow: `0 0 6px ${pillar.color}`,
                        }}
                      />
                    )}
                  </button>

                  {/* Floating Flyout Card on Hover in Collapsed Mode */}
                  {hoveredPillar?.id === pillar.id && (
                    <div
                      className="floating-flyout-card glass-panel"
                      onMouseEnter={() => clearTimeout(flyoutTimeoutRef.current)}
                      onMouseLeave={() => setHoveredPillar(null)}
                      style={{
                        position: 'fixed',
                        left: '60px',
                        zIndex: 1000,
                        width: '260px',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(7, 15, 30, 0.96)',
                        border: `1px solid ${pillar.color}50`,
                        boxShadow: `0 12px 35px rgba(0, 0, 0, 0.8), 0 0 20px ${pillar.color}25`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: pillar.color,
                          letterSpacing: '0.04em',
                          marginBottom: '8px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          paddingBottom: '4px',
                        }}
                      >
                        {pillar.title}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {pillar.items.map((it) => (
                          <div
                            key={it.id}
                            onClick={() => {
                              handleExecuteItem(it, pillar);
                              setHoveredPillar(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 7px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: it.targetTab === activeTab ? pillar.color : '#cbd5e1',
                              backgroundColor: it.targetTab === activeTab ? `${pillar.color}20` : 'transparent',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${pillar.color}15`;
                            }}
                            onMouseLeave={(e) => {
                              if (it.targetTab !== activeTab) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {it.icon}
                              <span>{it.label}</span>
                            </div>
                            {it.shortcut && (
                              <span style={{ fontSize: '9px', color: '#64748b' }}>{it.shortcut}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Persistent Bottom Runner Card (OpenAPI / Swagger UI :8080 & A-Z Glossary) */}
        {isExpanded ? (
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(0, 240, 255, 0.15)',
              backgroundColor: 'rgba(7, 14, 28, 0.9)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* Frozen High-Visibility A-Z Engineering Glossary Button */}
            <div
              onClick={() => {
                onSelectTab('glossary');
                if (typeof window !== 'undefined' && window.location.pathname !== '/glossary') {
                  window.history.pushState(null, '', '/glossary');
                }
                updatePageMetadata({
                  title: 'A–Z Engineering Glossary & Lexicon',
                  description: 'Comprehensive A-Z lexicon with full-text search covering quantum algorithms, VRP formulations, cyber-physical invariant gates, ISO standards, and KaTeX mathematical proofs.',
                  canonicalPath: '/glossary',
                });
                trackSidebarNavigation({
                  routePath: '/glossary',
                  itemId: 'glossary-studio',
                  itemLabel: 'A–Z Engineering Glossary',
                  menuLevel: 1,
                  pillarId: 'pillar-documentation',
                  pillarTitle: 'Engineering Documentation & Lexicon',
                  pageTitle: 'A–Z Engineering Glossary & Lexicon',
                  entryMethod: 'sidebar_click',
                });
                trackButtonClick('Glossary_Bottom_Dock_Click', 'Sidebar_Navigation');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 9px',
                borderRadius: '6px',
                backgroundColor: activeTab === 'glossary'
                  ? 'rgba(0, 240, 255, 0.2)'
                  : 'rgba(15, 23, 42, 0.7)',
                border: activeTab === 'glossary'
                  ? '1px solid #00f0ff'
                  : '1px solid rgba(0, 240, 255, 0.35)',
                boxShadow: activeTab === 'glossary'
                  ? '0 0 14px rgba(0, 240, 255, 0.35)'
                  : 'none',
                color: '#ffffff',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.25)';
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 240, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeTab === 'glossary' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(15, 23, 42, 0.7)';
                e.currentTarget.style.borderColor = activeTab === 'glossary' ? '#00f0ff' : 'rgba(0, 240, 255, 0.35)';
                e.currentTarget.style.boxShadow = activeTab === 'glossary' ? '0 0 14px rgba(0, 240, 255, 0.35)' : 'none';
              }}
              title="A–Z Engineering Glossary & Lexicon (Ctrl+G)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.4), rgba(168, 85, 247, 0.5))',
                    border: '1px solid #00f0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={13} color="#ffffff" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>A–Z Glossary</span>
                    <span
                      style={{
                        fontSize: '8px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(0, 240, 255, 0.3)',
                        color: '#00f0ff',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                      }}
                    >
                      50+
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Schemas, Math &amp; Standards</span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '8.5px',
                  color: '#00f0ff',
                  background: 'rgba(0, 240, 255, 0.15)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                Ctrl+G
              </span>
            </div>

            <a
              href="http://127.0.0.1:8080/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 9px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                color: '#34d399',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.22)';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Open DispatchEngine OpenAPI Swagger UI interactive docs on port 8080"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    border: '1px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Code size={13} color="#10b981" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f0fdf4' }}>OpenAPI (Swagger)</span>
                    <span
                      style={{
                        fontSize: '8px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        fontWeight: 800,
                      }}
                    >
                      :8080
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Live Engine REST & WS Runner</span>
                </div>
              </div>
              <ExternalLink size={13} color="#34d399" />
            </a>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {/* Frozen High-Visibility A-Z Engineering Glossary Button (Collapsed) */}
            <div
              onClick={() => {
                onSelectTab('glossary');
                if (typeof window !== 'undefined' && window.location.pathname !== '/glossary') {
                  window.history.pushState(null, '', '/glossary');
                }
                updatePageMetadata({
                  title: 'A–Z Engineering Glossary & Lexicon',
                  description: 'Comprehensive A-Z lexicon with full-text search covering quantum algorithms, VRP formulations, cyber-physical invariant gates, ISO standards, and KaTeX mathematical proofs.',
                  canonicalPath: '/glossary',
                });
                trackSidebarNavigation({
                  routePath: '/glossary',
                  itemId: 'glossary-studio',
                  itemLabel: 'A–Z Engineering Glossary',
                  menuLevel: 1,
                  pillarId: 'pillar-documentation',
                  pillarTitle: 'Engineering Documentation & Lexicon',
                  pageTitle: 'A–Z Engineering Glossary & Lexicon',
                  entryMethod: 'sidebar_click',
                });
                trackButtonClick('Glossary_Bottom_Dock_Click', 'Sidebar_Navigation');
              }}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: activeTab === 'glossary'
                  ? 'rgba(0, 240, 255, 0.25)'
                  : 'rgba(15, 23, 42, 0.8)',
                border: activeTab === 'glossary'
                  ? '1px solid #00f0ff'
                  : '1px solid rgba(0, 240, 255, 0.4)',
                boxShadow: activeTab === 'glossary'
                  ? '0 0 12px rgba(0, 240, 255, 0.4)'
                  : 'none',
                color: '#00f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.3)';
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeTab === 'glossary' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(15, 23, 42, 0.8)';
                e.currentTarget.style.borderColor = activeTab === 'glossary' ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
                e.currentTarget.style.boxShadow = activeTab === 'glossary' ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none';
              }}
              title="A–Z Engineering Glossary & Lexicon (Ctrl+G)"
            >
              <BookOpen size={16} color="#00f0ff" />
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  fontSize: '7px',
                  fontWeight: 900,
                  color: '#020617',
                  backgroundColor: '#00f0ff',
                  borderRadius: '2px',
                  padding: '0 2px',
                  lineHeight: '1.2',
                }}
              >
                A-Z
              </span>
            </div>

            <a
              href="http://127.0.0.1:8080/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="OpenAPI (Swagger UI) API Runner (http://127.0.0.1:8080/docs)"
            >
              <Code size={16} color="#34d399" />
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
            </a>
          </div>
        )}

        {/* Dynamic Draggable Splitter Handle (Col-Resize) */}
        <div
          onMouseDown={handleMouseDownSplitter}
          onDoubleClick={handleDoubleClickSplitter}
          className={`sidebar-splitter ${isDragging ? 'sidebar-splitter-active' : ''}`}
          style={{
            position: 'absolute',
            right: '-3px',
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Drag to resize sidebar width • Double-click to cycle snap presets (56px ⇄ 260px ⇄ 380px)"
        >
          <div
            style={{
              width: '2px',
              height: '32px',
              borderRadius: '2px',
              backgroundColor: isDragging ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)',
              boxShadow: isDragging ? '0 0 10px #00f0ff' : 'none',
              transition: 'background-color 0.15s ease',
            }}
          />
        </div>
      </aside>
    </>
  );
};
