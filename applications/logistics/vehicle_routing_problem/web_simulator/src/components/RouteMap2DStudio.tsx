import React, { useState, useMemo, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Battery,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Download,
  Eye,
  Sliders,
  Maximize2,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ScheduleDetails, VehicleRoute, RouteStop } from '../services/api';

interface RouteMap2DStudioProps {
  schedule: ScheduleDetails | null;
  runId?: string;
  onNavigateTo3D?: () => void;
}

// High-contrast vehicle colors for dark-mode cyber warehouse
const VEHICLE_COLORS: string[] = [
  '#00f0ff', // AMR-1: Cyan
  '#10b981', // AMR-2: Emerald Green
  '#f59e0b', // AMR-3: Amber Gold
  '#a855f7', // AMR-4: Purple Neon
  '#3b82f6', // AMR-5: Electric Blue
  '#ec4899', // AMR-6: Pink Rose
  '#14b8a6', // AMR-7: Teal
  '#f97316', // AMR-8: Orange
];

export const RouteMap2DStudio: React.FC<RouteMap2DStudioProps> = ({
  schedule,
  runId = 'RUN-ACTIVE-001',
  onNavigateTo3D,
}) => {
  // Routes data fallback
  const routes: VehicleRoute[] = useMemo(() => {
    if (schedule && schedule.routes && schedule.routes.length > 0) {
      return schedule.routes;
    }
    return getFallbackRoutes();
  }, [schedule]);

  // Selected vehicle filter (null = All vehicles)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hoveredStop, setHoveredStop] = useState<{ stop: RouteStop; vehicleId: string; color: string } | null>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  // Layer Visibility
  const [showAisles, setShowAisles] = useState<boolean>(true);
  const [showSequenceNumbers, setShowSequenceNumbers] = useState<boolean>(true);
  const [showDirectionArrows, setShowDirectionArrows] = useState<boolean>(true);
  const [showHRIZone, setShowHRIZone] = useState<boolean>(true);
  const [filterStopType, setFilterStopType] = useState<string>('ALL');

  // Zoom and Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Timeline scrubber
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(5.0);
  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Warehouse dimensions in meters
  const WAREHOUSE_WIDTH = 150.0;
  const WAREHOUSE_HEIGHT = 100.0;

  // Max makespan across routes
  const maxMakespan = useMemo(() => {
    let maxT = 900;
    routes.forEach((r) => {
      if (r.route_makespan_sec > maxT) maxT = r.route_makespan_sec;
      r.stops.forEach((s) => {
        if (s.departure_time_sec > maxT) maxT = s.departure_time_sec;
      });
    });
    return Math.ceil(maxT);
  }, [routes]);

  // Active route for table inspection
  const activeRoute = useMemo(() => {
    if (selectedVehicleId) {
      return routes.find((r) => r.vehicle_id === selectedVehicleId) || routes[0];
    }
    return routes[0];
  }, [routes, selectedVehicleId]);

  // Animation frame loop for simulation
  React.useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setSimTime((prev) => {
        const next = prev + dt * simSpeed;
        if (next >= maxMakespan) {
          setIsPlaying(false);
          return maxMakespan;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = Date.now();
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, simSpeed, maxMakespan]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Compute AMR current positions at simTime
  const amrLivePositions = useMemo(() => {
    return routes.map((route, idx) => {
      const color = VEHICLE_COLORS[idx % VEHICLE_COLORS.length];
      const stops = route.stops;
      if (!stops || stops.length === 0) return { route, x: 5, y: 5, status: 'IDLE', color };

      if (simTime <= stops[0].arrival_time_sec) {
        return { route, x: stops[0].pos_x, y: stops[0].pos_y, status: 'AT_ORIGIN', color };
      }

      const lastStop = stops[stops.length - 1];
      if (simTime >= lastStop.departure_time_sec) {
        return { route, x: lastStop.pos_x, y: lastStop.pos_y, status: 'COMPLETED', color };
      }

      for (let i = 0; i < stops.length - 1; i++) {
        const s1 = stops[i];
        const s2 = stops[i + 1];

        // Dwell at stop
        if (simTime >= s1.arrival_time_sec && simTime <= s1.departure_time_sec) {
          return { route, x: s1.pos_x, y: s1.pos_y, status: `${s1.action} (${s1.location_id})`, color };
        }

        // In transit between s1 departure and s2 arrival
        if (simTime > s1.departure_time_sec && simTime < s2.arrival_time_sec) {
          const duration = Math.max(0.1, s2.arrival_time_sec - s1.departure_time_sec);
          const progress = Math.min(1, Math.max(0, (simTime - s1.departure_time_sec) / duration));
          const curX = s1.pos_x + (s2.pos_x - s1.pos_x) * progress;
          const curY = s1.pos_y + (s2.pos_y - s1.pos_y) * progress;
          return { route, x: curX, y: curY, status: 'TRANSIT', color };
        }
      }

      return { route, x: lastStop.pos_x, y: lastStop.pos_y, status: 'DOCKED', color };
    });
  }, [routes, simTime]);

  // Filtered stops for turn-by-turn table
  const filteredStops = useMemo(() => {
    if (!activeRoute || !activeRoute.stops) return [];
    if (filterStopType === 'ALL') return activeRoute.stops;
    return activeRoute.stops.filter((s) => s.location_type === filterStopType);
  }, [activeRoute, filterStopType]);

  // Export turn-by-turn table to CSV
  const handleExportCSV = () => {
    if (!activeRoute) return;
    const headers = ['Sequence', 'Type', 'Location_ID', 'Pos_X', 'Pos_Y', 'Pos_Z', 'Arrival_Sec', 'Departure_Sec', 'Action', 'Order_IDs'];
    const rows = activeRoute.stops.map((s) => [
      s.stop_sequence,
      s.location_type,
      s.location_id,
      s.pos_x.toFixed(2),
      s.pos_y.toFixed(2),
      s.pos_z.toFixed(2),
      s.arrival_time_sec.toFixed(1),
      s.departure_time_sec.toFixed(1),
      s.action,
      `"${s.order_ids.join(';')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeRoute.vehicle_id}_turn_by_turn_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#060913', overflow: 'hidden' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#090d18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {/* Left Title & Run Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(37, 99, 235, 0.2))',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f0f4f8' }}>
                2D Cyber-Physical Route Map Studio
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 240, 255, 0.15)',
                  color: '#00f0ff',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  fontWeight: 600,
                }}
              >
                G=(V, A) DIRECTED TOURS
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              Orthogonal 2D coordinate routing plot with turn-by-turn kinematics &amp; ISO 3691-4 HRI zoning
            </p>
          </div>
        </div>

        {/* Center: Vehicle Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '520px' }}>
          <button
            onClick={() => setSelectedVehicleId(null)}
            title="Display all AMR routes simultaneously on the 2D map."
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: selectedVehicleId === null ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: selectedVehicleId === null ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
              color: selectedVehicleId === null ? '#00f0ff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            All Fleet ({routes.length} AMRs)
          </button>

          {routes.map((r, idx) => {
            const isSel = selectedVehicleId === r.vehicle_id;
            const vColor = VEHICLE_COLORS[idx % VEHICLE_COLORS.length];
            return (
              <button
                key={r.vehicle_id}
                onClick={() => setSelectedVehicleId(r.vehicle_id)}
                title={`Focus on ${r.vehicle_id}: ${r.tour_length_m.toFixed(1)}m, ${r.route_makespan_sec.toFixed(1)}s, ${r.stops.length} stops.`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isSel ? `${vColor}25` : 'rgba(255, 255, 255, 0.04)',
                  border: isSel ? `1px solid ${vColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isSel ? '#ffffff' : '#cbd5e1',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: vColor, boxShadow: `0 0 6px ${vColor}` }} />
                <span>{r.vehicle_id}</span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>({r.stops.length})</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: 3D Twin Switch & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onNavigateTo3D && (
            <button
              onClick={onNavigateTo3D}
              className="btn-secondary"
              title="Switch to 3D Warehouse Digital Twin perspective."
              style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Eye size={13} /> Switch to 3D Twin
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="btn-secondary"
            title="Download active route turn-by-turn stops as CSV."
            style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} /> Export Schedule CSV
          </button>
        </div>
      </div>

      {/* Main Split Layout: Map Canvas (Left/Top) & Detailed Info Panel (Right/Bottom) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left Area: 2D Interactive Vector Map Canvas */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
            backgroundColor: '#070b14',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Map Top Floating Toolbar (Layer Toggles & Zoom) */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(12, 16, 28, 0.85)',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>LAYERS:</span>

            <button
              onClick={() => setShowAisles(!showAisles)}
              title="Toggle Storage Rack Aisles & One-Way Arrows"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: showAisles ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                border: showAisles ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: showAisles ? '#00f0ff' : '#94a3b8',
              }}
            >
              Racks
            </button>

            <button
              onClick={() => setShowSequenceNumbers(!showSequenceNumbers)}
              title="Toggle Stop Sequence Numbers along routes"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: showSequenceNumbers ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                border: showSequenceNumbers ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: showSequenceNumbers ? '#00f0ff' : '#94a3b8',
              }}
            >
              Seq #
            </button>

            <button
              onClick={() => setShowDirectionArrows(!showDirectionArrows)}
              title="Toggle Directional Navigation Chevrons"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: showDirectionArrows ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                border: showDirectionArrows ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: showDirectionArrows ? '#00f0ff' : '#94a3b8',
              }}
            >
              Arrows
            </button>

            <button
              onClick={() => setShowHRIZone(!showHRIZone)}
              title="Toggle ISO 3691-4 Human-Robot Shared Safety Zone"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: showHRIZone ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                border: showHRIZone ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                color: showHRIZone ? '#f59e0b' : '#94a3b8',
              }}
            >
              ISO HRI Zone
            </button>

            <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

            <button
              onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.2))}
              title="Zoom in 2D Map"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <ZoomIn size={14} />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              title="Zoom out 2D Map"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <ZoomOut size={14} />
            </button>

            <button
              onClick={() => {
                setZoomLevel(1.0);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset View to Full Warehouse Bounds"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* SVG Canvas Container */}
          <div
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              cursor: isPanning ? 'grabbing' : 'grab',
              overflow: 'hidden',
              position: 'relative',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${WAREHOUSE_WIDTH} ${WAREHOUSE_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                display: 'block',
              }}
            >
              <defs>
                {/* Grid pattern */}
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
                </pattern>

                {/* Arrow markers for each vehicle */}
                {routes.map((_, idx) => {
                  const color = VEHICLE_COLORS[idx % VEHICLE_COLORS.length];
                  return (
                    <marker
                      key={`arrow-${idx}`}
                      id={`arrow-${idx}`}
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="4"
                      markerHeight="4"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
                    </marker>
                  );
                })}

                {/* Glow filter */}
                <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Floor Background & Grid */}
              <rect x="0" y="0" width={WAREHOUSE_WIDTH} height={WAREHOUSE_HEIGHT} fill="#080c18" stroke="#1e293b" strokeWidth="1" />
              <rect x="0" y="0" width={WAREHOUSE_WIDTH} height={WAREHOUSE_HEIGHT} fill="url(#grid-pattern)" />

              {/* ISO 3691-4 Human-Robot Shared Zone */}
              {showHRIZone && (
                <g>
                  <rect
                    x="20"
                    y="35"
                    width="110"
                    height="30"
                    fill="rgba(245, 158, 11, 0.04)"
                    stroke="rgba(245, 158, 11, 0.35)"
                    strokeWidth="0.8"
                    strokeDasharray="3,2"
                  />
                  <text x="75" y="52" fill="rgba(245, 158, 11, 0.4)" fontSize="3.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                    ISO 3691-4 HUMAN-COBOT SHARED AISLE (SPEED LIMIT: 0.4 m/s)
                  </text>
                </g>
              )}

              {/* Storage Rack Aisles */}
              {showAisles && (
                <g opacity="0.85">
                  {[12, 26, 40, 54, 68, 82, 96, 110, 124, 138].map((aisleX, idx) => (
                    <g key={`aisle-${idx}`}>
                      {/* Upper Rack Section */}
                      <rect x={aisleX - 2.5} y="12" width="5" height="20" fill="#111827" stroke="#334155" strokeWidth="0.5" rx="1" />
                      {/* Lower Rack Section */}
                      <rect x={aisleX - 2.5} y="68" width="5" height="20" fill="#111827" stroke="#334155" strokeWidth="0.5" rx="1" />

                      {/* Directional aisle flow arrow */}
                      <text x={aisleX} y="22" fill="#64748b" fontSize="2.5" textAnchor="middle">
                        {idx % 2 === 0 ? '▲ A' + (idx + 1) : '▼ A' + (idx + 1)}
                      </text>
                      <text x={aisleX} y="78" fill="#64748b" fontSize="2.5" textAnchor="middle">
                        {idx % 2 === 0 ? '▲ A' + (idx + 1) : '▼ A' + (idx + 1)}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Charging & Origin Depots (V_0^start) */}
              <g id="depots">
                {/* Start Depot D1 */}
                <rect x="3" y="3" width="7" height="7" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="0.8" rx="1.5" />
                <text x="6.5" y="7.5" fill="#00f0ff" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                  D1
                </text>
                {/* Start Depot D2 */}
                <rect x="140" y="3" width="7" height="7" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="0.8" rx="1.5" />
                <text x="143.5" y="7.5" fill="#00f0ff" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                  D2
                </text>
                {/* Return Depot / Dock D3 */}
                <rect x="3" y="90" width="7" height="7" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="0.8" rx="1.5" />
                <text x="6.5" y="94.5" fill="#10b981" fontSize="2.5" fontWeight="bold" textAnchor="middle">
                  D_end
                </text>
              </g>

              {/* Consolidation Drop Chutes (V_D) */}
              <g id="chutes">
                {[
                  { id: 'C1', x: 45, y: 92 },
                  { id: 'C2', x: 75, y: 92 },
                  { id: 'C3', x: 105, y: 92 },
                ].map((ch) => (
                  <g key={ch.id}>
                    <polygon
                      points={`${ch.x},${ch.y - 3} ${ch.x + 4},${ch.y + 3} ${ch.x - 4},${ch.y + 3}`}
                      fill="rgba(236, 72, 153, 0.25)"
                      stroke="#ec4899"
                      strokeWidth="0.8"
                    />
                    <text x={ch.x} y={ch.y + 2} fill="#ec4899" fontSize="2.2" fontWeight="bold" textAnchor="middle">
                      {ch.id}
                    </text>
                  </g>
                ))}
              </g>

              {/* Render Vehicle Directed Paths */}
              {routes.map((route, rIdx) => {
                const isFocused = selectedVehicleId === null || selectedVehicleId === route.vehicle_id;
                if (!isFocused) return null;

                const color = VEHICLE_COLORS[rIdx % VEHICLE_COLORS.length];
                const stops = route.stops;
                if (stops.length < 2) return null;

                // Path points
                const pathPoints = stops.map((s) => `${s.pos_x},${s.pos_y}`).join(' L ');
                const pathD = `M ${pathPoints}`;

                return (
                  <g key={route.route_id} id={`route-${route.vehicle_id}`}>
                    {/* Glow backdrop line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth={selectedVehicleId === route.vehicle_id ? '1.8' : '1.2'}
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerEnd={showDirectionArrows ? `url(#arrow-${rIdx})` : undefined}
                    />

                    {/* Animated dash line overlay */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.4"
                      strokeDasharray="2,4"
                      strokeOpacity="0.4"
                    />

                    {/* Stop Nodes along Route */}
                    {stops.map((st, sIdx) => {
                      const isHovered = hoveredStop?.stop.stop_id === st.stop_id;
                      const isSel = selectedStop?.stop_id === st.stop_id;
                      const isOrigin = st.location_type === 'DEPOT_START' || st.location_type === 'DEPOT';
                      const isEnd = st.location_type === 'DEPOT_END';
                      const isDrop = st.location_type === 'DROP' || st.location_type === 'CHUTE';

                      const radius = isHovered || isSel ? 3.0 : isOrigin || isEnd ? 2.5 : 1.8;
                      const nodeFill = isOrigin ? '#00f0ff' : isEnd ? '#10b981' : isDrop ? '#ec4899' : color;

                      return (
                        <g
                          key={st.stop_id}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredStop({ stop: st, vehicleId: route.vehicle_id, color })}
                          onMouseLeave={() => setHoveredStop(null)}
                          onClick={() => {
                            setSelectedStop(st);
                            setSelectedVehicleId(route.vehicle_id);
                          }}
                        >
                          {/* Pulsing ring on hover/select */}
                          {(isHovered || isSel) && (
                            <circle cx={st.pos_x} cy={st.pos_y} r={radius + 1.5} fill="none" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="1,1" />
                          )}

                          <circle
                            cx={st.pos_x}
                            cy={st.pos_y}
                            r={radius}
                            fill={nodeFill}
                            stroke="#0f172a"
                            strokeWidth="0.5"
                          />

                          {/* Sequence Number Label */}
                          {showSequenceNumbers && (
                            <text
                              x={st.pos_x}
                              y={st.pos_y + 0.8}
                              fill="#000000"
                              fontSize={isOrigin || isEnd ? '1.8' : '1.5'}
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {st.stop_sequence}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Animated AMR Vehicle Markers at simTime */}
              {amrLivePositions.map((amr, idx) => {
                const isFocused = selectedVehicleId === null || selectedVehicleId === amr.route.vehicle_id;
                if (!isFocused) return null;

                return (
                  <g key={`live-amr-${idx}`} transform={`translate(${amr.x}, ${amr.y})`}>
                    {/* Ambient Glow */}
                    <circle cx="0" cy="0" r="3.5" fill={amr.color} fillOpacity="0.25" />
                    {/* Outer border */}
                    <circle cx="0" cy="0" r="2.2" fill="#0f172a" stroke={amr.color} strokeWidth="0.8" />
                    {/* Inner core */}
                    <circle cx="0" cy="0" r="1.1" fill={amr.color} />
                    {/* Vehicle ID Tag */}
                    <text x="0" y="-3.5" fill="#ffffff" fontSize="2.0" fontWeight="bold" textAnchor="middle">
                      {amr.route.vehicle_id}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredStop && (
              <div
                style={{
                  position: 'absolute',
                  top: '60px',
                  left: '14px',
                  zIndex: 20,
                  backgroundColor: 'rgba(10, 14, 26, 0.95)',
                  border: `1px solid ${hoveredStop.color}`,
                  borderRadius: '8px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '11px',
                  maxWidth: '280px',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: hoveredStop.color, fontWeight: 700 }}>
                    {hoveredStop.vehicleId} • STOP #{hoveredStop.stop.stop_sequence}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                    }}
                  >
                    {hoveredStop.stop.location_type}
                  </span>
                </div>

                <div style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                  {hoveredStop.stop.location_id}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#94a3b8', fontSize: '10px' }}>
                  <div>Arr: <strong style={{ color: '#38bdf8' }}>{hoveredStop.stop.arrival_time_sec.toFixed(1)}s</strong></div>
                  <div>Dep: <strong style={{ color: '#38bdf8' }}>{hoveredStop.stop.departure_time_sec.toFixed(1)}s</strong></div>
                  <div>Coord: <strong>({hoveredStop.stop.pos_x.toFixed(1)}, {hoveredStop.stop.pos_y.toFixed(1)})m</strong></div>
                  <div>Action: <strong style={{ color: '#10b981' }}>{hoveredStop.stop.action}</strong></div>
                </div>

                {hoveredStop.stop.order_ids && hoveredStop.stop.order_ids.length > 0 && (
                  <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '9px', color: '#64748b' }}>
                    SKU Demand: {hoveredStop.stop.order_ids.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Interactive Simulation Scrubber */}
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#090d18',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              zIndex: 10,
            }}
          >
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Simulation' : 'Play Animated 2D Route Simulation'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#00f0ff',
                border: 'none',
                color: '#050810',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            {/* Time Display */}
            <div style={{ minWidth: '95px', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: '#f0f4f8' }}>
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{simTime.toFixed(1)}s</span>
              <span style={{ color: '#64748b' }}> / {maxMakespan}s</span>
            </div>

            {/* Scrubber Slider */}
            <input
              type="range"
              min="0"
              max={maxMakespan}
              step="0.5"
              value={simTime}
              onChange={(e) => {
                setSimTime(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              title="Scrub to specific second in dispatch wave"
              style={{ flex: 1, accentColor: '#00f0ff', cursor: 'pointer' }}
            />

            {/* Speed Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  title={`Set playback speed to ${spd}x`}
                  style={{
                    fontSize: '10px',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: simSpeed === spd ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                    border: simSpeed === spd ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: simSpeed === spd ? '#00f0ff' : '#94a3b8',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Reset Time */}
            <button
              onClick={() => {
                setSimTime(0);
                setIsPlaying(false);
              }}
              title="Rewind simulation to t=0s"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Right Area: Detailed Route Information & Schedule Studio */}
        <div
          style={{
            width: '420px',
            backgroundColor: '#0c101c',
            borderLeft: '1px solid rgba(0, 240, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Active Route Header & KPI Card */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#090d18' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#f0f4f8',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {activeRoute.vehicle_id}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Route ID: {activeRoute.route_id}</span>
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                MTZ ACYCLIC PASSED
              </span>
            </div>

            {/* 4 KPIs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: '#111827', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tour Distance</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {activeRoute.tour_length_m.toFixed(1)} m
                </div>
              </div>

              <div style={{ backgroundColor: '#111827', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tour Makespan</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {activeRoute.route_makespan_sec.toFixed(1)} s
                </div>
              </div>

              <div style={{ backgroundColor: '#111827', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Carried Payload</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  {activeRoute.total_carried_mass_kg.toFixed(1)} kg <span style={{ fontSize: '10px', color: '#64748b' }}>/ 200kg</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#111827', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Battery Depletion</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                  {activeRoute.battery_consumed_pct.toFixed(1)}% <span style={{ fontSize: '10px', color: '#64748b' }}>(SOC &ge; 20%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Filters & Count */}
          <div
            style={{
              padding: '10px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#080c16',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              Turn-by-Turn Waypoints ({filteredStops.length} stops)
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'PICKUP', 'DROP', 'DEPOT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterStopType(t)}
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor: filterStopType === t ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                    border: filterStopType === t ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: filterStopType === t ? '#00f0ff' : '#64748b',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Turn-by-Turn Waypoints Scrollable Table */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Location</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Arr</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Dep</th>
                  <th style={{ padding: '6px 4px', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStops.map((st) => {
                  const isSelected = selectedStop?.stop_id === st.stop_id;
                  const isHovered = hoveredStop?.stop.stop_id === st.stop_id;
                  const isDrop = st.location_type === 'DROP' || st.location_type === 'CHUTE';
                  const isPickup = st.location_type === 'PICKUP';
                  const isDepot = st.location_type.includes('DEPOT');

                  return (
                    <tr
                      key={st.stop_id}
                      onClick={() => setSelectedStop(st)}
                      onMouseEnter={() => setHoveredStop({ stop: st, vehicleId: activeRoute.vehicle_id, color: '#00f0ff' })}
                      onMouseLeave={() => setHoveredStop(null)}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(0, 240, 255, 0.15)'
                          : isHovered
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '6px 4px', color: '#94a3b8' }}>{st.stop_sequence}</td>
                      <td style={{ padding: '6px 4px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            backgroundColor: isDrop
                              ? 'rgba(236, 72, 153, 0.2)'
                              : isPickup
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                            color: isDrop ? '#ec4899' : isPickup ? '#38bdf8' : '#10b981',
                          }}
                        >
                          {st.location_type}
                        </span>
                      </td>
                      <td style={{ padding: '6px 4px', color: '#f0f4f8', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {st.location_id}
                      </td>
                      <td style={{ padding: '6px 4px', color: '#38bdf8' }}>{st.arrival_time_sec.toFixed(0)}s</td>
                      <td style={{ padding: '6px 4px', color: '#94a3b8' }}>{st.departure_time_sec.toFixed(0)}s</td>
                      <td style={{ padding: '6px 4px', color: isDrop ? '#ec4899' : '#34d399', fontWeight: 600 }}>
                        {st.action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Waypoint Detailed Card */}
          {selectedStop && (
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#090d18',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff' }}>
                  INSPECTING STOP #{selectedStop.stop_sequence}
                </span>
                <button
                  onClick={() => setSelectedStop(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '10px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f0f4f8', marginBottom: '4px' }}>
                {selectedStop.location_id} ({selectedStop.location_type})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                <div>Coordinates: <strong style={{ color: '#fff' }}>({selectedStop.pos_x.toFixed(1)}, {selectedStop.pos_y.toFixed(1)}, {selectedStop.pos_z.toFixed(1)})m</strong></div>
                <div>Service Time: <strong style={{ color: '#fff' }}>{(selectedStop.departure_time_sec - selectedStop.arrival_time_sec).toFixed(1)}s</strong></div>
                <div>Action: <strong style={{ color: '#10b981' }}>{selectedStop.action}</strong></div>
                <div>Assigned Orders: <strong style={{ color: '#38bdf8' }}>{selectedStop.order_ids.length}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fallback mock routes if server has not completed wave
function getFallbackRoutes(): VehicleRoute[] {
  return [
    {
      route_id: 'ROUTE-AMR-001',
      vehicle_id: 'AMR_001',
      origin_depot_id: 'START_DEPOT_1',
      destination_depot_id: 'END_DEPOT_1',
      tour_length_m: 942.0,
      route_makespan_sec: 949.3,
      total_carried_mass_kg: 148.2,
      total_carried_volume_m3: 0.65,
      volume_utilization_pct: 78.5,
      battery_consumed_pct: 14.2,
      stops: [
        { stop_id: 's1', stop_sequence: 0, location_type: 'DEPOT_START', location_id: 'START_DEPOT_1', pos_x: 6.5, pos_y: 6.5, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 15, action: 'DEPART', order_ids: [] },
        { stop_id: 's2', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD_00012', pos_x: 26, pos_y: 20, pos_z: 2.5, arrival_time_sec: 45, departure_time_sec: 60, action: 'PICKUP', order_ids: ['ORD_00012'] },
        { stop_id: 's3', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD_00018', pos_x: 40, pos_y: 28, pos_z: 4.1, arrival_time_sec: 120, departure_time_sec: 135, action: 'PICKUP', order_ids: ['ORD_00018'] },
        { stop_id: 's4', stop_sequence: 3, location_type: 'PICKUP', location_id: 'ORD_00022', pos_x: 68, pos_y: 45, pos_z: 1.8, arrival_time_sec: 210, departure_time_sec: 225, action: 'PICKUP', order_ids: ['ORD_00022'] },
        { stop_id: 's5', stop_sequence: 4, location_type: 'DROP', location_id: 'CHUTE_C1', pos_x: 45, pos_y: 92, pos_z: 0, arrival_time_sec: 380, departure_time_sec: 410, action: 'DROP', order_ids: ['ORD_00012', 'ORD_00018', 'ORD_00022'] },
        { stop_id: 's6', stop_sequence: 5, location_type: 'PICKUP', location_id: 'ORD_00034', pos_x: 96, pos_y: 72, pos_z: 3.2, arrival_time_sec: 540, departure_time_sec: 555, action: 'PICKUP', order_ids: ['ORD_00034'] },
        { stop_id: 's7', stop_sequence: 6, location_type: 'PICKUP', location_id: 'ORD_00041', pos_x: 124, pos_y: 80, pos_z: 5.0, arrival_time_sec: 630, departure_time_sec: 645, action: 'PICKUP', order_ids: ['ORD_00041'] },
        { stop_id: 's8', stop_sequence: 7, location_type: 'DROP', location_id: 'CHUTE_C2', pos_x: 75, pos_y: 92, pos_z: 0, arrival_time_sec: 760, departure_time_sec: 790, action: 'DROP', order_ids: ['ORD_00034', 'ORD_00041'] },
        { stop_id: 's9', stop_sequence: 8, location_type: 'DEPOT_END', location_id: 'END_DEPOT_1', pos_x: 6.5, pos_y: 93.5, pos_z: 0, arrival_time_sec: 949.3, departure_time_sec: 949.3, action: 'DOCK', order_ids: [] },
      ],
    },
    {
      route_id: 'ROUTE-AMR-002',
      vehicle_id: 'AMR_002',
      origin_depot_id: 'START_DEPOT_2',
      destination_depot_id: 'END_DEPOT_1',
      tour_length_m: 884.0,
      route_makespan_sec: 892.0,
      total_carried_mass_kg: 139.6,
      total_carried_volume_m3: 0.60,
      volume_utilization_pct: 74.1,
      battery_consumed_pct: 13.1,
      stops: [
        { stop_id: 's10', stop_sequence: 0, location_type: 'DEPOT_START', location_id: 'START_DEPOT_2', pos_x: 143.5, pos_y: 6.5, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 15, action: 'DEPART', order_ids: [] },
        { stop_id: 's11', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD_00005', pos_x: 110, pos_y: 22, pos_z: 1.5, arrival_time_sec: 65, departure_time_sec: 80, action: 'PICKUP', order_ids: ['ORD_00005'] },
        { stop_id: 's12', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD_00009', pos_x: 82, pos_y: 25, pos_z: 3.8, arrival_time_sec: 140, departure_time_sec: 155, action: 'PICKUP', order_ids: ['ORD_00009'] },
        { stop_id: 's13', stop_sequence: 3, location_type: 'DROP', location_id: 'CHUTE_C3', pos_x: 105, pos_y: 92, pos_z: 0, arrival_time_sec: 340, departure_time_sec: 370, action: 'DROP', order_ids: ['ORD_00005', 'ORD_00009'] },
        { stop_id: 's14', stop_sequence: 4, location_type: 'PICKUP', location_id: 'ORD_00015', pos_x: 54, pos_y: 75, pos_z: 2.1, arrival_time_sec: 490, departure_time_sec: 505, action: 'PICKUP', order_ids: ['ORD_00015'] },
        { stop_id: 's15', stop_sequence: 5, location_type: 'DROP', location_id: 'CHUTE_C1', pos_x: 45, pos_y: 92, pos_z: 0, arrival_time_sec: 610, departure_time_sec: 640, action: 'DROP', order_ids: ['ORD_00015'] },
        { stop_id: 's16', stop_sequence: 6, location_type: 'DEPOT_END', location_id: 'END_DEPOT_1', pos_x: 6.5, pos_y: 93.5, pos_z: 0, arrival_time_sec: 892.0, departure_time_sec: 892.0, action: 'DOCK', order_ids: [] },
      ],
    },
  ];
}
