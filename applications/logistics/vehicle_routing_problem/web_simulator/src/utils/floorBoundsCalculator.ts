import { VehicleRoute, RouteStop } from '../services/api';

export interface FloorBoundaryMetrics {
  facilityWidth: number; // m (Length along X axis)
  facilityHeight: number; // m (Width along Z axis in 3D / Y in 2D)
  centerX: number;
  centerZ: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  totalStopsAudited: number;
  leakingStopsCount: number;
  minWallClearance: number;
  isFullyContained: boolean;
  falsificationStatus: 'PASS' | 'FAIL';
  leakingStops: Array<{ stopId: string; vehicleId: string; x: number; z: number; overflowDist: number }>;
}

export interface Depot3D {
  id: string;
  name: string;
  x: number;
  z: number;
  type: 'DEPOT';
}

export interface Chute3D {
  id: string;
  name: string;
  x: number;
  z: number;
  type: 'CHUTE';
}

export interface RackRow3D {
  aisleId: string;
  x: number;
  zStart: number;
  zEnd: number;
  sectionsCount: number;
}

// Standard facility dimensions from DispatchEngine.PhysicalFacilityConfig
export const NOMINAL_FACILITY_WIDTH_M = 150.0;
export const NOMINAL_FACILITY_HEIGHT_M = 100.0;
export const CRITICAL_SAFETY_BUFFER_M = 2.0;

/**
 * Standard industrial layout for depots
 */
export const STANDARD_DEPOTS_3D: Depot3D[] = [
  { id: 'DEPOT_1', name: 'Southwest Depot D1', x: 10.0, z: 10.0, type: 'DEPOT' },
  { id: 'DEPOT_2', name: 'Southeast Depot D2', x: 140.0, z: 10.0, type: 'DEPOT' },
  { id: 'DEPOT_3', name: 'Northwest Depot D3', x: 10.0, z: 90.0, type: 'DEPOT' },
  { id: 'DEPOT_4', name: 'Northeast Depot D4', x: 140.0, z: 90.0, type: 'DEPOT' },
  { id: 'DEPOT_5', name: 'Central Cross-Dock D5', x: 75.0, z: 50.0, type: 'DEPOT' },
];

/**
 * Standard industrial layout for consolidation chutes
 */
export const STANDARD_CHUTES_3D: Chute3D[] = [
  { id: 'CHUTE_1', name: 'Outbound Chute C1', x: 35.0, z: 92.0, type: 'CHUTE' },
  { id: 'CHUTE_2', name: 'Outbound Chute C2', x: 65.0, z: 92.0, type: 'CHUTE' },
  { id: 'CHUTE_3', name: 'Outbound Chute C3', x: 95.0, z: 92.0, type: 'CHUTE' },
  { id: 'CHUTE_4', name: 'Outbound Chute C4', x: 125.0, z: 92.0, type: 'CHUTE' },
];

/**
 * Calculate dynamic floor boundary metrics and audit all route stops against the physical envelope.
 */
export function calculateFloorBoundaryMetrics(
  routes: VehicleRoute[] | null | undefined,
  configuredWidth = NOMINAL_FACILITY_WIDTH_M,
  configuredHeight = NOMINAL_FACILITY_HEIGHT_M
): FloorBoundaryMetrics {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let totalStops = 0;
  const leakingStops: Array<{ stopId: string; vehicleId: string; x: number; z: number; overflowDist: number }> = [];

  if (routes && routes.length > 0) {
    routes.forEach((route) => {
      if (route.stops && route.stops.length > 0) {
        route.stops.forEach((stop) => {
          totalStops++;
          const sx = stop.pos_x;
          const sz = stop.pos_y; // In 2D API, pos_y corresponds to the lateral depth / Z in Three.js

          if (sx < minX) minX = sx;
          if (sx > maxX) maxX = sx;
          if (sz < minZ) minZ = sz;
          if (sz > maxZ) maxZ = sz;

          // Check boundary breach: [0, configuredWidth] x [0, configuredHeight]
          const overflowX = sx < 0 ? -sx : sx > configuredWidth ? sx - configuredWidth : 0;
          const overflowZ = sz < 0 ? -sz : sz > configuredHeight ? sz - configuredHeight : 0;
          const overflowDist = Math.sqrt(overflowX * overflowX + overflowZ * overflowZ);

          if (overflowDist > 0.001) {
            leakingStops.push({
              stopId: stop.stop_id,
              vehicleId: route.vehicle_id,
              x: sx,
              z: sz,
              overflowDist,
            });
          }
        });
      }
    });
  }

  // If no stops, fallback to nominal depot boundaries
  if (totalStops === 0 || minX === Infinity) {
    minX = 10.0;
    maxX = 140.0;
    minZ = 10.0;
    maxZ = 90.0;
  }

  // Dynamic Floor Sizing: Always envelop all points + safe margin, at least nominal size
  const safetyPadding = 5.0; // 5m safety margin beyond extreme stops
  const dynamicWidth = Math.max(configuredWidth, maxX + safetyPadding);
  const dynamicHeight = Math.max(configuredHeight, maxZ + safetyPadding);

  // Minimum wall clearance across all stops
  let minWallClearance = Infinity;
  if (routes && routes.length > 0) {
    routes.forEach((route) => {
      route.stops?.forEach((stop) => {
        const sx = stop.pos_x;
        const sz = stop.pos_y;
        const distToWall = Math.min(sx, dynamicWidth - sx, sz, dynamicHeight - sz);
        if (distToWall < minWallClearance) {
          minWallClearance = distToWall;
        }
      });
    });
  }
  if (minWallClearance === Infinity) {
    minWallClearance = 5.0;
  }

  const isFullyContained = leakingStops.length === 0 && minWallClearance >= CRITICAL_SAFETY_BUFFER_M;

  return {
    facilityWidth: dynamicWidth,
    facilityHeight: dynamicHeight,
    centerX: dynamicWidth / 2.0,
    centerZ: dynamicHeight / 2.0,
    minX,
    maxX,
    minZ,
    maxZ,
    totalStopsAudited: totalStops,
    leakingStopsCount: leakingStops.length,
    minWallClearance: Math.max(0, minWallClearance),
    isFullyContained,
    falsificationStatus: isFullyContained ? 'PASS' : 'FAIL',
    leakingStops,
  };
}

