import type {
  LevelConfig,
  IntersectionState,
  VehicleState,
  SignalPhaseConfig,
  Direction,
} from '@/types';

const ROAD_LENGTH = 8;
const VEHICLE_LENGTH = 0.6;
const SAFE_DISTANCE = 1.2;
const MAX_SPEED = 0.15;
const ACCELERATION = 0.008;
const DECELERATION = 0.02;

interface Road {
  id: string;
  from: string;
  to: string;
  lanes: number;
  speedLimit: number;
  direction: Direction;
  length: number;
  isInbound: boolean;
  isOutbound: boolean;
  originalRoadId: string;
}

const VEHICLE_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#ecf0f1', '#bdc3c7', '#34495e',
  '#d35400', '#c0392b', '#16a085', '#27ae60', '#2980b9',
];

function oppositeDir(d: Direction): Direction {
  const m: Record<Direction, Direction> = { north: 'south', south: 'north', east: 'west', west: 'east' };
  return m[d];
}

export class TrafficSim {
  private roads: Road[] = [];
  private intersections: Map<string, IntersectionState> = new Map();
  private intersectionPositions: Map<string, [number, number]> = new Map();
  private vehicles: VehicleState[] = [];
  private inboundRoads: Road[] = [];
  private outboundRoads: Road[] = [];
  private level: LevelConfig | null = null;
  private gameTime: number = 0;
  private spawnAccumulators: Map<string, number> = new Map();
  private nextVehicleId: number = 0;
  private throughputCounter: number = 0;
  private totalWaitTime: number = 0;

  getVehicles(): VehicleState[] {
    return this.vehicles;
  }

  getIntersections(): IntersectionState[] {
    return Array.from(this.intersections.values());
  }

  getGameTime(): number {
    return this.gameTime;
  }

  getThroughput(): number {
    return this.throughputCounter;
  }

  init(level: LevelConfig): void {
    this.level = level;
    this.gameTime = 0;
    this.vehicles = [];
    this.spawnAccumulators.clear();
    this.nextVehicleId = 0;
    this.throughputCounter = 0;
    this.totalWaitTime = 0;

    this.intersections.clear();
    this.intersectionPositions.clear();
    for (const ic of level.intersections) {
      this.intersections.set(ic.id, {
        id: ic.id,
        currentPhase: 0,
        phaseTimer: 0,
        phases: ic.signalPhases.map((p) => ({ ...p })),
      });
      this.intersectionPositions.set(ic.id, ic.position);
    }

    const intersectionIds = new Set(level.intersections.map((i) => i.id));
    this.roads = [];
    this.inboundRoads = [];
    this.outboundRoads = [];

    for (const r of level.roads) {
      const isFromEdge = !intersectionIds.has(r.from);
      const isToEdge = !intersectionIds.has(r.to);

      if (isToEdge) {
        const inRoad: Road = {
          id: r.id + '-in',
          from: r.to,
          to: r.from,
          lanes: r.lanes,
          speedLimit: r.speedLimit,
          direction: r.direction,
          length: ROAD_LENGTH,
          isInbound: true,
          isOutbound: false,
          originalRoadId: r.id,
        };
        const outRoad: Road = {
          ...r,
          length: ROAD_LENGTH,
          isInbound: false,
          isOutbound: true,
          originalRoadId: r.id,
        };
        this.roads.push(inRoad, outRoad);
        this.inboundRoads.push(inRoad);
        this.outboundRoads.push(outRoad);
      } else if (isFromEdge) {
        const inRoad: Road = {
          ...r,
          length: ROAD_LENGTH,
          isInbound: true,
          isOutbound: false,
          originalRoadId: r.id,
        };
        const outRoad: Road = {
          id: r.id + '-out',
          from: r.to,
          to: r.from,
          lanes: r.lanes,
          speedLimit: r.speedLimit,
          direction: r.direction,
          length: ROAD_LENGTH,
          isInbound: false,
          isOutbound: true,
          originalRoadId: r.id,
        };
        this.roads.push(inRoad, outRoad);
        this.inboundRoads.push(inRoad);
        this.outboundRoads.push(outRoad);
      } else {
        const road: Road = {
          ...r,
          length: ROAD_LENGTH,
          isInbound: false,
          isOutbound: false,
          originalRoadId: r.id,
        };
        this.roads.push(road);
      }

      this.spawnAccumulators.set(r.id + '-in', 0);
      this.spawnAccumulators.set(r.id, 0);
    }

    for (const route of level.busRoutes) {
      this.spawnAccumulators.set('bus-' + route.id, 0);
    }
  }

