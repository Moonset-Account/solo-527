import type { Direction, Vehicle, VehicleType } from '@/types';

let vehicleCounter = 0;

const CAR_COLORS = ['#8899aa', '#667788', '#aabbcc', '#556677', '#ccddee'];
const BUS_COLOR = '#4ecdc4';
const TAXI_COLOR = '#ffd93d';

function randomColor(): string {
  return CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
}

function generateId(): string {
  vehicleCounter++;
  return `veh_${Date.now()}_${vehicleCounter}`;
}

export function createVehicle(params: {
  type?: VehicleType;
  position: { x: number; z: number };
  rotation: number;
  laneId: string;
  route?: Direction[];
  isBus?: boolean;
  busRouteId?: string;
}): Vehicle {
  const type = params.type || 'car';
  const isBus = params.isBus || type === 'bus';

  const maxSpeed = isBus ? 6 : type === 'taxi' ? 10 : 8;

  let color = randomColor();
  if (isBus) color = BUS_COLOR;
  else if (type === 'taxi') color = TAXI_COLOR;

  const defaultRoute: Direction[] = params.route
    ? params.route
    : (['N', 'S', 'E', 'W'].sort(() => Math.random() - 0.5) as Direction[]);

  return {
    id: generateId(),
    type,
    position: { ...params.position },
    rotation: params.rotation,
    speed: 0,
    maxSpeed,
    laneId: params.laneId,
    route: defaultRoute,
    routeIndex: 0,
    waitingTime: 0,
    isBus,
    busRouteId: params.busRouteId,
    color,
    progress: 0,
    laneProgress: 0,
    stopped: false,
    atIntersection: false,
  };
}

export function updateVehicleMovement(
  vehicle: Vehicle,
  delta: number,
  canMove: boolean,
  speedScale: number = 1
): { position: { x: number; z: number }; rotation: number } {
  const dt = delta * speedScale;

  if (canMove && !vehicle.stopped) {
    vehicle.speed = Math.min(vehicle.speed + 4 * dt, vehicle.maxSpeed);
    vehicle.waitingTime = Math.max(0, vehicle.waitingTime - dt);
  } else {
    vehicle.speed = Math.max(0, vehicle.speed - 6 * dt);
    if (vehicle.speed < 0.1) {
      vehicle.waitingTime += dt;
    }
  }

  const rad = vehicle.rotation;
  const dx = Math.sin(rad) * vehicle.speed * dt;
  const dz = -Math.cos(rad) * vehicle.speed * dt;

  vehicle.position.x += dx;
  vehicle.position.z += dz;
  vehicle.laneProgress += vehicle.speed * dt;

  return { position: vehicle.position, rotation: vehicle.rotation };
}

export function vehicleDistanceTo(
  v1: Vehicle,
  pos: { x: number; z: number }
): number {
  const dx = v1.position.x - pos.x;
  const dz = v1.position.z - pos.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function getVehicleDimensions(type: VehicleType): {
  width: number;
  length: number;
  height: number;
} {
  switch (type) {
    case 'bus':
      return { width: 2.5, length: 10, height: 2.8 };
    case 'taxi':
      return { width: 2, length: 4.5, height: 1.5 };
    case 'car':
    default:
      return { width: 2, length: 4.5, height: 1.4 };
  }
}
