import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Eye, Battery, Navigation, Gauge, MapPin } from 'lucide-react';
import { ScheduleDetails, VehicleRoute } from '../services/api';

interface ThreeWarehouseCanvasProps {
  schedule: ScheduleDetails | null;
  onNavigateTo2D?: () => void;
}

export const ThreeWarehouseCanvas: React.FC<ThreeWarehouseCanvasProps> = ({ schedule, onNavigateTo2D }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(2.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const amrMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const animFrameIdRef = useRef<number>(0);
  const maxMakespan = useRef<number>(950.0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.008);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(30, 45, 65);
    camera.lookAt(27.5, 0, 17.5);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight.position.set(40, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 1.5, 60);
    blueLight.position.set(10, 15, 10);
    scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 1.5, 60);
    cyanLight.position.set(45, 15, 25);
    scene.add(cyanLight);

    // 4. Warehouse Floor Grid
    const grid = new THREE.GridHelper(70, 70, 0x3b82f6, 0x1f2937);
    grid.position.set(27.5, 0, 17.5);
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(80, 60);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(27.5, -0.05, 17.5);
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. Storage Racks (Aisles)
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const hazMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

    for (let x = 10; x <= 45; x += 7) {
      for (let z = 5; z <= 30; z += 5) {
        // Uprights & Shelves
        const rackGeo = new THREE.BoxGeometry(1.2, 4.5, 3.8);
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(x, 2.25, z);
        rack.castShadow = true;
        scene.add(rack);

        // Add parcels on shelves
        for (let shelf = 1; shelf <= 3; shelf++) {
          const isHaz = (x + z + shelf) % 5 === 0;
          const parcelGeo = new THREE.BoxGeometry(0.8, 0.6, 0.9);
          const parcel = new THREE.Mesh(parcelGeo, isHaz ? hazMat : boxMat);
          parcel.position.set(x, shelf * 1.2 - 0.2, z + (shelf % 2 === 0 ? 0.8 : -0.8));
          scene.add(parcel);
        }
      }
    }

    // 6. Depots (Hexagonal Berths)
    const depotMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.3 });
    const d1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.4, 6), depotMat);
    d1.position.set(5, 0.2, 5);
    scene.add(d1);

    const d2 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.4, 6), depotMat);
    d2.position.set(50, 0.2, 30);
    scene.add(d2);

    // 7. Consolidation Chutes
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4, roughness: 0.4 });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 3.5), chuteMat);
    c1.position.set(5, 0.9, 30);
    scene.add(c1);

    const c2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 3.5), chuteMat);
    c2.position.set(50, 0.9, 5);
    scene.add(c2);

    // 8. Simple Mouse Orbit Drag
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      camera.position.x += dx * 0.08;
      camera.position.y -= dy * 0.08;
      camera.lookAt(27.5, 0, 17.5);
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.05;
      camera.position.z = Math.max(20, Math.min(120, camera.position.z));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update AMRs and route paths when schedule changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear previous AMRs
    amrMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    amrMeshesRef.current.clear();
    trailLinesRef.current.forEach((line) => scene.remove(line));
    trailLinesRef.current.clear();

    const routes = schedule?.routes || getMockRoutes();
    const colors = [0x3b82f6, 0xf97316, 0x8b5cf6, 0x10b981];

    routes.forEach((route, idx) => {
      const col = colors[idx % colors.length];

      // AMR Body Group
      const amrGroup = new THREE.Group();

      // Chassis
      const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.2), chassisMat);
      chassis.position.y = 0.2;
      chassis.castShadow = true;
      amrGroup.add(chassis);

      // Top Deck with Colored Glow
      const deckMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.0), deckMat);
      deck.position.y = 0.45;
      amrGroup.add(deck);

      // Cargo Box on Top
      const cargoMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), cargoMat);
      cargo.position.y = 0.8;
      amrGroup.add(cargo);

      // Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      [-0.6, 0.6].forEach((wx) => {
        [-0.5, 0.5].forEach((wz) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.2, wz);
          amrGroup.add(wheel);
        });
      });

      // Initial Position
      const startPos = route.stops[0]?.pos_x !== undefined ? [route.stops[0].pos_x, 0, route.stops[0].pos_y] : [5 + idx * 3, 0, 5];
      amrGroup.position.set(startPos[0], startPos[1], startPos[2]);

      scene.add(amrGroup);
      amrMeshesRef.current.set(route.vehicle_id, amrGroup);

      // Draw Tour Trail
      if (route.stops && route.stops.length > 1) {
        const points = route.stops.map((s) => new THREE.Vector3(s.pos_x, 0.2, s.pos_y));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: col, linewidth: 2, transparent: true, opacity: 0.75 });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        trailLinesRef.current.set(route.vehicle_id, line);
      }
    });

    if (routes.length > 0) {
      setSelectedVehicle(routes[0].vehicle_id);
    }
  }, [schedule]);

  // Main Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000.0;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + dt * simSpeed * 10.0;
          return next > maxMakespan.current ? 0 : next;
        });
      }

      // Interpolate AMR positions along route stops
      const routes = schedule?.routes || getMockRoutes();
      routes.forEach((route) => {
        const mesh = amrMeshesRef.current.get(route.vehicle_id);
        if (!mesh || !route.stops || route.stops.length < 2) return;

        const totalStops = route.stops.length;
        const totalDuration = route.route_makespan_sec || 900.0;
        const progress = (currentTime % totalDuration) / totalDuration;
        const exactIndex = progress * (totalStops - 1);
        const currentIndex = Math.floor(exactIndex);
        const nextIndex = Math.min(totalStops - 1, currentIndex + 1);
        const alpha = exactIndex - currentIndex;

        const s1 = route.stops[currentIndex];
        const s2 = route.stops[nextIndex];

        if (s1 && s2) {
          const x = THREE.MathUtils.lerp(s1.pos_x, s2.pos_x, alpha);
          const z = THREE.MathUtils.lerp(s1.pos_y, s2.pos_y, alpha);
          mesh.position.set(x, 0, z);

          // Rotate towards heading
          const dx = s2.pos_x - s1.pos_x;
          const dz = s2.pos_y - s1.pos_y;
          if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
            mesh.rotation.y = Math.atan2(dx, dz);
          }
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [isPlaying, simSpeed, currentTime, schedule]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Floating Simulation Controls Overlay */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          zIndex: 10,
        }}
      >
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn-primary"
          style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Reset */}
        <button
          onClick={() => setCurrentTime(0)}
          className="btn-secondary"
          style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
          title="Reset Simulation Clock"
        >
          <RotateCcw size={16} />
        </button>

        {/* Time Scrubber */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
            <span>T = {currentTime.toFixed(1)}s</span>
            <span>{maxMakespan.current.toFixed(0)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxMakespan.current}
            step="1"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
          />
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              style={{
                background: simSpeed === spd ? '#3b82f6' : '#1f2937',
                color: 'white',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* 2D Map & Routes Switch Button */}
        {onNavigateTo2D && (
          <button
            onClick={onNavigateTo2D}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid #00f0ff',
              borderRadius: '6px',
              color: '#00f0ff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Switch to 2D Orthogonal Route Map Studio with turn-by-turn kinematics and schedule"
          >
            <MapPin size={13} /> 2D Map &amp; Routes
          </button>
        )}
      </div>

      {/* Selected AMR Live Telemetry HUD Card */}
      {selectedVehicle && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '260px',
            padding: '16px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="#60a5fa" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#f3f4f6' }}>{selectedVehicle} TELEMETRY</span>
            </div>
            <span style={{ fontSize: '10px', background: '#065f46', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              MISSION ACTIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
              <span>Speed:</span>
              <span style={{ color: '#60a5fa', fontWeight: 600 }}>1.38 m/s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
              <span>Battery SOC:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>88.4%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
              <span>Payload:</span>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>142.5 kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
              <span>ISO 3691-4 Zone:</span>
              <span style={{ color: '#e5e7eb' }}>NOMINAL (FREE)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fallback mock routes if server has not completed wave
function getMockRoutes(): VehicleRoute[] {
  return [
    {
      route_id: 'R1',
      vehicle_id: 'AMR-1',
      origin_depot_id: 'D1',
      destination_depot_id: 'D1',
      tour_length_m: 942.0,
      route_makespan_sec: 949.3,
      total_carried_mass_kg: 148.2,
      total_carried_volume_m3: 0.65,
      volume_utilization_pct: 78.5,
      battery_consumed_pct: 14.2,
      stops: [
        { stop_id: 's1', stop_sequence: 0, location_type: 'DEPOT', location_id: 'D1', pos_x: 5, pos_y: 5, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's2', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-1', pos_x: 12, pos_y: 10, pos_z: 0, arrival_time_sec: 60, departure_time_sec: 75, action: 'PICKUP', order_ids: ['ORD-1'] },
        { stop_id: 's3', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-2', pos_x: 24, pos_y: 15, pos_z: 0, arrival_time_sec: 150, departure_time_sec: 165, action: 'PICKUP', order_ids: ['ORD-2'] },
        { stop_id: 's4', stop_sequence: 3, location_type: 'CHUTE', location_id: 'C1', pos_x: 5, pos_y: 30, pos_z: 0, arrival_time_sec: 320, departure_time_sec: 350, action: 'DROP', order_ids: ['ORD-1', 'ORD-2'] },
      ],
    },
    {
      route_id: 'R2',
      vehicle_id: 'AMR-2',
      origin_depot_id: 'D2',
      destination_depot_id: 'D2',
      tour_length_m: 884.0,
      route_makespan_sec: 892.0,
      total_carried_mass_kg: 139.6,
      total_carried_volume_m3: 0.60,
      volume_utilization_pct: 74.1,
      battery_consumed_pct: 13.1,
      stops: [
        { stop_id: 's5', stop_sequence: 0, location_type: 'DEPOT', location_id: 'D2', pos_x: 50, pos_y: 30, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's6', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-3', pos_x: 38, pos_y: 20, pos_z: 0, arrival_time_sec: 80, departure_time_sec: 95, action: 'PICKUP', order_ids: ['ORD-3'] },
        { stop_id: 's7', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-4', pos_x: 26, pos_y: 12, pos_z: 0, arrival_time_sec: 180, departure_time_sec: 195, action: 'PICKUP', order_ids: ['ORD-4'] },
        { stop_id: 's8', stop_sequence: 3, location_type: 'CHUTE', location_id: 'C2', pos_x: 50, pos_y: 5, pos_z: 0, arrival_time_sec: 310, departure_time_sec: 340, action: 'DROP', order_ids: ['ORD-3', 'ORD-4'] },
      ],
    },
  ];
}
