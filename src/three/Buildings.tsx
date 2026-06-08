import { useMemo } from 'react';
import { RoadGraph } from '@/engine/RoadGraph';
import type { RoadLayout } from '@/engine/types';
import * as THREE from 'three';

interface BuildingsProps {
  layout: RoadLayout;
}

const BUILDING_COLORS = ['#0d0d1a', '#111122', '#0a0a15', '#141428', '#0e0e1e'];
const WINDOW_COLOR = '#00ff88';
const WINDOW_WARM_COLOR = '#ffaa44';
const ROAD_WIDTH = 6;
const BUILDING_OFFSET = ROAD_WIDTH / 2 + 1.5;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface BuildingData {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  windows: { x: number; y: number; z: number; color: string }[];
}

function Building({ data }: { data: BuildingData }) {
  return (
    <group position={[data.x, data.height / 2, data.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[data.width, data.height, data.depth]} />
        <meshStandardMaterial color={data.color} metalness={0.2} roughness={0.8} />
      </mesh>
      {data.windows.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, w.z]}>
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial
            color={w.color}
            emissive={w.color}
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function generateBuildingsAlongSegment(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  direction: string,
  rand: () => number,
  side: number,
  startId: number,
): BuildingData[] {
  const buildings: BuildingData[] = [];
  const isHorizontal = direction === 'east' || direction === 'west';
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const length = Math.sqrt(dx * dx + dz * dz);

  const perpX = isHorizontal ? 0 : side * BUILDING_OFFSET;
  const perpZ = isHorizontal ? side * BUILDING_OFFSET : 0;

  const steps = Math.floor(length / 6);
  let idCounter = startId;

  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const cx = fromX + dx * t + perpX;
    const cz = fromZ + dz * t + perpZ;

    const width = isHorizontal ? 4 + rand() * 3 : 3 + rand() * 2;
    const depth = isHorizontal ? 3 + rand() * 2 : 4 + rand() * 3;
    const height = 3 + rand() * 15;

    const color = BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)];

    const windows: { x: number; y: number; z: number; color: string }[] = [];
    const windowRows = Math.floor(height / 2.5);
    const windowCols = isHorizontal ? Math.floor(depth / 2) : Math.floor(width / 2);

    const faceDir = isHorizontal ? (side > 0 ? -1 : 1) : (side > 0 ? -1 : 1);
    const wallZ = isHorizontal ? faceDir * depth / 2 + 0.01 : 0;
    const wallX = isHorizontal ? 0 : faceDir * width / 2 + 0.01;

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (rand() > 0.55) continue;
        const wy = -height / 2 + 1.5 + row * 2.5;
        const wColor = rand() > 0.4 ? WINDOW_COLOR : WINDOW_WARM_COLOR;

        if (isHorizontal) {
          const wz = -depth / 2 + 1 + col * 2;
          windows.push({ x: wallZ * (depth / 2 + 0.01) * 0, y: wy, z: side > 0 ? -depth / 2 - 0.01 : depth / 2 + 0.01, color: wColor });
        } else {
          const wx = -width / 2 + 1 + col * 2;
          windows.push({ x: side > 0 ? -width / 2 - 0.01 : width / 2 + 0.01, y: wy, z: 0, color: wColor });
        }
      }
    }

    buildings.push({
      id: `bld-${idCounter++}`,
      x: cx,
      z: cz,
      width,
      depth,
      height,
      color,
      windows,
    });
  }

  return buildings;
}

export default function Buildings({ layout }: BuildingsProps) {
  const buildings = useMemo(() => {
    const graph = RoadGraph.fromLayout(layout);
    const rand = seededRandom(42);
    const allBuildings: BuildingData[] = [];
    let idCounter = 0;

    for (const seg of graph.segments.values()) {
      const from = graph.intersections.get(seg.from);
      const to = graph.intersections.get(seg.to);
      if (!from || !to) continue;

      for (const side of [1, -1]) {
        const segBuildings = generateBuildingsAlongSegment(
          from.position.x,
          from.position.z,
          to.position.x,
          to.position.z,
          seg.direction,
          rand,
          side,
          idCounter,
        );
        idCounter += segBuildings.length;
        allBuildings.push(...segBuildings);
      }
    }

    for (const inter of graph.intersections.values()) {
      const neighbors = graph.adjacency.get(inter.id) ?? [];
      const hasNorth = neighbors.some(n => graph.getSegmentBetween(inter.id, n)?.direction === 'north');
      const hasSouth = neighbors.some(n => graph.getSegmentBetween(inter.id, n)?.direction === 'south');
      const hasEast = neighbors.some(n => graph.getSegmentBetween(inter.id, n)?.direction === 'east');
      const hasWest = neighbors.some(n => graph.getSegmentBetween(inter.id, n)?.direction === 'west');

      const corners: { dx: number; dz: number }[] = [];
      if (!hasNorth && !hasEast) corners.push({ dx: BUILDING_OFFSET, dz: -BUILDING_OFFSET });
      if (!hasNorth && !hasWest) corners.push({ dx: -BUILDING_OFFSET, dz: -BUILDING_OFFSET });
      if (!hasSouth && !hasEast) corners.push({ dx: BUILDING_OFFSET, dz: BUILDING_OFFSET });
      if (!hasSouth && !hasWest) corners.push({ dx: -BUILDING_OFFSET, dz: BUILDING_OFFSET });

      for (const corner of corners) {
        const width = 3 + rand() * 2;
        const depth = 3 + rand() * 2;
        const height = 5 + rand() * 12;
        const color = BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)];

        const windows: { x: number; y: number; z: number; color: string }[] = [];
        const windowRows = Math.floor(height / 2.5);
        for (let row = 0; row < windowRows; row++) {
          if (rand() > 0.5) continue;
          const wy = -height / 2 + 1.5 + row * 2.5;
          const wColor = rand() > 0.4 ? WINDOW_COLOR : WINDOW_WARM_COLOR;
          windows.push({ x: width / 2 + 0.01, y: wy, z: 0, color: wColor });
          windows.push({ x: -width / 2 - 0.01, y: wy, z: 0, color: wColor });
        }

        allBuildings.push({
          id: `bld-corner-${idCounter++}`,
          x: inter.position.x + corner.dx,
          z: inter.position.z + corner.dz,
          width,
          depth,
          height,
          color,
          windows,
        });
      }
    }

    return allBuildings;
  }, [layout]);

  return (
    <group>
      {buildings.map((b) => (
        <Building key={b.id} data={b} />
      ))}
    </group>
  );
}
