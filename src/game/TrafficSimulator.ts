import type {
  Direction,
  LevelConfig,
  MetricsSnapshot,
  PhaseConfig,
  ScoreResult,
  SimulationFrame,
  SpawnPattern,
  Vehicle,
} from '@/types';
import { RoadNetwork } from './RoadNetwork';
import { BusSystem } from './BusSystem';
import { ScoringEngine } from './ScoringEngine';
import { eventBus } from './EventBus';
import { createVehicle, updateVehicleMovement, vehicleDistanceTo } from './Vehicle';
import type { Direction as DirType } from '@/types';

const DIR_VECTORS: Record<Direction, { x: number; z: number }> = {
  N: { x: 0, z: -1 },
  S: { x: 0, z: 1 },
  E: { x: 1, z: 0 },
  W: { x: -1, z: 0 },
};

export class TrafficSimulator {
  private roadNetwork: RoadNetwork;
  private busSystem: BusSystem;
  private scoringEngine: ScoringEngine;

  private vehicles: Vehicle[] = [];
  private levelConfig: LevelConfig;
  private phaseConfig: PhaseConfig;

  private timeElapsed: number = 0;
  private speedScale: number = 1;
  private throughput: number = 0;
  private totalSpawned: number = 0;

  private metricsHistory: MetricsSnapshot[] = [];
  private frames: SimulationFrame[] = [];
  private frameCounter: number = 0;

  private running: boolean = false;
  private spawnCooldown: Record<string, number> = {};

  private readonly PRIMARY_INTERSECTION = 'int_main';
  private readonly FRAME_INTERVAL = 0.1;

  constructor(levelConfig: LevelConfig) {
    this.levelConfig = levelConfig;
    this.phaseConfig = { ...levelConfig.initialPhaseConfig };

    this.roadNetwork = new RoadNetwork(
      levelConfig.roadNetwork,
      this.phaseConfig
    );
    this.busSystem = new BusSystem();
    this.scoringEngine = new ScoringEngine();
  }

  start(): void {
    this.running = true;
    eventBus.emit('simulation:start');
  }

