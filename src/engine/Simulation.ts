import type { Vehicle, Direction, TrafficLightConfig, TrafficLightState, ScoreResult, LevelConfig } from '@/engine/types';
import { RoadGraph } from './RoadGraph';
import { TrafficLightController } from './TrafficLightController';
import { createVehicle, updateVehicle, resetVehicleCounter } from './VehicleAgent';
import { ScoreCalculator } from './ScoreCalculator';
import { CollisionSystem } from './CollisionSystem';
import { VEHICLE_CONFIG } from '@/config/vehicles';

export interface SimulationState {
  time: number;
  vehicles: Vehicle[];
  trafficLightStates: TrafficLightState[];
  score: ScoreResult | null;
  isRunning: boolean;
  speed: number;
}

export class Simulation {
  graph: RoadGraph;
  trafficLights: Map<string, TrafficLightController> = new Map();
  vehicles: Vehicle[] = [];
  collisionSystem: CollisionSystem;
  scoreCalculator: ScoreCalculator;
  time = 0;
  isRunning = false;
  speed = 1;
  levelConfig: LevelConfig;
  spawnAccumulators: Map<string, number> = new Map();
  maxVehicles = 200;

  constructor(levelConfig: LevelConfig) {
    this.levelConfig = levelConfig;
    this.graph = RoadGraph.fromLayout(levelConfig.roadLayout);
    this.collisionSystem = new CollisionSystem();
    this.scoreCalculator = new ScoreCalculator();

    if (levelConfig.busRoutes.length > 0) {
      this.graph.markBusRoutes(levelConfig.busRoutes.map(r => r.stops));
    }

    for (const config of levelConfig.initialTrafficLightConfigs) {
      this.trafficLights.set(config.intersectionId, new TrafficLightController(config));
    }

    for (const density of levelConfig.trafficDensity) {
      this.spawnAccumulators.set(density.direction, 0);
    }
  }

  update(dt: number): SimulationState {
    if (!this.isRunning) {
      return this.getState();
    }

    const scaledDt = dt * this.speed;
    this.time += scaledDt;

    for (const tl of this.trafficLights.values()) {
      const busDistances = this.getBusDistancesForIntersection(tl.config.intersectionId);
      tl.update(scaledDt, busDistances);
    }

    this.spawnVehicles(scaledDt);

    this.collisionSystem.rebuildGrid(this.vehicles);

    const updatedVehicles: Vehicle[] = [];
    for (const vehicle of this.vehicles) {
      const tlController = this.findNearestTrafficLight(vehicle);
      const isGreen = (direction: Direction) => {
        if (!tlController) return true;
        return tlController.getLightState(direction) === 'green';
      };

      const getNearby = (x: number, z: number, radius: number) =>
        this.collisionSystem.getVehiclesNearPoint(x, z, radius);

      const updated = updateVehicle(vehicle, scaledDt, this.graph, isGreen, getNearby);
      updatedVehicles.push(updated);
    }
    this.vehicles = updatedVehicles;

    this.vehicles = this.vehicles.filter(v => {
      const bounds = this.getWorldBounds();
      return v.position.x >= bounds.minX - 20 && v.position.x <= bounds.maxX + 20 &&
             v.position.z >= bounds.minZ - 20 && v.position.z <= bounds.maxZ + 20;
    });

    if (this.vehicles.length > this.maxVehicles) {
      this.vehicles = this.vehicles.slice(-this.maxVehicles);
    }

    const score = this.scoreCalculator.calculate(
      this.vehicles,
      this.time,
      this.levelConfig.targetScore,
    );

    return this.getState();
  }

  private spawnVehicles(dt: number): void {
    if (this.vehicles.length >= this.maxVehicles) return;

    const edgeIntersections = this.graph.getEdgeIntersections();

    for (const density of this.levelConfig.trafficDensity) {
      let acc = this.spawnAccumulators.get(density.direction) ?? 0;
      const peakMultiplier = this.getPeakMultiplier(density);
      const effectiveRate = density.vehiclesPerMinute * peakMultiplier;
      acc += (effectiveRate / 60) * dt;
      this.spawnAccumulators.set(density.direction, acc);

      while (acc >= 1 && this.vehicles.length < this.maxVehicles) {
        acc -= 1;
        const edge = edgeIntersections.find(e => e.entryDirections.includes(density.direction));
        if (edge) {
          const vehicle = createVehicle(
            { intersectionId: edge.id, direction: density.direction, type: 'car' },
            this.graph,
          );
          if (vehicle) this.vehicles.push(vehicle);
        }
      }
      this.spawnAccumulators.set(density.direction, acc);
    }

    for (const busRoute of this.levelConfig.busRoutes) {
      const busAccKey = `bus-${busRoute.routeId}`;
      let busAcc = this.spawnAccumulators.get(busAccKey) ?? 0;
      busAcc += (busRoute.frequency / 60) * dt;
      this.spawnAccumulators.set(busAccKey, busAcc);

      while (busAcc >= 1) {
        busAcc -= 1;
        const firstStop = busRoute.stops[0];
        const secondStop = busRoute.stops[1] ?? firstStop;
        const intersection = this.graph.intersections.get(firstStop);
        if (intersection) {
          const nextIntersection = this.graph.intersections.get(secondStop);
          const direction = nextIntersection
            ? this.getDirectionBetween(intersection.position, nextIntersection.position)
            : 'east';
          const bus = createVehicle(
            {
              intersectionId: firstStop,
              direction,
              type: 'bus',
              busRouteIndex: this.levelConfig.busRoutes.indexOf(busRoute),
              busRouteStops: busRoute.stops,
            },
            this.graph,
          );
          if (bus) this.vehicles.push(bus);
        }
      }
      this.spawnAccumulators.set(busAccKey, busAcc);
    }
  }

