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
}

interface SpawnPoint {
  roadId: string;
  direction: Direction;
  isEdge: boolean;
}

const VEHICLE_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#ecf0f1', '#bdc3c7', '#34495e',
  '#d35400', '#c0392b', '#16a085', '#27ae60', '#2980b9',
];

const BUS_COLOR = '#3498db';

export class TrafficSim {
  private roads: Road[] = [];
  private intersections: Map<string, IntersectionState> = new Map();
  private intersectionPositions: Map<string, [number, number]> = new Map();
  private vehicles: VehicleState[] = [];
  private spawnPoints: SpawnPoint[] = [];
  private level: LevelConfig | null = null;
  private gameTime: number = 0;
  private spawnAccumulators: Map<string, number> = new Map();
  private nextVehicleId: number = 0;
  private throughputCounter: number = 0;
  private totalWaitTime: number = 0;
  private waitingVehicleCount: number = 0;

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
    this.waitingVehicleCount = 0;

    this.roads = level.roads.map((r) => ({
      ...r,
      length: ROAD_LENGTH,
    }));

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

    this.spawnPoints = [];
    const intersectionIds = new Set(level.intersections.map((i) => i.id));
    for (const road of this.roads) {
      const isFromEdge = !intersectionIds.has(road.from);
      const isToEdge = !intersectionIds.has(road.to);
      if (isFromEdge) {
        this.spawnPoints.push({
          roadId: road.id,
          direction: road.direction,
          isEdge: true,
        });
      }
      if (isToEdge) {
        this.spawnPoints.push({
          roadId: road.id,
          direction: road.direction,
          isEdge: true,
        });
      }
      this.spawnAccumulators.set(road.id, 0);
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
    for (const [id, intersection] of this.intersections) {
      const phases = intersection.phases;
      if (phases.length === 0) continue;

      const currentPhaseIdx = intersection.currentPhase % phases.length;
      const currentPhase = phases[currentPhaseIdx];
      const greenDur = currentPhase.greenDuration;
      const cycleLen = currentPhase.cycleLength;

      intersection.phaseTimer += dt;

      if (intersection.phaseTimer >= greenDur) {
        const nextIdx = (currentPhaseIdx + 1) % phases.length;
        intersection.currentPhase = nextIdx;
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

    for (const sp of this.spawnPoints) {
      const road = this.roads.find((r) => r.id === sp.roadId);
      if (!road) continue;

      const baseRate = 0.3 * density;
      const accum = this.spawnAccumulators.get(sp.roadId) ?? 0;
      const newAccum = accum + baseRate * dt;

      if (newAccum >= 1) {
        const canSpawn = !this.vehicles.some(
          (v) => v.roadId === sp.roadId && v.position < VEHICLE_LENGTH * 2,
        );
        if (canSpawn) {
          this.spawnVehicle(sp.roadId, road);
        }
        this.spawnAccumulators.set(sp.roadId, newAccum - 1);
      } else {
        this.spawnAccumulators.set(sp.roadId, newAccum);
      }
    }

    this.spawnBuses(dt);
  }

  private spawnVehicle(roadId: string, road: Road): void {
    const isBus = false;
    const lane = Math.floor(Math.random() * road.lanes);
    this.vehicles.push({
      id: `v-${this.nextVehicleId++}`,
      roadId,
      position: 0,
      speed: MAX_SPEED * 0.5,
      lane,
      isBus,
      color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
      waiting: false,
    });
  }

  private spawnBuses(dt: number): void {
    if (!this.level) return;
    for (const route of this.level.busRoutes) {
      if (route.stops.length === 0) continue;
      const firstStop = route.stops[0];
      const road = this.roads.find(
        (r) => r.from === firstStop || r.to === firstStop,
      );
      if (!road) continue;

      const key = `bus-${route.id}`;
      let accum = this.spawnAccumulators.get(key) ?? 0;
      accum += (1 / route.frequency) * dt;

      if (accum >= 1) {
        const canSpawn = !this.vehicles.some(
          (v) => v.roadId === road.id && v.position < VEHICLE_LENGTH * 3 && v.isBus,
        );
        if (canSpawn) {
          const lane = 0;
          this.vehicles.push({
            id: `bus-${this.nextVehicleId++}`,
            roadId: road.id,
            position: 0,
            speed: MAX_SPEED * 0.4,
            lane,
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

    for (const [roadId, list] of vehiclesOnRoad) {
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

      const nearIntersection = v.position >= road.length - 1.5 && v.position < road.length;
      if (nearIntersection) {
        const isGreen = this.isGreenForRoad(v.roadId, v.isBus, v.busRouteId);
        if (!isGreen) {
          const stopPos = road.length - 0.5;
          const distToStop = stopPos - v.position;
          if (distToStop > 0) {
            targetSpeed = Math.min(targetSpeed, distToStop * 0.1);
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

      if (v.speed < targetSpeed) {
        v.speed = Math.min(targetSpeed, v.speed + ACCELERATION * dt);
      } else if (v.speed > targetSpeed) {
        v.speed = Math.max(targetSpeed, v.speed - DECELERATION * dt);
      }

      v.speed = Math.max(0, v.speed);
      v.position += v.speed * dt;

      if (v.position >= road.length) {
        this.handleIntersectionCrossing(v, road);
      }
    }

    this.totalWaitTime += dt * this.vehicles.filter((v) => v.waiting).length;
    this.waitingVehicleCount = this.vehicles.filter((v) => v.waiting).length;
  }

  private isGreenForRoad(
    roadId: string,
    isBus: boolean,
    busRouteId?: string,
  ): boolean {
    const road = this.roads.find((r) => r.id === roadId);
    if (!road) return true;

    const intersectionId = road.to;
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return true;

    const currentPhaseIdx = intersection.currentPhase % intersection.phases.length;
    const currentPhase = intersection.phases[currentPhaseIdx];

    if (isBus && currentPhase.busPriority) {
      return true;
    }

    const dir = road.direction;
    const ns = dir === 'north' || dir === 'south';
    const phaseDir = currentPhase.direction;
    const phaseNS = phaseDir === 'north' || phaseDir === 'south';

    if (ns && phaseNS) return true;
    if (!ns && !phaseNS) return true;

    return false;
  }

  private handleIntersectionCrossing(v: VehicleState, road: Road): void {
    const intersectionId = road.to;
    const isEdge = !this.intersections.has(intersectionId);

    if (isEdge) {
      this.throughputCounter++;
      v.position = road.length + 1;
      return;
    }

    const outRoads = this.roads.filter(
      (r) => r.from === intersectionId && r.id !== road.id,
    );
    if (outRoads.length === 0) {
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
          const nextRoad = outRoads.find(
            (r) => r.to === nextStop || r.from === nextStop,
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

    const nextRoad = outRoads[Math.floor(Math.random() * outRoads.length)];
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
    if (this.vehicles.length === 0) return 0;
    return this.totalWaitTime / Math.max(1, this.gameTime);
  }

  getRoadPosition(roadId: string): { from: [number, number]; to: [number, number] } | null {
    const road = this.roads.find((r) => r.id === roadId);
    if (!road) return null;
    const fromPos = this.intersectionPositions.get(road.from) ?? this.getEdgePosition(road.from, road.direction);
    const toPos = this.intersectionPositions.get(road.to) ?? this.getEdgePosition(road.to, road.direction);
    if (!fromPos || !toPos) return null;
    return { from: fromPos, to: toPos };
  }

  private getEdgePosition(edgeId: string, direction: Direction): [number, number] {
    const offset = ROAD_LENGTH;
    switch (direction) {
      case 'north': return [0, offset];
      case 'south': return [0, -offset];
      case 'east': return [offset, 0];
      case 'west': return [-offset, 0];
    }
  }

  getIntersectionPosition(id: string): [number, number] | undefined {
    return this.intersectionPositions.get(id);
  }

  getRoads(): Road[] {
    return this.roads;
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
}

export const trafficSim = new TrafficSim();
