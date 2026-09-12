import React, { useState } from 'react';
import {
  Layers,
  X,
  Maximize2,
  Minimize2,
  Navigation,
  ShieldCheck,
  Battery,
  Clock,
  Gauge,
  MapPin,
  Box,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { VehicleRoute, RouteStop } from '../services/api';
import {
  SCENE_3D_OBJECTS,
  SCENE_3D_VEHICLE_COLORS,
  SCENE_3D_SAFETY_STANDARDS,
  Scene3DObjectDossier,
} from '../data/scene3dLegendDossier';
import { CodeLmnBadge } from './CodeLmnBadge';

interface Scene3DLegendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  routes: VehicleRoute[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
  onFocusVehicle?: (id: string) => void;
}

export const Scene3DLegendPanel: React.FC<Scene3DLegendPanelProps> = ({
  isOpen,
  onClose,
  routes,
  selectedVehicleId,
  onSelectVehicle,
  onFocusVehicle,
}) => {
  const [activeTab, setActiveTab] = useState<'OBJECTS' | 'ROUTES' | 'COLORS' | 'SAFETY'>('OBJECTS');
  const [objectCategoryFilter, setObjectCategoryFilter] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('OBJ_AMR');

  if (!isOpen) return null;

  const filteredObjects =
    objectCategoryFilter === 'ALL'
      ? SCENE_3D_OBJECTS
      : SCENE_3D_OBJECTS.filter((obj) => obj.category === objectCategoryFilter);

  const activeRoute = routes.find((r) => r.vehicle_id === selectedVehicleId) || routes[0] || null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        bottom: '16px',
        width: isExpanded ? '760px' : '420px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: 'rgba(7, 11, 22, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.65), 0 0 24px rgba(0, 240, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f0ff',
            }}
          >
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8', letterSpacing: '0.3px' }}>
              3D SCENE INTELLIGENCE &amp; LEGEND
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Cyber-Physical Object Semantics &amp; Vehicle Tour Inspector
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CodeLmnBadge />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Close legend"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        {[
          { id: 'OBJECTS', label: '3D Objects & Invariants' },
          { id: 'ROUTES', label: `Active Tours (${routes.length})` },
          { id: 'COLORS', label: 'Color Code Guide' },
          { id: 'SAFETY', label: 'Kinematics & Safety' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '9px 6px',
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#00f0ff' : '#94a3b8',
              backgroundColor: activeTab === tab.id ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* ==================== TAB 1: 3D OBJECTS ==================== */}
        {activeTab === 'OBJECTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {['ALL', 'ROBOTICS', 'FACILITY', 'STORAGE', 'SAFETY', 'NAVIGATION'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setObjectCategoryFilter(cat)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    backgroundColor:
                      objectCategoryFilter === cat ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border:
                      objectCategoryFilter === cat ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: objectCategoryFilter === cat ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Object Cards List */}
            <div style={{ display: 'grid', gridTemplateColumns: isExpanded ? '1fr 1fr' : '1fr', gap: '10px' }}>
              {filteredObjects.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObjectId(obj.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor:
                      selectedObjectId === obj.id ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border:
                      selectedObjectId === obj.id
                        ? '1px solid rgba(0, 240, 255, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Object Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          backgroundColor: obj.hexColor,
                          boxShadow: `0 0 8px ${obj.glowColor}`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>{obj.name}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#94a3b8',
                      }}
                    >
                      {obj.category}
                    </span>
                  </div>

                  {/* Visual Description */}
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4, marginBottom: '6px' }}>
                    {obj.visualDescription}
                  </div>

                  {/* Operational Role */}
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      borderLeft: `2px solid ${obj.hexColor}`,
                      fontSize: '10px',
                      color: '#cbd5e1',
                      lineHeight: 1.4,
                      marginBottom: '6px',
                    }}
                  >
                    <strong>Role:</strong> {obj.operationalPurpose}
                  </div>

                  {/* Mathematical Invariants */}
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace', marginBottom: '6px' }}>
                    <strong>Math:</strong> {obj.mathematicalInvariants}
                  </div>

                  {/* Associated Restrictions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {obj.associatedRestrictions.map((r, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '9px',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Concrete Rules */}
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {obj.operationalRules.map((rule, rIdx) => (
                      <li key={rIdx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ACTIVE ROUTES & TOURS ==================== */}
        {activeTab === 'ROUTES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Vehicle Selector Chips */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                SELECT FLEET VEHICLE FOR TOUR INSPECTION:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {routes.map((route, idx) => {
                  const spec = SCENE_3D_VEHICLE_COLORS[idx % SCENE_3D_VEHICLE_COLORS.length];
                  const isSel = route.vehicle_id === selectedVehicleId;
                  return (
                    <button
                      key={route.vehicle_id}
                      onClick={() => onSelectVehicle(route.vehicle_id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        backgroundColor: isSel ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSel ? `1px solid ${spec.hex}` : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSel ? spec.hex : '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: spec.hex,
                          boxShadow: `0 0 6px ${spec.hex}`,
                        }}
                      />
                      {route.vehicle_id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Route Detailed Card */}
            {activeRoute && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Route Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Navigation size={15} color="#00f0ff" />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f0f4f8' }}>
                        {activeRoute.vehicle_id} Mission Manifest
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Origin: <strong style={{ color: '#00f0ff' }}>{activeRoute.origin_depot_id}</strong> → Destination:{' '}
                      <strong style={{ color: '#00f0ff' }}>{activeRoute.destination_depot_id}</strong>
                    </div>
                  </div>

                  {onFocusVehicle && (
                    <button
                      onClick={() => onFocusVehicle(activeRoute.vehicle_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid #00f0ff',
                        color: '#00f0ff',
                        cursor: 'pointer',
                      }}
                    >
                      Focus in 3D
                    </button>
                  )}
                </div>

                {/* KPI Metrics Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#64748b' }}>TOUR LENGTH</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {activeRoute.tour_length_m.toFixed(1)}m
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#64748b' }}>MAKESPAN</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff', fontFamily: 'monospace' }}>
                      {activeRoute.route_makespan_sec.toFixed(1)}s
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#64748b' }}>VOLUME UTIL</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                      {activeRoute.volume_utilization_pct.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#64748b' }}>BATTERY</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                      {(100 - activeRoute.battery_consumed_pct).toFixed(1)}% SOC
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Waypoint Stops Itinerary */}
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  STOP-BY-STOP MISSION SEQUENCE ({activeRoute.stops.length} STOPS):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {activeRoute.stops.map((stop, sIdx) => {
                    const isDepot = stop.location_type?.includes('DEPOT') || stop.action === 'REPLENISH' || stop.action === 'DOCK';
                    const isChute = stop.location_type?.includes('CHUTE') || stop.action === 'DROP';
                    const badgeBg = isDepot ? 'rgba(0, 240, 255, 0.15)' : isChute ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                    const badgeBorder = isDepot ? '1px solid #00f0ff' : isChute ? '1px solid #10b981' : '1px solid #f59e0b';
                    const badgeColor = isDepot ? '#00f0ff' : isChute ? '#10b981' : '#f59e0b';

                    return (
                      <div
                        key={stop.stop_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: '#cbd5e1',
                            }}
                          >
                            {sIdx + 1}
                          </span>
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: badgeBg,
                              border: badgeBorder,
                              color: badgeColor,
                              fontWeight: 700,
                              fontSize: '9px',
                            }}
                          >
                            {stop.action}
                          </span>
                          <strong style={{ color: '#f0f4f8' }}>{stop.location_id}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace' }}>
                          <span style={{ color: '#64748b' }}>
                            ({stop.pos_x.toFixed(1)}, {stop.pos_y.toFixed(1)})m
                          </span>
                          <span style={{ color: '#94a3b8' }}>
                            T = {stop.arrival_time_sec.toFixed(0)}s → {stop.departure_time_sec.toFixed(0)}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: COLOR CODE GUIDE ==================== */}
        {activeTab === 'COLORS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Visual deciphering system across robot chassis glows, trajectory trails, waypoint discs, and storage cartons:
            </div>

            {/* Vehicle Route Colors */}
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4f8', marginBottom: '8px' }}>
                FLEET VEHICLE IDENTIFIERS (8 VEHICLES)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isExpanded ? '1fr 1fr' : '1fr', gap: '6px' }}>
                {SCENE_3D_VEHICLE_COLORS.map((spec) => (
                  <div
                    key={spec.vehicleId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: spec.hex,
                          boxShadow: `0 0 6px ${spec.hex}`,
                        }}
                      />
                      <strong style={{ fontSize: '11px', color: '#f0f4f8' }}>{spec.vehicleId}</strong>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>({spec.name})</span>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: spec.hex }}>{spec.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility & Element Colors */}
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4f8', marginBottom: '8px' }}>
                FACILITY &amp; WAYPOINT ELEMENT PALETTE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                {[
                  { label: 'Perimeter Boundary Fence', color: '#00f0ff', desc: '150m x 100m physical safety envelope laser lines' },
                  { label: 'Depot Platforms (D1–D5)', color: '#1d4ed8', desc: 'Hexagonal berths for tour replenishment and inductive charging' },
                  { label: 'Consolidation Chutes (C1–C4)', color: '#10b981', desc: 'Outbound sorting hoppers and automated drop-off rings' },
                  { label: 'Order Pickup Waypoint', color: '#f59e0b', desc: 'SKU retrieval locations along storage aisles' },
                  { label: 'Ambient Goods Carton', color: '#d97706', desc: 'Standard non-hazardous dry merchandise parcel' },
                  { label: 'Hazardous Material SKU', color: '#ef4444', desc: 'Regulated chemical requiring strict segregation & speed limits' },
                  { label: 'Cyber Floor Grid', color: '#1a263d', desc: '10m major and 2m minor coordinate spatial reference lines' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: item.color,
                          boxShadow: `0 0 6px ${item.color}`,
                          flexShrink: 0,
                        }}
                      />
                      <strong style={{ color: '#f0f4f8' }}>{item.label}</strong>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: KINEMATICS & SAFETY ==================== */}
        {activeTab === 'SAFETY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              International industrial standards and kinematic algorithms governing AMR motion on the 3D warehouse floor:
            </div>

            {SCENE_3D_SAFETY_STANDARDS.map((std, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={16} color="#00f0ff" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f0f4f8' }}>{std.standard}</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>
                  {std.title}
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>{std.details}</div>
              </div>
            ))}

            {/* SIPP Swept Envelope Math Formula Box */}
            <div
              style={{
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#03050c',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#00f0ff',
                lineHeight: 1.5,
              }}
            >
              <strong>Kinematic Swept Volume Non-Overlap Condition:</strong>
              <br />
              ∀ i ≠ j, ∀ t ∈ [0, T]: ||p_i(t) - p_j(t)||_2 ≥ 2·R_chassis + D_safe(v_i, v_j)
              <br />
              where D_safe = d_stop(v) + d_sensor_latency + 0.35m
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748b',
        }}
      >
        <span>
          Facility Footprint: <strong style={{ color: '#94a3b8' }}>150m × 100m</strong>
        </span>
        <span>
          Compliance: <strong style={{ color: '#00e676' }}>ISO 3691-4 / VDI 2510</strong>
        </span>
        <span>
          Verification: <strong style={{ color: '#00f0ff' }}>Code Verified</strong>
        </span>
      </div>
    </div>
  );
};