  update(dt: number): void {
    if (!this.level) return;
    this.gameTime += dt;
    this.updateSignals(dt);
    this.spawnVehicles(dt);
    this.moveVehicles(dt);
    this.removeCompletedVehicles();
  }

  private updateSignals(dt: number): void {
    for (const [, intersection] of this.intersections) {
      const phases = intersection.phases;
      if (phases.length === 0) continue;

      const currentPhaseIdx = intersection.currentPhase % phases.length;
      const currentPhase = phases[currentPhaseIdx];

      intersection.phaseTimer += dt;

      if (intersection.phaseTimer >= currentPhase.greenDuration) {
        intersection.currentPhase = (currentPhaseIdx + 1) % phases.length;
        intersection.phaseTimer = 0;
      }
    }
  }

  private spawnVehicles(dt: number): void {
    if (!this.level) return;
    const gameHour = (this.gameTime / this.level.timeLimit) * 24;
    let density = 0.3;
    for (const sched of this.level.trafficSchedule) {
      if (gameHour >= sched.timeRange[0] && gameHour < sched.timeRange[1]) {
        density = sched.densityMultiplier;
        break;
      }
    }

    for (const inRoad of this.inboundRoads) {
      const baseRate = 0.35 * density;
      const key = inRoad.id;
      const accum = this.spawnAccumulators.get(key) ?? 0;
      const newAccum = accum + baseRate * dt;

      if (newAccum >= 1) {
        const canSpawn = !this.vehicles.some(
          (v) => v.roadId === inRoad.id && v.position < VEHICLE_LENGTH * 2,
        );
        if (canSpawn) {
          this.spawnVehicleOnRoad(inRoad);
        }
        this.spawnAccumulators.set(key, newAccum - 1);
      } else {
        this.spawnAccumulators.set(key, newAccum);
      }
    }

    for (const road of this.roads) {
      if (road.isInbound || road.isOutbound) continue;
      const baseRate = 0.2 * density;
      const key = road.id;
      const accum = this.spawnAccumulators.get(key) ?? 0;
      const newAccum = accum + baseRate * dt;
      if (newAccum >= 1) {
        const canSpawn = !this.vehicles.some(
          (v) => v.roadId === road.id && v.position < VEHICLE_LENGTH * 2,
        );
        if (canSpawn) {
          this.spawnVehicleOnRoad(road);
        }
        this.spawnAccumulators.set(key, newAccum - 1);
      } else {
        this.spawnAccumulators.set(key, newAccum);
      }
    }

    this.spawnBuses(dt);
  }

  private spawnVehicleOnRoad(road: Road): void {
    const lane = Math.floor(Math.random() * road.lanes);
    this.vehicles.push({
      id: `v-${this.nextVehicleId++}`,
      roadId: road.id,
      position: 0,
      speed: MAX_SPEED * 0.5,
      lane,
      isBus: false,
      color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
      waiting: false,
    });
  }

  private spawnBuses(dt: number): void {
    if (!this.level) return;
    for (const route of this.level.busRoutes) {
      if (route.stops.length === 0) continue;
      const firstStop = route.stops[0];
      const inRoad = this.inboundRoads.find(
        (r) => r.to === firstStop,
      );
      if (!inRoad) continue;

      const key = `bus-${route.id}`;
      let accum = this.spawnAccumulators.get(key) ?? 0;
      accum += (1 / route.frequency) * dt;

      if (accum >= 1) {
        const canSpawn = !this.vehicles.some(
          (v) => v.roadId === inRoad.id && v.position < VEHICLE_LENGTH * 3 && v.isBus,
        );
        if (canSpawn) {
          this.vehicles.push({
            id: `bus-${this.nextVehicleId++}`,
            roadId: inRoad.id,
            position: 0,
            speed: MAX_SPEED * 0.4,
            lane: 0,
            isBus: true,
            busRouteId: route.id,
            color: route.color,
            waiting: false,
          });
        }
        this.spawnAccumulators.set(key, 0);
      } else {
        this.spawnAccumulators.set(key, accum);
      }
    }
  }