  pause(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  reset(): void {
    this.vehicles = [];
    this.timeElapsed = 0;
    this.throughput = 0;
    this.totalSpawned = 0;
    this.metricsHistory = [];
    this.frames = [];
    this.frameCounter = 0;
    this.spawnCooldown = {};
    this.roadNetwork.reset();
    this.busSystem.reset();
    this.running = false;
  }

  setSpeedScale(scale: number): void {
    this.speedScale = Math.max(0.1, Math.min(5, scale));
  }

  getSpeedScale(): number {
    return this.speedScale;
  }

  applyPhaseConfig(config: Partial<PhaseConfig>): void {
    this.phaseConfig = { ...this.phaseConfig, ...config };
    this.roadNetwork.applyPhaseConfig(config);
    eventBus.emit('timing:apply', { config: this.phaseConfig });
  }

  getPhaseConfig(): PhaseConfig {
    return { ...this.phaseConfig };
  }

  update(rawDelta: number): MetricsSnapshot {
    const delta = rawDelta * this.speedScale;

    if (this.running) {
      this.timeElapsed += delta;
      this.roadNetwork.update(delta);

      this.checkBusPriority();
      this.spawnVehicles(delta);
      this.updateVehicles(delta);
      this.cleanupExitedVehicles();

      eventBus.emit('simulation:tick', {
        delta,
        metrics: this.calculateMetrics(),
      });
    }

    const metrics = this.calculateMetrics();
    this.metricsHistory.push(metrics);

    if (this.metricsHistory.length > 600) {
      this.metricsHistory.shift();
    }

    this.frameCounter += delta;
    if (this.frameCounter >= this.FRAME_INTERVAL) {
      this.captureFrame();
      this.frameCounter = 0;
    }

    return metrics;
  }

  private checkBusPriority(): void {
    if (!this.phaseConfig.busPriority) return;

    const busQueue = this.roadNetwork.getBusQueue(this.PRIMARY_INTERSECTION);
    if (busQueue >= this.phaseConfig.busThreshold) {
      this.roadNetwork.triggerBusPriority(this.PRIMARY_INTERSECTION);
    }
  }

  private getActiveSpawnPatterns(): SpawnPattern[] {
    return this.levelConfig.spawnPatterns.filter(
      (p) =>
        this.timeElapsed >= p.time &&
        this.timeElapsed < p.time + p.duration
    );
  }

  private spawnVehicles(delta: number): void {
    const patterns = this.getActiveSpawnPatterns();
    if (patterns.length === 0) return;

    const intersection = this.roadNetwork.getPrimaryIntersection();
    if (!intersection) return;

    for (const pattern of patterns) {
      const spawnProb = pattern.rate * delta;

      if (Math.random() < spawnProb) {
        this.spawnCar(pattern);
      }

      if (Math.random() < pattern.taxiRate * delta) {
        this.spawnCar(pattern, 'taxi');
      }

      if (Math.random() < pattern.busRate * delta) {
        this.spawnBus(intersection.id);
      }
    }
  }

  private chooseDirection(pattern: SpawnPattern): Direction {
    const dirs: Direction[] = ['N', 'S', 'E', 'W'];
    const weights = dirs.map((d) => pattern.directionBias[d] || 0.25);
    const total = weights.reduce((a, b) => a + b, 0);

    let r = Math.random() * total;
    for (let i = 0; i < dirs.length; i++) {
      r -= weights[i];
      if (r <= 0) return dirs[i];
    }
    return dirs[0];
  }

  private spawnCar(pattern: SpawnPattern, type: 'car' | 'taxi' = 'car'): void {
    const intersection = this.roadNetwork.getPrimaryIntersection();
    if (!intersection) return;

    const fromDir = this.chooseDirection(pattern);
    const laneId = this.roadNetwork.getRandomLaneId(intersection.id, fromDir);
    if (!laneId) return;

    const entry = this.roadNetwork.getLaneEntryPoint(intersection.id, laneId);
    if (!entry) return;

    const intSec = this.roadNetwork.getIntersection(intersection.id);
    const lane = intSec?.lanes.get(laneId);
    if (lane && lane.queue.length >= lane.maxQueue - 2) return;

    const route = this.generateRandomRoute(fromDir);

    const vehicle = createVehicle({
      type,
      position: { ...entry },
      rotation: entry.rotation,
      laneId,
      route,
    });

    this.vehicles.push(vehicle);
    this.totalSpawned++;
    lane?.queue.push(vehicle);
  }

  private generateRandomRoute(fromDir: Direction): Direction[] {
    const straight: Record<Direction, Direction> = {
      N: 'S',
      S: 'N',
      E: 'W',
      W: 'E',
    };
    const left: Record<Direction, Direction> = {
      N: 'E',
      E: 'S',
      S: 'W',
      W: 'N',
    };

    return Math.random() < 0.7
      ? [straight[fromDir], left[fromDir]]
      : [left[fromDir], straight[fromDir]];
  }

  private spawnBus(intersectionId: string): void {
    const fromDirs: Direction[] = ['N', 'S', 'E', 'W'];
    const fromDir = fromDirs[Math.floor(Math.random() * 4)];
    const laneId = this.roadNetwork.getRandomLaneId(intersectionId, fromDir);
    if (!laneId) return;

    const entry = this.roadNetwork.getLaneEntryPoint(intersectionId, laneId);
    if (!entry) return;

    const intSec = this.roadNetwork.getIntersection(intersectionId);
    const lane = intSec?.lanes.get(laneId);
    if (lane && lane.queue.length >= lane.maxQueue - 2) return;

    const route = this.busSystem.getRoutes().length > 0
      ? this.busSystem.getRoutes()[0]
      : {
          id: 'bus_1',
          name: '1号线',
          color: '#4ecdc4',
          stops: [
            { position: { x: -30, z: 0 }, stopDuration: 3, name: '北大街站' },
            { position: { x: 30, z: 0 }, stopDuration: 3, name: '南大街站' },
          ],
          schedule: [10, 30, 50, 70, 90, 110],
        };

    if (this.busSystem.getRoutes().length === 0) {
      this.busSystem.addRoute(route);
    }

    const bus = this.busSystem.createBus(
      route,
      { ...entry },
      entry.rotation,
      laneId
    );

    this.vehicles.push(bus);
    this.totalSpawned++;
    lane?.queue.push(bus);
  }

  private updateVehicles(delta: number): void {
    const intersection = this.roadNetwork.getPrimaryIntersection();
    if (!intersection) return;

    for (const vehicle of this.vehicles) {
      const lane = intersection.lanes.get(vehicle.laneId);
      if (!lane) continue;

      const stopPoint = this.roadNetwork.getLaneStopPoint(
        intersection.id,
        vehicle.laneId
      );
      if (!stopPoint) continue;

      const distToStop = vehicleDistanceTo(vehicle, stopPoint);

      const indexInQueue = lane.queue.findIndex((v) => v.id === vehicle.id);
      const carAhead = indexInQueue > 0 ? lane.queue[indexInQueue - 1] : null;
      let safeDistance = 6;
      if (carAhead) {
        const d = vehicleDistanceTo(vehicle, carAhead.position);
        if (d < safeDistance) {
          updateVehicleMovement(vehicle, delta, false, this.speedScale);
          continue;
        }
      }

      if (vehicle.isBus) {
        const busBehavior = this.busSystem.updateBusBehavior(
          vehicle,
          this.timeElapsed,
          delta
        );
        if (busBehavior.shouldStop) {
          updateVehicleMovement(vehicle, delta, false, this.speedScale);
          continue;
        }
      }

      const isGreen = this.roadNetwork.isLightGreen(
        intersection.id,
        vehicle.laneId
      );
      const isYellow = this.roadNetwork.isLightYellow(
        intersection.id,
        vehicle.laneId
      );

      const stopThreshold = isYellow ? 1 : 2;

      if (distToStop < stopThreshold && !isGreen) {
        if (!vehicle.atIntersection) {
          vehicle.atIntersection = true;
          updateVehicleMovement(vehicle, delta, false, this.speedScale);
          continue;
        }
      }

      if (isGreen && distToStop < 8) {
        vehicle.atIntersection = false;
        const exitDir = lane.to as DirType;
        const exit = this.roadNetwork.getLaneExitPoint(intersection.id, exitDir);
        if (exit) {
          const exitVec = DIR_VECTORS[exitDir];
          const targetRot = Math.atan2(exitVec.x, -exitVec.z);
          vehicle.rotation = this.slerpRotation(vehicle.rotation, targetRot, 0.1);
        }
      }

      updateVehicleMovement(vehicle, delta, true, this.speedScale);
    }
  }

  private slerpRotation(from: number, to: number, t: number): number {
    let diff = to - from;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return from + diff * t;
  }

  private cleanupExitedVehicles(): void {
    const intersection = this.roadNetwork.getPrimaryIntersection();
    if (!intersection) return;

    const boundary = 60;
    const toRemove: string[] = [];

    for (const vehicle of this.vehicles) {
      const dx = Math.abs(vehicle.position.x - intersection.position.x);
      const dz = Math.abs(vehicle.position.z - intersection.position.z);

      if (dx > boundary || dz > boundary) {
        toRemove.push(vehicle.id);
        this.throughput++;

        if (vehicle.isBus) {
          this.busSystem.removeBus(vehicle.id);
        }
      }
    }

    for (const lane of intersection.lanes.values()) {
      lane.queue = lane.queue.filter((v) => !toRemove.includes(v.id));
    }

    this.vehicles = this.vehicles.filter((v) => !toRemove.includes(v.id));
  }

  private calculateMetrics(): MetricsSnapshot {
    let totalWaiting = 0;
    let totalSpeed = 0;
    let queueSum = 0;
    const queueLengths: Record<string, number> = {};

    const intersection = this.roadNetwork.getPrimaryIntersection();
    if (intersection) {
      for (const [laneId, lane] of intersection.lanes) {
        queueLengths[laneId] = lane.queue.length;
        queueSum += lane.queue.length;
      }
    }

    for (const vehicle of this.vehicles) {
      totalWaiting += vehicle.waitingTime;
      totalSpeed += vehicle.speed;
    }

    const n = Math.max(1, this.vehicles.length);
    const avgWaiting = totalWaiting / n;
    const avgSpeed = totalSpeed / n;

    const maxQueue = Math.max(...Object.values(queueLengths), 0);
    const congestionIndex = Math.min(
      100,
      (queueSum / 40) * 40 + (avgWaiting / 30) * 40 + maxQueue * 2
    );

    return {
      timestamp: this.timeElapsed,
      congestionIndex,
      avgWaitingTime: avgWaiting,
      avgSpeed,
      busOnTimeRate: this.busSystem.getOnTimeRate(),
      throughput: this.throughput,
      queueLengths,
      vehicleCount: this.vehicles.length,
      busCount: this.busSystem.getActiveBusCount(),
    };
  }

  private captureFrame(): void {
    const lightStates: Record<string, any> = {};
    for (const isect of this.roadNetwork.getIntersections()) {
      lightStates[isect.id] = isect.trafficLight;
    }

    const frame: SimulationFrame = {
      time: this.timeElapsed,
      vehicles: this.vehicles.map((v) => ({
        id: v.id,
        position: { ...v.position },
        rotation: v.rotation,
        color: v.color,
        type: v.type,
      })),
      lightStates,
      metrics: this.calculateMetrics(),
    };

    this.frames.push(frame);
    eventBus.emit('replay:capture', { frameData: frame });

    if (this.frames.length > 1200) {
      this.frames.shift();
    }
  }

  getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  getMetrics(): MetricsSnapshot {
    return this.calculateMetrics();
  }

  getMetricsHistory(): MetricsSnapshot[] {
    return [...this.metricsHistory];
  }

  getFrames(): SimulationFrame[] {
    return [...this.frames];
  }

  getFrameAtIndex(index: number): SimulationFrame | null {
    return this.frames[index] || null;
  }

  getTimeElapsed(): number {
    return this.timeElapsed;
  }

  getDuration(): number {
    return this.levelConfig.duration;
  }

  getLevelConfig(): LevelConfig {
    return this.levelConfig;
  }

  getRoadNetwork(): RoadNetwork {
    return this.roadNetwork;
  }

  calculateFinalScore(): ScoreResult {
    return this.scoringEngine.calculateFinalScore(
      this.metricsHistory,
      this.vehicles,
      this.levelConfig
    );
  }

  getBusSystem(): BusSystem {
    return this.busSystem;
  }

  getSummary() {
    return {
      timeElapsed: this.timeElapsed,
      totalVehicles: this.totalSpawned,
      throughput: this.throughput,
      busCount: this.busSystem.getActiveBusCount(),
    };
  }

  setSpawnRate(rate: number): void {
    if (this.levelConfig.spawnPatterns.length > 0) {
      this.levelConfig.spawnPatterns[0].rate = Math.max(0.1, Math.min(5, rate));
    }
  }

  setDirectionBias(bias: Record<Direction, number>): void {
    if (this.levelConfig.spawnPatterns.length > 0) {
      const total = bias.N + bias.S + bias.E + bias.W;
      if (total > 0) {
        this.levelConfig.spawnPatterns[0].directionBias = {
          N: bias.N / total,
          S: bias.S / total,
          E: bias.E / total,
          W: bias.W / total,
        };
      }
    }
  }

  setBusRate(busRate: number): void {
    if (this.levelConfig.spawnPatterns.length > 0) {
      this.levelConfig.spawnPatterns[0].busRate = Math.max(0, Math.min(0.5, busRate));
    }
  }

  setTaxiRate(taxiRate: number): void {
    if (this.levelConfig.spawnPatterns.length > 0) {
      this.levelConfig.spawnPatterns[0].taxiRate = Math.max(0, Math.min(0.5, taxiRate));
    }
  }
}
