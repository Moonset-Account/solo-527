import type {
  Direction,
  Intersection,
  Lane,
  Road,
  RoadNetworkConfig,
} from '@/types';
import { TrafficLightController } from './TrafficLight';
import type { PhaseConfig } from '@/types';

const DIR_VECTORS: Record<Direction, { x: number; z: number }> = {
  N: { x: 0, z: -1 },
  S: { x: 0, z: 1 },
  E: { x: 1, z: 0 },
  W: { x: -1, z: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

const LANE_WIDTH = 3.5;
const LANE_LENGTH = 80;

function laneId(intersectionId: string, from: Direction, idx: number): string {
  return `${intersectionId}_${from}_${idx}`;
}

export class RoadNetwork {
  private intersections: Map<string, Intersection> = new Map();
  private roads: Road[] = [];
  private trafficLights: Map<string, TrafficLightController> = new Map();

  constructor(config: RoadNetworkConfig, phaseConfig: PhaseConfig) {
    this.buildFromConfig(config, phaseConfig);
  }

  private buildFromConfig(config: RoadNetworkConfig, phaseConfig: PhaseConfig) {
    for (const intConfig of config.intersections) {
      const intersection: Intersection = {
        id: intConfig.id,
        position: { ...intConfig.position },
        size: intConfig.size,
        lanes: new Map(),
        trafficLight: {
          currentPhase: 'NS_GREEN',
          phaseTimer: 0,
          totalCycle: 0,
          busOverride: false,
          nsIntensity: 1,
          ewIntensity: 0,
        },
        queueLength: {},
        busQueue: 0,
      };

      this.createLanesForIntersection(intersection);
      this.intersections.set(intConfig.id, intersection);
      this.trafficLights.set(
        intConfig.id,
        new TrafficLightController(phaseConfig)
      );
    }

    this.roads = [...config.roads];
  }

  private createLanesForIntersection(intersection: Intersection) {
    const directions: Direction[] = ['N', 'S', 'E', 'W'];
    const halfSize = intersection.size / 2;

    for (const dir of directions) {
      for (let i = 0; i < 2; i++) {
        const lane = this.createLane(intersection, dir, i, halfSize);
        intersection.lanes.set(lane.id, lane);
      }
    }
  }

  private createLane(
    intersection: Intersection,
    from: Direction,
    idx: number,
    halfSize: number
  ): Lane {
    const vec = DIR_VECTORS[from];
    const perp = { x: -vec.z, z: vec.x };

    const offset = (idx - 0.5) * LANE_WIDTH;
    const edgeOffset = halfSize + LANE_LENGTH * 0.5;

    const laneStart = {
      x: intersection.position.x + vec.x * -edgeOffset + perp.x * offset,
      z: intersection.position.z + vec.z * -edgeOffset + perp.z * offset,
    };

    const id = laneId(intersection.id, from, idx);
    const toDir = this.getTurnDirection(from, idx);

    return {
      id,
      from,
      to: toDir,
      direction: from,
      position: laneStart,
      length: LANE_LENGTH,
      queue: [],
      maxQueue: Math.floor(LANE_LENGTH / 5),
    };
  }

  private getTurnDirection(from: Direction, idx: number): Direction {
    if (idx === 0) return OPPOSITE[from];

    const leftTurns: Record<Direction, Direction> = {
      N: 'E',
      E: 'S',
      S: 'W',
      W: 'N',
    };
    return leftTurns[from];
  }

  getLaneEntryPoint(
    intersectionId: string,
    laneIdStr: string
  ): { x: number; z: number; rotation: number } | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    const lane = intersection.lanes.get(laneIdStr);
    if (!lane) return null;

    const vec = DIR_VECTORS[lane.direction];
    const rotation = Math.atan2(vec.x, -vec.z);

    return {
      x: lane.position.x,
      z: lane.position.z,
      rotation,
    };
  }

  getLaneStopPoint(
    intersectionId: string,
    laneIdStr: string
  ): { x: number; z: number } | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    const lane = intersection.lanes.get(laneIdStr);
    if (!lane) return null;

    const vec = DIR_VECTORS[lane.direction];
    const halfSize = intersection.size / 2;

    return {
      x: lane.position.x + vec.x * (LANE_LENGTH * 0.5 - halfSize),
      z: lane.position.z + vec.z * (LANE_LENGTH * 0.5 - halfSize),
    };
  }

  getLaneExitPoint(
    intersectionId: string,
    toDirection: Direction
  ): { x: number; z: number; rotation: number } | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    const vec = DIR_VECTORS[toDirection];
    const halfSize = intersection.size / 2 + 2;
    const rotation = Math.atan2(vec.x, -vec.z);

    return {
      x: intersection.position.x + vec.x * halfSize,
      z: intersection.position.z + vec.z * halfSize,
      rotation,
    };
  }

  getRandomLaneId(intersectionId: string, fromDir?: Direction): string | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    const laneIds = Array.from(intersection.lanes.values())
      .filter((l) => !fromDir || l.from === fromDir)
      .map((l) => l.id);

    if (laneIds.length === 0) return null;
    return laneIds[Math.floor(Math.random() * laneIds.length)];
  }

  getDirectionFromLane(
    intersectionId: string,
    laneIdStr: string
  ): 'NS' | 'EW' | null {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return null;

    const lane = intersection.lanes.get(laneIdStr);
    if (!lane) return null;

    return lane.from === 'N' || lane.from === 'S' ? 'NS' : 'EW';
  }

  isLightGreen(intersectionId: string, laneIdStr: string): boolean {
    const direction = this.getDirectionFromLane(intersectionId, laneIdStr);
    if (!direction) return false;

    const light = this.trafficLights.get(intersectionId);
    return light ? light.isGreen(direction) : false;
  }

  isLightYellow(intersectionId: string, laneIdStr: string): boolean {
    const direction = this.getDirectionFromLane(intersectionId, laneIdStr);
    if (!direction) return false;

    const light = this.trafficLights.get(intersectionId);
    return light ? light.isYellow(direction) : false;
  }

  update(delta: number) {
    for (const [id, light] of this.trafficLights) {
      light.update(delta);
      const intersection = this.intersections.get(id);
      if (intersection) {
        intersection.trafficLight = light.getState();
      }
    }

    for (const intersection of this.intersections.values()) {
      intersection.queueLength = {};
      intersection.busQueue = 0;
      for (const lane of intersection.lanes.values()) {
        intersection.queueLength[lane.id] = lane.queue.length;
      }
    }
  }

  getTrafficLightState(
    intersectionId: string
  ): import('@/types').TrafficLightState | null {
    const light = this.trafficLights.get(intersectionId);
    return light ? light.getState() : null;
  }

  getIntersection(intersectionId: string): Intersection | null {
    return this.intersections.get(intersectionId) || null;
  }

  getIntersections(): Intersection[] {
    return Array.from(this.intersections.values());
  }

  getRoads(): Road[] {
    return this.roads;
  }

  getPrimaryIntersection(): Intersection | null {
    return this.intersections.values().next().value || null;
  }

  triggerBusPriority(intersectionId: string) {
    const light = this.trafficLights.get(intersectionId);
    light?.triggerBusPriority();
  }

  applyPhaseConfig(config: Partial<PhaseConfig>) {
    for (const light of this.trafficLights.values()) {
      light.applyConfig(config);
    }
  }

  reset() {
    for (const light of this.trafficLights.values()) {
      light.reset();
    }
    for (const intersection of this.intersections.values()) {
      for (const lane of intersection.lanes.values()) {
        lane.queue = [];
      }
      intersection.queueLength = {};
      intersection.busQueue = 0;
    }
  }

  getBusQueue(intersectionId: string): number {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return 0;

    let count = 0;
    for (const lane of intersection.lanes.values()) {
      count += lane.queue.filter((v) => v.isBus).length;
    }
    return count;
  }

  getTotalQueueLength(intersectionId: string): number {
    const intersection = this.intersections.get(intersectionId);
    if (!intersection) return 0;

    return Object.values(intersection.queueLength).reduce((a, b) => a + b, 0);
  }
}
