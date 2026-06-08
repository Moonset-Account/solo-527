import type { Direction, Intersection, RoadLayout } from '@/engine/types';

export interface RoadSegment {
  id: string;
  from: string;
  to: string;
  direction: Direction;
  length: number;
  lanes: number;
  isBusRoute: boolean;
}

const ROAD_LENGTH = 40;
const LANE_COUNT = 2;

const SINGLE_POSITIONS: Record<string, { x: number; z: number }> = {
  'int-1': { x: 0, z: 0 },
};

const DOUBLE_POSITIONS: Record<string, { x: number; z: number }> = {
  'int-1': { x: 0, z: 0 },
  'int-2': { x: ROAD_LENGTH, z: 0 },
};

const GRID_2X2_POSITIONS: Record<string, { x: number; z: number }> = {
  'int-1': { x: 0, z: 0 },
  'int-2': { x: ROAD_LENGTH, z: 0 },
  'int-3': { x: 0, z: ROAD_LENGTH },
  'int-4': { x: ROAD_LENGTH, z: ROAD_LENGTH },
};

const GRID_3X3_POSITIONS: Record<string, { x: number; z: number }> = {
  'int-1': { x: 0, z: 0 },
  'int-2': { x: ROAD_LENGTH, z: 0 },
  'int-3': { x: ROAD_LENGTH * 2, z: 0 },
  'int-4': { x: 0, z: ROAD_LENGTH },
  'int-5': { x: ROAD_LENGTH, z: ROAD_LENGTH },
  'int-6': { x: ROAD_LENGTH * 2, z: ROAD_LENGTH },
  'int-7': { x: 0, z: ROAD_LENGTH * 2 },
  'int-8': { x: ROAD_LENGTH, z: ROAD_LENGTH * 2 },
  'int-9': { x: ROAD_LENGTH * 2, z: ROAD_LENGTH * 2 },
};

function getPositions(layout: RoadLayout): Record<string, { x: number; z: number }> {
  switch (layout) {
    case 'single': return SINGLE_POSITIONS;
    case 'double': return DOUBLE_POSITIONS;
    case 'grid-2x2': return GRID_2X2_POSITIONS;
    case 'grid-3x3': return GRID_3X3_POSITIONS;
  }
}

function getDirectionsForLayout(layout: RoadLayout): Direction[] {
  if (layout === 'single') return ['north', 'south', 'east', 'west'];
  return ['north', 'south', 'east', 'west'];
}

export class RoadGraph {
  intersections: Map<string, Intersection> = new Map();
  segments: Map<string, RoadSegment> = new Map();
  adjacency: Map<string, string[]> = new Map();

  static fromLayout(layout: RoadLayout): RoadGraph {
    const graph = new RoadGraph();
    const positions = getPositions(layout);

    for (const [id, pos] of Object.entries(positions)) {
      const intersection: Intersection = {
        id,
        position: pos,
        roads: getDirectionsForLayout(layout),
        trafficLightId: id,
      };
      graph.intersections.set(id, intersection);
      graph.adjacency.set(id, []);
    }

    const ids = Object.keys(positions);
    for (const id of ids) {
      const pos = positions[id];
      for (const otherId of ids) {
        if (id === otherId) continue;
        const otherPos = positions[otherId];
        const dx = otherPos.x - pos.x;
        const dz = otherPos.z - pos.z;

        if (dx === ROAD_LENGTH && dz === 0) {
          graph.addSegment(id, otherId, 'east');
        } else if (dx === -ROAD_LENGTH && dz === 0) {
          graph.addSegment(id, otherId, 'west');
        } else if (dz === ROAD_LENGTH && dx === 0) {
          graph.addSegment(id, otherId, 'south');
        } else if (dz === -ROAD_LENGTH && dx === 0) {
          graph.addSegment(id, otherId, 'north');
        }
      }
    }

    return graph;
  }

  private addSegment(from: string, to: string, direction: Direction): void {
    const id = `${from}-${to}`;
    const seg: RoadSegment = {
      id,
      from,
      to,
      direction,
      length: ROAD_LENGTH,
      lanes: LANE_COUNT,
      isBusRoute: false,
    };
    this.segments.set(id, seg);
    const adj = this.adjacency.get(from) ?? [];
    if (!adj.includes(to)) {
      adj.push(to);
    }
    this.adjacency.set(from, adj);
  }

  getShortestPath(from: string, to: string): string[] {
    if (from === to) return [from];
    const visited = new Set<string>();
    const queue: string[][] = [[from]];
    visited.add(from);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      const neighbors = this.adjacency.get(current) ?? [];

      for (const neighbor of neighbors) {
        if (neighbor === to) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return [from];
  }

  getSegmentsForIntersection(id: string): RoadSegment[] {
    const result: RoadSegment[] = [];
    for (const seg of this.segments.values()) {
      if (seg.from === id || seg.to === id) {
        result.push(seg);
      }
    }
    return result;
  }

  getSegmentBetween(from: string, to: string): RoadSegment | undefined {
    return this.segments.get(`${from}-${to}`);
  }

  getVehicleSpawnPoints(): { intersectionId: string; direction: Direction }[] {
    const spawns: { intersectionId: string; direction: Direction }[] = [];
    for (const [id, intersection] of this.intersections) {
      const neighbors = this.adjacency.get(id) ?? [];
      if (!neighbors.some(n => {
        const seg = this.getSegmentBetween(id, n);
        return seg?.direction === 'south';
      })) {
        spawns.push({ intersectionId: id, direction: 'south' });
      }
      if (!neighbors.some(n => {
        const seg = this.getSegmentBetween(id, n);
        return seg?.direction === 'east';
      })) {
        spawns.push({ intersectionId: id, direction: 'east' });
      }
      if (!neighbors.some(n => {
        const seg = this.getSegmentBetween(id, n);
        return seg?.direction === 'north';
      })) {
        spawns.push({ intersectionId: id, direction: 'north' });
      }
      if (!neighbors.some(n => {
        const seg = this.getSegmentBetween(id, n);
        return seg?.direction === 'west';
      })) {
        spawns.push({ intersectionId: id, direction: 'west' });
      }
    }
    return spawns;
  }

  getEdgeIntersections(): { id: string; entryDirections: Direction[] }[] {
    const edges: { id: string; entryDirections: Direction[] }[] = [];
    for (const [id, _intersection] of this.intersections) {
      const neighbors = this.adjacency.get(id) ?? [];
      const directions: Direction[] = [];

      if (!neighbors.some(n => this.getSegmentBetween(id, n)?.direction === 'north')) {
        directions.push('south');
      }
      if (!neighbors.some(n => this.getSegmentBetween(id, n)?.direction === 'south')) {
        directions.push('north');
      }
      if (!neighbors.some(n => this.getSegmentBetween(id, n)?.direction === 'east')) {
        directions.push('west');
      }
      if (!neighbors.some(n => this.getSegmentBetween(id, n)?.direction === 'west')) {
        directions.push('east');
      }

      if (directions.length > 0) {
        edges.push({ id, entryDirections: directions });
      }
    }
    return edges;
  }

  markBusRoutes(routeStops: string[][]): void {
    for (const seg of this.segments.values()) {
      seg.isBusRoute = false;
    }
    for (const stops of routeStops) {
      for (let i = 0; i < stops.length - 1; i++) {
        const seg = this.getSegmentBetween(stops[i], stops[i + 1]);
        if (seg) seg.isBusRoute = true;
        const segReverse = this.getSegmentBetween(stops[i + 1], stops[i]);
        if (segReverse) segReverse.isBusRoute = true;
      }
    }
  }
}