  private moveVehicles(dt: number): void {
    const vehiclesOnRoad = new Map<string, VehicleState[]>();
    for (const v of this.vehicles) {
      const list = vehiclesOnRoad.get(v.roadId) ?? [];
      list.push(v);
      vehiclesOnRoad.set(v.roadId, list);
    }

    for (const [, list] of vehiclesOnRoad) {
      list.sort((a, b) => b.position - a.position);
    }

    for (const v of this.vehicles) {
      const road = this.roads.find((r) => r.id === v.roadId);
      if (!road) continue;

      const roadMaxSpeed = MAX_SPEED * (road.speedLimit / 60);
      const list = vehiclesOnRoad.get(v.roadId) ?? [];
      const idx = list.findIndex((lv) => lv.id === v.id);
      const vehicleAhead = idx > 0 ? list[idx - 1] : null;

      let targetSpeed = roadMaxSpeed;

      if (vehicleAhead) {
        const gap = vehicleAhead.position - v.position - VEHICLE_LENGTH;
        if (gap < SAFE_DISTANCE) {
          targetSpeed = Math.max(0, vehicleAhead.speed * (gap / SAFE_DISTANCE));
        }
      }

      const approachingEnd = v.position >= road.length - 2.0 && v.position < road.length;
      if (approachingEnd) {
        const intersectionId = road.to;
        const intersection = this.intersections.get(intersectionId);

        if (intersection) {
          const isGreen = this.isGreenForVehicle(road, intersection, v.isBus, v.busRouteId);
          if (!isGreen) {
            const stopPos = road.length - 0.4;
            const distToStop = stopPos - v.position;
            if (distToStop > 0) {
              targetSpeed = Math.min(targetSpeed, distToStop * 0.08);
            } else {
              targetSpeed = 0;
            }
            v.waiting = true;
          } else {
            v.waiting = false;
          }
        } else {
          v.waiting = false;
        }
      } else {
        v.waiting = false;
      }

      if (v.speed < targetSpeed) {
        v.speed = Math.min(targetSpeed, v.speed + ACCELERATION * dt);
      } else if (v.speed > targetSpeed) {
        v.speed = Math.max(targetSpeed, v.speed - DECELERATION * dt);
      }

      v.speed = Math.max(0, v.speed);
      v.position += v.speed * dt;

      if (v.position >= road.length) {
        this.handleRoadEnd(v, road);
      }
    }

    this.totalWaitTime += dt * this.vehicles.filter((v) => v.waiting).length;
  }

  private isGreenForVehicle(
    road: Road,
    intersection: IntersectionState,
    isBus: boolean,
    busRouteId?: string,
  ): boolean {
    const currentPhaseIdx = intersection.currentPhase % intersection.phases.length;
    const currentPhase = intersection.phases[currentPhaseIdx];

    if (isBus && currentPhase.busPriority) {
      return true;
    }

    const approachDir = road.direction;
    const ns = approachDir === 'north' || approachDir === 'south';
    const phaseDir = currentPhase.direction;
    const phaseNS = phaseDir === 'north' || phaseDir === 'south';

    return (ns && phaseNS) || (!ns && !phaseNS);
  }

