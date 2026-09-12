import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Battery,
  Navigation,
  Gauge,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Box,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { ScheduleDetails, VehicleRoute } from '../services/api';
import {
  calculateFloorBoundaryMetrics,
  generateRackAisles,
  extractDepotsFromRoutes,
  extractChutesFromRoutes,
  FloorBoundaryMetrics,
  NOMINAL_FACILITY_WIDTH_M,
  NOMINAL_FACILITY_HEIGHT_M,
  CRITICAL_SAFETY_BUFFER_M,
} from '../utils/floorBoundsCalculator';
import { CodeLmnBadge } from './CodeLmnBadge';
import { Scene3DLegendPanel } from './Scene3DLegendPanel';

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

  // Layer Toggles
  const [showPerimeterBarrier, setShowPerimeterBarrier] = useState<boolean>(true);
  const [showRacks, setShowRacks] = useState<boolean>(true);
  const [showStopWaypoints, setShowStopWaypoints] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const facilityGroupRef = useRef<THREE.Group | null>(null);
  const amrMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const trailLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const waypointMeshesRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const maxMakespan = useRef<number>(950.0);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(75, 0, 50));

  // 1. Calculate Active Routes and Boundary Metrics
  const activeRoutes = useMemo(() => {
    return schedule?.routes && schedule.routes.length > 0 ? schedule.routes : getMockRoutes();
  }, [schedule]);

  const floorMetrics: FloorBoundaryMetrics = useMemo(() => {
    return calculateFloorBoundaryMetrics(activeRoutes, NOMINAL_FACILITY_WIDTH_M, NOMINAL_FACILITY_HEIGHT_M);
  }, [activeRoutes]);

  // Update max makespan based on active routes
  useEffect(() => {
    let maxT = 900.0;
    activeRoutes.forEach((r) => {
      if (r.route_makespan_sec > maxT) maxT = r.route_makespan_sec;
      r.stops?.forEach((s) => {
        if (s.departure_time_sec > maxT) maxT = s.departure_time_sec;
      });
    });
    maxMakespan.current = Math.ceil(maxT);
  }, [activeRoutes]);

  // 2. Initialize Three.js Scene, Camera, Renderer, and Lighting
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.005);
    sceneRef.current = scene;

    const centerX = floorMetrics.centerX;
    const centerZ = floorMetrics.centerZ;
    cameraTargetRef.current.set(centerX, 0, centerZ);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 2000);
    // Position camera to frame the full warehouse with optimal elevation
    camera.position.set(centerX, Math.max(90, floorMetrics.facilityHeight * 1.05), centerZ + floorMetrics.facilityHeight * 1.15);
    camera.lookAt(centerX, 0, centerZ);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5b4fc, 1.4);
    dirLight.position.set(centerX + 60, 160, centerZ + 80);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const dSize = Math.max(floorMetrics.facilityWidth, floorMetrics.facilityHeight) * 0.8;
    dirLight.shadow.camera.left = -dSize;
    dirLight.shadow.camera.right = dSize;
    dirLight.shadow.camera.top = dSize;
    dirLight.shadow.camera.bottom = -dSize;
    scene.add(dirLight);

    // Corner Accent Lights
    const blueLight = new THREE.PointLight(0x00f0ff, 1.8, 120);
    blueLight.position.set(15, 25, 15);
    scene.add(blueLight);

    const cyanLight = new THREE.PointLight(0x38bdf8, 1.8, 120);
    cyanLight.position.set(floorMetrics.facilityWidth - 15, 25, 15);
    scene.add(cyanLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 1.5, 120);
    emeraldLight.position.set(floorMetrics.centerX, 30, floorMetrics.facilityHeight - 15);
    scene.add(emeraldLight);

    // Mouse Orbit Controls (Smooth drag and zoom)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      // Don't drag if clicking UI buttons
      if ((e.target as HTMLElement).closest('.glass-panel, .glass-card, button, input')) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      const target = cameraTargetRef.current;

      // Orbit around target
      const offset = cameraRef.current.position.clone().sub(target);
      const radius = offset.length();

      let theta = Math.atan2(offset.x, offset.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

      theta -= dx * 0.005;
      phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi - dy * 0.005));

      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);

      cameraRef.current.position.copy(target).add(offset);
      cameraRef.current.lookAt(target);

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      const target = cameraTargetRef.current;
      const offset = cameraRef.current.position.clone().sub(target);
      const zoomFactor = 1 + e.deltaY * 0.001;
      const newLen = THREE.MathUtils.clamp(offset.length() * zoomFactor, 25, 400);
      offset.setLength(newLen);
      cameraRef.current.position.copy(target).add(offset);
      cameraRef.current.lookAt(target);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: true });

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

  // 3. Build & Rebuild Warehouse Floor, Racks, Depots, Chutes & Perimeter Boundaries
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove previous facility group if exists
    if (facilityGroupRef.current) {
      scene.remove(facilityGroupRef.current);
      facilityGroupRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      });
    }

    const facilityGroup = new THREE.Group();
    facilityGroupRef.current = facilityGroup;

    const W = floorMetrics.facilityWidth;
    const H = floorMetrics.facilityHeight;
    const cX = floorMetrics.centerX;
    const cZ = floorMetrics.centerZ;

    // A. Main High-Tech Industrial Epoxy Floor
    const floorGeo = new THREE.PlaneGeometry(W, H);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080d1a,
      roughness: 0.65,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cX, -0.05, cZ);
    floor.receiveShadow = true;
    facilityGroup.add(floor);

    // B. Full-Facility Cyber Dual Grid
    // Major 10m grid
    const majorGridSize = Math.max(W, H);
    const majorDivisions = Math.round(majorGridSize / 10);
    const majorGrid = new THREE.GridHelper(majorGridSize, majorDivisions, 0x00f0ff, 0x1a263d);
    majorGrid.position.set(cX, 0.01, cZ);
    facilityGroup.add(majorGrid);

    // Minor 2m grid overlay
    const minorDivisions = Math.round(majorGridSize / 2);
    const minorGrid = new THREE.GridHelper(majorGridSize, minorDivisions, 0x1e293b, 0x0d1527);
    minorGrid.position.set(cX, 0.005, cZ);
    facilityGroup.add(minorGrid);

    // C. Physical Perimeter Boundary Barrier (Glowing Safety Envelope)
    if (showPerimeterBarrier) {
      const barrierGroup = new THREE.Group();

      // Outer safety boundary line
      const borderPoints = [
        new THREE.Vector3(0, 0.25, 0),
        new THREE.Vector3(W, 0.25, 0),
        new THREE.Vector3(W, 0.25, H),
        new THREE.Vector3(0, 0.25, H),
        new THREE.Vector3(0, 0.25, 0),
      ];
      const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
      const borderMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
      });
      const borderLine = new THREE.Line(borderGeo, borderMat);
      barrierGroup.add(borderLine);

      // Upper laser boundary fence wire (Y = 1.8m)
      const topPoints = [
        new THREE.Vector3(0, 1.8, 0),
        new THREE.Vector3(W, 1.8, 0),
        new THREE.Vector3(W, 1.8, H),
        new THREE.Vector3(0, 1.8, H),
        new THREE.Vector3(0, 1.8, 0),
      ];
      const topGeo = new THREE.BufferGeometry().setFromPoints(topPoints);
      const topMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 1,
        transparent: true,
        opacity: 0.6,
      });
      const topLine = new THREE.Line(topGeo, topMat);
      barrierGroup.add(topLine);

      // Corner Safety Pylons with Warning Beacons
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });

      [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H],
        [cX, 0],
        [cX, H],
        [0, cZ],
        [W, cZ],
      ].forEach(([px, pz]) => {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 16), pylonMat);
        pylon.position.set(px, 1.2, pz);
        pylon.castShadow = true;
        barrierGroup.add(pylon);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), beaconMat);
        beacon.position.set(px, 2.5, pz);
        barrierGroup.add(beacon);
      });

      facilityGroup.add(barrierGroup);
    }

    // D. Storage Racks Across Warehouse Aisles
    if (showRacks) {
      const racks = generateRackAisles(W, H);
      const rackUprightMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.5 });
      const boxMatAmber = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
      const boxMatBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
      const boxMatHaz = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0xef4444, emissiveIntensity: 0.15 });

      racks.forEach((rackRow) => {
        const lengthZ = rackRow.zEnd - rackRow.zStart;
        const centerZRow = (rackRow.zStart + rackRow.zEnd) / 2.0;

        // Upright rack frame
        const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.2, lengthZ), rackUprightMat);
        rackFrame.position.set(rackRow.x, 2.6, centerZRow);
        rackFrame.castShadow = true;
        rackFrame.receiveShadow = true;
        facilityGroup.add(rackFrame);

        // Shelves and cargo boxes
        const numSections = Math.max(3, Math.floor(lengthZ / 4.5));
        const stepZ = lengthZ / numSections;

        for (let s = 0; s < numSections; s++) {
          const bz = rackRow.zStart + (s + 0.5) * stepZ;
          for (let shelfLvl = 1; shelfLvl <= 3; shelfLvl++) {
            const by = shelfLvl * 1.35;
            const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, stepZ * 0.9), shelfMat);
            shelfMesh.position.set(rackRow.x, by, bz);
            facilityGroup.add(shelfMesh);

            // 1-2 parcels per shelf section
            const isHaz = (rackRow.x + bz + shelfLvl) % 7 < 2;
            const mat = isHaz ? boxMatHaz : (s + shelfLvl) % 2 === 0 ? boxMatAmber : boxMatBlue;
            const parcel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, stepZ * 0.7), mat);
            parcel.position.set(rackRow.x, by + 0.4, bz);
            parcel.castShadow = true;
            facilityGroup.add(parcel);
          }
        }
      });
    }

    // E. Depots (Hexagonal Berths with Cyber Glow)
    const depots = extractDepotsFromRoutes(activeRoutes);
    const depotMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.7, roughness: 0.3 });
    const depotRingMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
    });

    depots.forEach((depot, idx) => {
      const dBase = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 0.35, 6), depotMat);
      dBase.position.set(depot.x, 0.18, depot.z);
      dBase.receiveShadow = true;
      facilityGroup.add(dBase);

      const dRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 8, 24), depotRingMat);
      dRing.rotation.x = -Math.PI / 2;
      dRing.position.set(depot.x, 0.38, depot.z);
      facilityGroup.add(dRing);

      // Depot Pillar Beacon
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 4.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.5 })
      );
      pillar.position.set(depot.x, 2.25, depot.z);
      facilityGroup.add(pillar);
    });

    // F. Consolidation Chutes (Outbound Green Docking Bays)
    const chutes = extractChutesFromRoutes(activeRoutes);
    const chuteMat = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.5, roughness: 0.4 });
    const chuteBayMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
    });

    chutes.forEach((chute) => {
      // Main Chute Box
      const cBox = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.4, 4.8), chuteMat);
      cBox.position.set(chute.x, 1.2, chute.z);
      cBox.castShadow = true;
      cBox.receiveShadow = true;
      facilityGroup.add(cBox);

      // Conveyor intake ramp
      const cRamp = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 2.5), chuteBayMat);
      cRamp.rotation.x = -Math.PI / 8;
      cRamp.position.set(chute.x, 1.4, chute.z - 2.8);
      facilityGroup.add(cRamp);

      // Drop ring marker on floor
      const dropZone = new THREE.Mesh(
        new THREE.RingGeometry(1.8, 2.4, 32),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      dropZone.rotation.x = -Math.PI / 2;
      dropZone.position.set(chute.x, 0.04, chute.z - 3.8);
      facilityGroup.add(dropZone);
    });

    scene.add(facilityGroup);
  }, [floorMetrics, activeRoutes, showPerimeterBarrier, showRacks]);

  // 4. Update AMRs, Route Trails, and Stop Waypoints
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear previous AMRs & Trails
    amrMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    amrMeshesRef.current.clear();
    trailLinesRef.current.forEach((line) => scene.remove(line));
    trailLinesRef.current.clear();

    if (waypointMeshesRef.current) {
      scene.remove(waypointMeshesRef.current);
      waypointMeshesRef.current.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
      });
    }

    const waypointGroup = new THREE.Group();
    waypointMeshesRef.current = waypointGroup;

    const colors = [0x00f0ff, 0x10b981, 0xf59e0b, 0xa855f7, 0x3b82f6, 0xec4899, 0x14b8a6, 0xf97316];

    activeRoutes.forEach((route, idx) => {
      const col = colors[idx % colors.length];

      // AMR 3D Model
      const amrGroup = new THREE.Group();

      // Chassis
      const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 1.5), chassisMat);
      chassis.position.y = 0.25;
      chassis.castShadow = true;
      amrGroup.add(chassis);

      // Illuminated Top Deck
      const deckMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.6 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.2), deckMat);
      deck.position.y = 0.55;
      amrGroup.add(deck);

      // Cargo Container
      const cargoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.9), cargoMat);
      cargo.position.y = 1.0;
      cargo.castShadow = true;
      amrGroup.add(cargo);

      // Heavy-Duty Drive Wheels
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
      [-0.75, 0.75].forEach((wx) => {
        [-0.6, 0.6].forEach((wz) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.25, wz);
          amrGroup.add(wheel);
        });
      });

      // Position AMR at first stop
      const startPos = route.stops && route.stops[0] ? [route.stops[0].pos_x, 0, route.stops[0].pos_y] : [10 + idx * 5, 0, 10];
      amrGroup.position.set(startPos[0], startPos[1], startPos[2]);

      scene.add(amrGroup);
      amrMeshesRef.current.set(route.vehicle_id, amrGroup);

      // Continuous Tour Path Trail
      if (route.stops && route.stops.length > 1) {
        const points = route.stops.map((s) => new THREE.Vector3(s.pos_x, 0.2, s.pos_y));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: col,
          linewidth: 3,
          transparent: true,
          opacity: 0.85,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        trailLinesRef.current.set(route.vehicle_id, line);

        // Stop Waypoint Markers
        if (showStopWaypoints) {
          route.stops.forEach((stop, sIdx) => {
            const isDepot = stop.location_type?.includes('DEPOT') || stop.action === 'REPLENISH' || stop.action === 'DOCK';
            const isChute = stop.location_type?.includes('CHUTE') || stop.action === 'DROP';
            const wColor = isDepot ? 0x00f0ff : isChute ? 0x10b981 : 0xf59e0b;

            const wMesh = new THREE.Mesh(
              new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16),
              new THREE.MeshStandardMaterial({ color: wColor, emissive: wColor, emissiveIntensity: 0.5 })
            );
            wMesh.position.set(stop.pos_x, 0.1, stop.pos_y);
            waypointGroup.add(wMesh);
          });
        }
      }
    });

    if (showStopWaypoints) {
      scene.add(waypointGroup);
    }

    if (activeRoutes.length > 0 && !selectedVehicle) {
      setSelectedVehicle(activeRoutes[0].vehicle_id);
    }
  }, [activeRoutes, showStopWaypoints]);

  // 5. Simulation Clock & AMR Kinematic Interpolation
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

      // Interpolate each AMR along its route stops
      activeRoutes.forEach((route) => {
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
  }, [isPlaying, simSpeed, currentTime, activeRoutes]);

  // Handler to Reset Camera View
  const handleResetCamera = () => {
    if (!cameraRef.current) return;
    const cX = floorMetrics.centerX;
    const cZ = floorMetrics.centerZ;
    cameraTargetRef.current.set(cX, 0, cZ);
    cameraRef.current.position.set(cX, Math.max(90, floorMetrics.facilityHeight * 1.05), cZ + floorMetrics.facilityHeight * 1.15);
    cameraRef.current.lookAt(cX, 0, cZ);
  };

  // Handler to Focus on a Specific Vehicle
  const handleFocusVehicle = (vehId: string) => {
    const mesh = amrMeshesRef.current.get(vehId);
    if (!mesh || !cameraRef.current) return;
    const pos = mesh.position;
    cameraTargetRef.current.set(pos.x, 0, pos.z);
    cameraRef.current.position.set(pos.x, 42, pos.z + 50);
    cameraRef.current.lookAt(pos.x, 0, pos.z);
    setSelectedVehicle(vehId);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* TOP-LEFT: Floor Boundary & Route Stops Leakage Verification Card */}
      <div
        className="glass-card"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '320px',
          padding: '14px',
          zIndex: 10,
          backgroundColor: 'rgba(10, 14, 23, 0.88)',
          border: floorMetrics.isFullyContained ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(239, 68, 68, 0.6)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color={floorMetrics.isFullyContained ? '#00f0ff' : '#ef4444'} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
              FLOOR SURFACE ENVELOPE
            </span>
          </div>
          <CodeLmnBadge />
        </div>

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: floorMetrics.isFullyContained ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
            border: floorMetrics.isFullyContained ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {floorMetrics.isFullyContained ? (
              <CheckCircle2 size={13} color="#10b981" />
            ) : (
              <AlertTriangle size={13} color="#ef4444" />
            )}
            <span style={{ fontSize: '11px', fontWeight: 700, color: floorMetrics.isFullyContained ? '#34d399' : '#f87171' }}>
              {floorMetrics.isFullyContained ? '100% CONTAINED (0 LEAKAGE)' : `LEAKAGE DETECTED: ${floorMetrics.leakingStopsCount} STOPS`}
            </span>
          </div>
          <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8' }}>GATE-1 CERTIFIED</span>
        </div>

        {/* Calculation Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Facility Surface:</span>
            <strong style={{ color: '#f0f4f8', fontFamily: 'monospace' }}>
              {floorMetrics.facilityWidth.toFixed(0)}m × {floorMetrics.facilityHeight.toFixed(0)}m
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Floor Centroid:</span>
            <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>
              ({floorMetrics.centerX.toFixed(1)}, {floorMetrics.centerZ.toFixed(1)})m
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Min Perimeter Clearance:</span>
            <strong style={{ color: floorMetrics.minWallClearance >= CRITICAL_SAFETY_BUFFER_M ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>
              {floorMetrics.minWallClearance.toFixed(1)}m (Target ≥ {CRITICAL_SAFETY_BUFFER_M}.0m)
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Audited Route Stops:</span>
            <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{floorMetrics.totalStopsAudited} stops</span>
          </div>
        </div>

        {/* Interactive 3D Layer Toggles */}
        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setShowPerimeterBarrier(!showPerimeterBarrier)}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: showPerimeterBarrier ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showPerimeterBarrier ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showPerimeterBarrier ? '#00f0ff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Boundary Fence
          </button>
          <button
            onClick={() => setShowRacks(!showRacks)}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: showRacks ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showRacks ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showRacks ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Aisle Racks
          </button>
          <button
            onClick={handleResetCamera}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f0f4f8',
              cursor: 'pointer',
            }}
            title="Reset camera to warehouse center"
          >
            Reset Camera
          </button>
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: isLegendOpen ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.1)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Open 3D Scene Legend & Explanations Panel"
          >
            <Layers size={11} /> Legend &amp; Tours
          </button>
        </div>
      </div>

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

        {/* Reset Clock */}
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
        {/* 3D Legend & Tours Button */}
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: isLegendOpen ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: isLegendOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            color: isLegendOpen ? '#00f0ff' : '#e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Open 3D Scene Legend & Explanations Panel"
        >
          <Layers size={13} /> 3D Legend &amp; Tours
        </button>

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
            title="Switch to 2D Orthogonal Route Map Studio"
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
            right: isLegendOpen ? '440px' : '20px',
            width: '260px',
            padding: '16px',
            zIndex: 10,
            transition: 'right 0.25s ease',
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

      {/* 3D Scene Intelligence & Legend Drawer Panel */}
      <Scene3DLegendPanel
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
        routes={activeRoutes}
        selectedVehicleId={selectedVehicle}
        onSelectVehicle={(vehId) => {
          setSelectedVehicle(vehId);
          handleFocusVehicle(vehId);
        }}
        onFocusVehicle={handleFocusVehicle}
      />
    </div>
  );
};