/**
 * Generates storage rack aisle layout spanning the warehouse storage zone
 * leaving wide cross-aisles at the front (Z=0..15), center (Z=45..55), and rear (Z=85..100)
 */
export function generateRackAisles(facilityWidth: number, facilityHeight: number): RackRow3D[] {
  const racks: RackRow3D[] = [];
  // Aisles 1 to 22 distributed laterally between X = 20 and X = 130
  const aisleSpacing = 5.2; // meters between rack rows
  const startX = 20.0;
  const endX = facilityWidth - 20.0;

  let aisleNum = 1;
  for (let x = startX; x <= endX; x += aisleSpacing) {
    // Leave central transit corridor open
    if (Math.abs(x - facilityWidth / 2.0) < 4.0) {
      continue;
    }

    // South block: Z = 18 to 44
    racks.push({
      aisleId: `AISLE_${aisleNum.toString().padStart(2, '0')}_S`,
      x,
      zStart: 18.0,
      zEnd: Math.min(44.0, facilityHeight * 0.44),
      sectionsCount: 5,
    });

    // North block: Z = 56 to 84
    racks.push({
      aisleId: `AISLE_${aisleNum.toString().padStart(2, '0')}_N`,
      x,
      zStart: Math.max(56.0, facilityHeight * 0.56),
      zEnd: Math.min(84.0, facilityHeight * 0.84),
      sectionsCount: 5,
    });

    aisleNum++;
  }

  return racks;
}

/**
 * Extract distinct depots from active schedule routes or fallback to standard depots
 */
export function extractDepotsFromRoutes(routes: VehicleRoute[] | null | undefined): Depot3D[] {
  if (!routes || routes.length === 0) return STANDARD_DEPOTS_3D;

  const depotMap = new Map<string, Depot3D>();

  routes.forEach((route) => {
    route.stops?.forEach((stop) => {
      if (stop.location_type?.includes('DEPOT') || stop.action === 'REPLENISH' || stop.action === 'DOCK' || stop.action === 'DEPART') {
        const id = stop.location_id || 'DEPOT';
        if (!depotMap.has(id)) {
          depotMap.set(id, {
            id,
            name: `Depot ${id}`,
            x: stop.pos_x,
            z: stop.pos_y,
            type: 'DEPOT',
          });
        }
      }
    });
  });

  if (depotMap.size === 0) return STANDARD_DEPOTS_3D;
  return Array.from(depotMap.values());
}

/**
 * Extract distinct chutes from active schedule routes or fallback to standard chutes
 */
export function extractChutesFromRoutes(routes: VehicleRoute[] | null | undefined): Chute3D[] {
  if (!routes || routes.length === 0) return STANDARD_CHUTES_3D;

  const chuteMap = new Map<string, Chute3D>();

  routes.forEach((route) => {
    route.stops?.forEach((stop) => {
      if (stop.location_type?.includes('CHUTE') || stop.action === 'DROP') {
        const id = stop.location_id || 'CHUTE';
        if (!chuteMap.has(id)) {
          chuteMap.set(id, {
            id,
            name: `Chute ${id}`,
            x: stop.pos_x,
            z: stop.pos_y,
            type: 'CHUTE',
          });
        }
      }
    });
  });

  if (chuteMap.size === 0) return STANDARD_CHUTES_3D;
  return Array.from(chuteMap.values());
}
