import type { Direction, Vehicle, VehicleType } from '@/engine/types';
import { VEHICLE_CONFIG } from '@/config/vehicles';
import type { RoadGraph } from './RoadGraph';

let vehicleIdCounter = 0;

function nextVehicleId(): string {
  return `veh-${++vehicleIdCounter}`;
}

export interface VehicleSpawn {
  intersectionId: string;
  direction: Direction;
  type: VehicleType;
  busRouteIndex?: number;
  busRouteStops?: string[];
}

export function createVehicle(spawn: VehicleSpawn, graph: RoadGraph): Vehicle | null {
  const intersection = graph.intersections.get(spawn.intersectionId);
  if (!intersection) return null;

  const vConfig = spawn.type === 'bus' ? VEHICLE_CONFIG.bus : VEHICLE_CONFIG.car;
  const offset = getSpawnOffset(spawn.direction, intersection.position.x, intersection.position.z);

  let route: string[];
  if (spawn.type === 'bus' && spawn.busRouteStops && spawn.busRouteStops.length > 1) {
    route = [...spawn.busRouteStops];
    for (let i = route.length - 2; i >= 0; i--) {
      route.push(route[i]);
    }
  } else {
    const allIntersectionIds = Array.from(graph.intersections.keys());
    const targetId = allIntersectionIds[Math.floor(Math.random() * allIntersectionIds.length)];
    route = graph.getShortestPath(spawn.intersectionId, targetId);
  }

  return {
    id: nextVehicleId(),
    position: { x: offset.x, z: offset.z },
    direction: spawn.direction,
    speed: vConfig.speed,
    waitingTime: 0,
    route,
    currentSegment: 0,
    isWaiting: false,
    type: spawn.type,
    busRouteIndex: spawn.busRouteIndex,
  };
}

function getSpawnOffset(direction: Direction, ix: number, iz: number): { x: number; z: number } {
  const spawnDist = 55;
  switch (direction) {
    case 'north': return { x: ix, z: iz - spawnDist };
    case 'south': return { x: ix, z: iz + spawnDist };
    case 'east': return { x: ix - spawnDist, z: iz };
    case 'west': return { x: ix + spawnDist, z: iz };
  }
}

export function updateVehicle(
  vehicle: Vehicle,
  dt: number,
  graph: RoadGraph,
  isGreenForVehicle: (direction: Direction) => boolean,
  getVehiclesNearPoint: (x: number, z: number, radius: number) => Vehicle[],
): Vehicle {
  const v = { ...vehicle };
  const speed = v.speed * dt;

  const isApproachingIntersection = checkApproachingIntersection(v, graph);
  if (isApproachingIntersection) {
    const lightState = isGreenForVehicle(v.direction);
    if (!lightState) {
      v.isWaiting = true;
      v.waitingTime += dt;
      return v;
    }
  }

  const nearby = getVehiclesNearPoint(v.position.x, v.position.z, 5);
  const ahead = nearby.find(other => {
    if (other.id === v.id) return false;
    return isAhead(v, other);
  });
  if (ahead) {
    const dist = Math.hypot(ahead.position.x - v.position.x, ahead.position.z - v.position.z);
    if (dist < VEHICLE_CONFIG.safeDistance + (v.type === 'bus' ? VEHICLE_CONFIG.bus.length : VEHICLE_CONFIG.car.length)) {
      v.isWaiting = true;
      v.waitingTime += dt;
      return v;
    }
  }

  v.isWaiting = false;
  moveVehicle(v, speed);

  if (v.route.length > 1 && v.currentSegment < v.route.length - 1) {
    const targetId = v.route[v.currentSegment + 1];
    const targetIntersection = graph.intersections.get(targetId);
    if (targetIntersection) {
      const dx = targetIntersection.position.x - v.position.x;
      const dz = targetIntersection.position.z - v.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 5) {
        v.currentSegment++;

        if (v.type === 'bus' && v.busRouteIndex !== undefined) {
          if (v.currentSegment >= v.route.length - 1) {
            v.currentSegment = 0;
          }
        } else {
          if (v.currentSegment >= v.route.length - 1) {
            const allIds = Array.from(graph.intersections.keys());
            const newTarget = allIds[Math.floor(Math.random() * allIds.length)];
            v.route = graph.getShortestPath(targetId, newTarget);
            v.currentSegment = 0;
          }
        }

        const nextTargetId = v.route[v.currentSegment + 1];
        const nextTarget = graph.intersections.get(nextTargetId);
        if (nextTarget) {
          const ndx = nextTarget.position.x - v.position.x;
          const ndz = nextTarget.position.z - v.position.z;
          v.direction = getDirectionFromDelta(ndx, ndz);
        }
      } else {
        v.direction = getDirectionFromDelta(dx, dz);
      }
    }
  }

  return v;
}

function getDirectionFromDelta(dx: number, dz: number): Direction {
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 'east' : 'west';
  }
  return dz > 0 ? 'south' : 'north';
}

function checkApproachingIntersection(vehicle: Vehicle, graph: RoadGraph): boolean {
  for (const intersection of graph.intersections.values()) {
    const dx = intersection.position.x - vehicle.position.x;
    const dz = intersection.position.z - vehicle.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 8 && dist > 2) return true;
  }
  return false;
}

function isAhead(vehicle: Vehicle, other: Vehicle): boolean {
  const dx = other.position.x - vehicle.position.x;
  const dz = other.position.z - vehicle.position.z;
  switch (vehicle.direction) {
    case 'north': return dz < 0 && Math.abs(dx) < 3;
    case 'south': return dz > 0 && Math.abs(dx) < 3;
    case 'east': return dx > 0 && Math.abs(dz) < 3;
    case 'west': return dx < 0 && Math.abs(dz) < 3;
  }
}

function moveVehicle(vehicle: Vehicle, speed: number): void {
  switch (vehicle.direction) {
    case 'north': vehicle.position.z -= speed; break;
    case 'south': vehicle.position.z += speed; break;
    case 'east': vehicle.position.x += speed; break;
    case 'west': vehicle.position.x -= speed; break;
  }
}

export function resetVehicleCounter(): void {
  vehicleIdCounter = 0;
}