// Fallback mock routes distributed across all 4 quadrants of the 150m x 100m warehouse
function getMockRoutes(): VehicleRoute[] {
  return [
    {
      route_id: 'R1',
      vehicle_id: 'AMR-1',
      origin_depot_id: 'DEPOT_1',
      destination_depot_id: 'DEPOT_3',
      tour_length_m: 942.0,
      route_makespan_sec: 949.3,
      total_carried_mass_kg: 148.2,
      total_carried_volume_m3: 0.65,
      volume_utilization_pct: 78.5,
      battery_consumed_pct: 14.2,
      stops: [
        { stop_id: 's1', stop_sequence: 0, location_type: 'DEPOT', location_id: 'DEPOT_1', pos_x: 10, pos_y: 10, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's2', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-1', pos_x: 26, pos_y: 25, pos_z: 0, arrival_time_sec: 60, departure_time_sec: 75, action: 'PICKUP', order_ids: ['ORD-1'] },
        { stop_id: 's3', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-2', pos_x: 42, pos_y: 35, pos_z: 0, arrival_time_sec: 150, departure_time_sec: 165, action: 'PICKUP', order_ids: ['ORD-2'] },
        { stop_id: 's4', stop_sequence: 3, location_type: 'CHUTE', location_id: 'CHUTE_1', pos_x: 35, pos_y: 92, pos_z: 0, arrival_time_sec: 320, departure_time_sec: 350, action: 'DROP', order_ids: ['ORD-1', 'ORD-2'] },
        { stop_id: 's5', stop_sequence: 4, location_type: 'DEPOT', location_id: 'DEPOT_3', pos_x: 10, pos_y: 90, pos_z: 0, arrival_time_sec: 420, departure_time_sec: 450, action: 'DOCK', order_ids: [] },
      ],
    },
    {
      route_id: 'R2',
      vehicle_id: 'AMR-2',
      origin_depot_id: 'DEPOT_2',
      destination_depot_id: 'DEPOT_4',
      tour_length_m: 884.0,
      route_makespan_sec: 892.0,
      total_carried_mass_kg: 139.6,
      total_carried_volume_m3: 0.6,
      volume_utilization_pct: 74.1,
      battery_consumed_pct: 13.1,
      stops: [
        { stop_id: 's6', stop_sequence: 0, location_type: 'DEPOT', location_id: 'DEPOT_2', pos_x: 140, pos_y: 10, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's7', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-3', pos_x: 124, pos_y: 25, pos_z: 0, arrival_time_sec: 80, departure_time_sec: 95, action: 'PICKUP', order_ids: ['ORD-3'] },
        { stop_id: 's8', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-4', pos_x: 98, pos_y: 35, pos_z: 0, arrival_time_sec: 180, departure_time_sec: 195, action: 'PICKUP', order_ids: ['ORD-4'] },
        { stop_id: 's9', stop_sequence: 3, location_type: 'CHUTE', location_id: 'CHUTE_3', pos_x: 95, pos_y: 92, pos_z: 0, arrival_time_sec: 310, departure_time_sec: 340, action: 'DROP', order_ids: ['ORD-3', 'ORD-4'] },
        { stop_id: 's10', stop_sequence: 4, location_type: 'DEPOT', location_id: 'DEPOT_4', pos_x: 140, pos_y: 90, pos_z: 0, arrival_time_sec: 430, departure_time_sec: 460, action: 'DOCK', order_ids: [] },
      ],
    },
    {
      route_id: 'R3',
      vehicle_id: 'AMR-3',
      origin_depot_id: 'DEPOT_5',
      destination_depot_id: 'DEPOT_5',
      tour_length_m: 760.0,
      route_makespan_sec: 780.0,
      total_carried_mass_kg: 120.0,
      total_carried_volume_m3: 0.52,
      volume_utilization_pct: 65.0,
      battery_consumed_pct: 11.0,
      stops: [
        { stop_id: 's11', stop_sequence: 0, location_type: 'DEPOT', location_id: 'DEPOT_5', pos_x: 75, pos_y: 50, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's12', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-5', pos_x: 68, pos_y: 65, pos_z: 0, arrival_time_sec: 70, departure_time_sec: 85, action: 'PICKUP', order_ids: ['ORD-5'] },
        { stop_id: 's13', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-6', pos_x: 52, pos_y: 70, pos_z: 0, arrival_time_sec: 140, departure_time_sec: 155, action: 'PICKUP', order_ids: ['ORD-6'] },
        { stop_id: 's14', stop_sequence: 3, location_type: 'CHUTE', location_id: 'CHUTE_2', pos_x: 65, pos_y: 92, pos_z: 0, arrival_time_sec: 260, departure_time_sec: 290, action: 'DROP', order_ids: ['ORD-5', 'ORD-6'] },
        { stop_id: 's15', stop_sequence: 4, location_type: 'DEPOT', location_id: 'DEPOT_5', pos_x: 75, pos_y: 50, pos_z: 0, arrival_time_sec: 380, departure_time_sec: 400, action: 'DOCK', order_ids: [] },
      ],
    },
    {
      route_id: 'R4',
      vehicle_id: 'AMR-4',
      origin_depot_id: 'DEPOT_1',
      destination_depot_id: 'DEPOT_2',
      tour_length_m: 820.0,
      route_makespan_sec: 840.0,
      total_carried_mass_kg: 130.5,
      total_carried_volume_m3: 0.58,
      volume_utilization_pct: 72.0,
      battery_consumed_pct: 12.5,
      stops: [
        { stop_id: 's16', stop_sequence: 0, location_type: 'DEPOT', location_id: 'DEPOT_1', pos_x: 10, pos_y: 10, pos_z: 0, arrival_time_sec: 0, departure_time_sec: 20, action: 'REPLENISH', order_ids: [] },
        { stop_id: 's17', stop_sequence: 1, location_type: 'PICKUP', location_id: 'ORD-7', pos_x: 36, pos_y: 75, pos_z: 0, arrival_time_sec: 90, departure_time_sec: 105, action: 'PICKUP', order_ids: ['ORD-7'] },
        { stop_id: 's18', stop_sequence: 2, location_type: 'PICKUP', location_id: 'ORD-8', pos_x: 88, pos_y: 75, pos_z: 0, arrival_time_sec: 180, departure_time_sec: 195, action: 'PICKUP', order_ids: ['ORD-8'] },
        { stop_id: 's19', stop_sequence: 3, location_type: 'CHUTE', location_id: 'CHUTE_4', pos_x: 125, pos_y: 92, pos_z: 0, arrival_time_sec: 310, departure_time_sec: 340, action: 'DROP', order_ids: ['ORD-7', 'ORD-8'] },
        { stop_id: 's20', stop_sequence: 4, location_type: 'DEPOT', location_id: 'DEPOT_2', pos_x: 140, pos_y: 10, pos_z: 0, arrival_time_sec: 440, departure_time_sec: 470, action: 'DOCK', order_ids: [] },
      ],
    },
  ];
}