  private getPeakMultiplier(density: { peakMultiplier: number; peakStartTime: number; peakEndTime: number }): number {
    if (density.peakMultiplier <= 1) return 1;
    const timeInSim = this.time % 300;
    if (timeInSim >= density.peakStartTime && timeInSim <= density.peakEndTime) {
      return density.peakMultiplier;
    }
    return 1;
  }

  private getDirectionBetween(
    from: { x: number; z: number },
    to: { x: number; z: number },
  ): Direction {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 'east' : 'west';
    }
    return dz > 0 ? 'south' : 'north';
  }

  private getBusDistancesForIntersection(intersectionId: string): number[] {
    const intersection = this.graph.intersections.get(intersectionId);
    if (!intersection) return [];

    return this.vehicles
      .filter(v => v.type === 'bus')
      .map(bus => {
        const dx = intersection.position.x - bus.position.x;
        const dz = intersection.position.z - bus.position.z;
        return Math.hypot(dx, dz);
      });
  }

  private findNearestTrafficLight(vehicle: Vehicle): TrafficLightController | null {
    let nearest: TrafficLightController | null = null;
    let nearestDist = Infinity;

    for (const tl of this.trafficLights.values()) {
      const intersection = this.graph.intersections.get(tl.config.intersectionId);
      if (!intersection) continue;
      const dx = intersection.position.x - vehicle.position.x;
      const dz = intersection.position.z - vehicle.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = tl;
      }
    }
    return nearest;
  }

  private getWorldBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const intersection of this.graph.intersections.values()) {
      minX = Math.min(minX, intersection.position.x);
      maxX = Math.max(maxX, intersection.position.x);
      minZ = Math.min(minZ, intersection.position.z);
      maxZ = Math.max(maxZ, intersection.position.z);
    }
    return { minX, maxX, minZ, maxZ };
  }

  updateTrafficLightConfig(intersectionId: string, patch: Partial<TrafficLightConfig>): void {
    const tl = this.trafficLights.get(intersectionId);
    if (tl) {
      tl.setConfig(patch);
    }
  }

  applyAllConfigs(configs: TrafficLightConfig[]): void {
    for (const config of configs) {
      const tl = this.trafficLights.get(config.intersectionId);
      if (tl) {
        tl.setConfig(config);
      }
    }
  }

  getState(): SimulationState {
    const trafficLightStates: TrafficLightState[] = [];
    for (const tl of this.trafficLights.values()) {
      trafficLightStates.push(tl.getState());
    }

    const score = this.vehicles.length > 0
      ? this.scoreCalculator.calculate(this.vehicles, this.time, this.levelConfig.targetScore)
      : null;

    return {
      time: this.time,
      vehicles: [...this.vehicles],
      trafficLightStates,
      score,
      isRunning: this.isRunning,
      speed: this.speed,
    };
  }

  setRunning(running: boolean): void {
    this.isRunning = running;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  reset(): void {
    this.time = 0;
    this.vehicles = [];
    this.isRunning = false;
    this.speed = 1;
    this.scoreCalculator.reset();
    resetVehicleCounter();
    for (const tl of this.trafficLights.values()) {
      tl.reset();
    }
    for (const key of this.spawnAccumulators.keys()) {
      this.spawnAccumulators.set(key, 0);
    }
  }

  getCongestionHeatmap(): { x: number; z: number; congestion: number }[] {
    const heatmap: { x: number; z: number; congestion: number }[] = [];
    const cellSize = 10;

    for (const intersection of this.graph.intersections.values()) {
      const nearby = this.collisionSystem.getVehiclesNearPoint(
        intersection.position.x,
        intersection.position.z,
        25,
      );
      const waiting = nearby.filter(v => v.isWaiting).length;
      heatmap.push({
        x: intersection.position.x,
        z: intersection.position.z,
        congestion: Math.min(1, waiting / 8),
      });
    }

    return heatmap;
  }
}