  private handleRoadEnd(v: VehicleState, road: Road): void {
    if (road.isOutbound) {
      this.throughputCounter++;
      v.position = road.length + 1;
      return;
    }

    const intersectionId = road.to;

    if (!this.intersections.has(intersectionId)) {
      this.throughputCounter++;
      v.position = road.length + 1;
      return;
    }

    const exitRoads = this.roads.filter(
      (r) => r.from === intersectionId && r.id !== road.id,
    );

    if (exitRoads.length === 0) {
      this.throughputCounter++;
      v.position = road.length + 1;
      return;
    }

    if (v.isBus && v.busRouteId && this.level) {
      const route = this.level.busRoutes.find((r) => r.id === v.busRouteId);
      if (route) {
        const stopIdx = route.stops.indexOf(intersectionId);
        if (stopIdx >= 0 && stopIdx < route.stops.length - 1) {
          const nextStop = route.stops[stopIdx + 1];
          const nextRoad = exitRoads.find(
            (r) => r.to === nextStop,
          );
          if (nextRoad) {
            v.roadId = nextRoad.id;
            v.position = 0;
            v.lane = Math.min(v.lane, nextRoad.lanes - 1);
            return;
          }
        }
      }
    }

    const outRoads = exitRoads.filter((r) => r.isOutbound);
    const throughRoads = exitRoads.filter((r) => !r.isOutbound && !r.isInbound);

    let nextRoad: Road;
    const pickOut = Math.random() < 0.6 && outRoads.length > 0;
    if (pickOut) {
      nextRoad = outRoads[Math.floor(Math.random() * outRoads.length)];
    } else if (throughRoads.length > 0) {
      nextRoad = throughRoads[Math.floor(Math.random() * throughRoads.length)];
    } else {
      nextRoad = outRoads.length > 0
        ? outRoads[Math.floor(Math.random() * outRoads.length)]
        : exitRoads[Math.floor(Math.random() * exitRoads.length)];
    }

    v.roadId = nextRoad.id;
    v.position = 0;
    v.lane = Math.min(v.lane, nextRoad.lanes - 1);
  }

  private removeCompletedVehicles(): void {
    this.vehicles = this.vehicles.filter((v) => {
      const road = this.roads.find((r) => r.id === v.roadId);
      if (!road) return false;
      return v.position <= road.length + 1;
    });
  }

  getAvgWaitTime(): number {
    return this.vehicles.filter((v) => v.waiting).length;
  }

  getRoadPosition(roadId: string): { from: [number, number]; to: [number, number] } | null {
    const road = this.roads.find((r) => r.id === roadId);
    if (!road) return null;

    const fromPos = this.intersectionPositions.get(road.from)
      ?? this.getEdgePosition(road.from, road);
    const toPos = this.intersectionPositions.get(road.to)
      ?? this.getEdgePosition(road.to, road);
    if (!fromPos || !toPos) return null;
    return { from: fromPos, to: toPos };
  }

  private getEdgePosition(edgeId: string, road: Road): [number, number] | null {
    if (!this.level) return null;

    const intId = road.isInbound ? road.to : road.from;
    const intPos = this.intersectionPositions.get(intId);
    if (!intPos) return null;

    const dir = road.direction;
    const offset = ROAD_LENGTH;
    switch (dir) {
      case 'north': return [intPos[0], intPos[1] + offset];
      case 'south': return [intPos[0], intPos[1] - offset];
      case 'east': return [intPos[0] + offset, intPos[1]];
      case 'west': return [intPos[0] - offset, intPos[1]];
    }
  }

  getIntersectionPosition(id: string): [number, number] | undefined {
    return this.intersectionPositions.get(id);
  }

  getRoads(): Road[] {
    return this.roads;
  }

  getInboundRoads(): Road[] {
    return this.inboundRoads;
  }

  getOutboundRoads(): Road[] {
    return this.outboundRoads;
  }

  updateIntersectionPhases(
    intersectionId: string,
    phases: SignalPhaseConfig[],
  ): void {
    const intersection = this.intersections.get(intersectionId);
    if (intersection) {
      intersection.phases = phases.map((p) => ({ ...p }));
    }
  }

  restoreState(gameTime: number, intersections: IntersectionState[], throughput: number): void {
    this.gameTime = gameTime;
    this.throughputCounter = throughput;
    for (const is of intersections) {
      const existing = this.intersections.get(is.id);
      if (existing) {
        existing.currentPhase = is.currentPhase;
        existing.phaseTimer = is.phaseTimer;
        existing.phases = is.phases.map((p) => ({ ...p }));
      }
    }
  }

  getWaitingCount(): number {
    return this.vehicles.filter((v) => v.waiting).length;
  }
}

export const trafficSim = new TrafficSim();
