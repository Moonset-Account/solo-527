import { useMemo } from 'react';
import { RoadGraph } from '@/engine/RoadGraph';
import type { RoadLayout } from '@/engine/types';

const ROAD_WIDTH = 6;
const ROAD_COLOR = '#2a2d3a';
const MARKING_COLOR = '#ffffff';
const DASH_LENGTH = 2;
const DASH_GAP = 2;

interface RoadNetworkProps {
  layout: RoadLayout;
}

function RoadSegment({ from, to, direction }: { from: { x: number; z: number }; to: { x: number; z: number }; direction: string }) {
  const isHorizontal = direction === 'east' || direction === 'west';
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const cx = (from.x + to.x) / 2;
  const cz = (from.z + to.z) / 2;
  const rotation = isHorizontal ? Math.PI / 2 : 0;

  const dashes = useMemo(() => {
    const result: { offset: number }[] = [];
    const total = length;
    let pos = DASH_LENGTH / 2;
    while (pos < total) {
      result.push({ offset: pos - total / 2 });
      pos += DASH_LENGTH + DASH_GAP;
    }
    return result;
  }, [length]);

  return (
    <group position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, rotation]}>
      <mesh>
        <planeGeometry args={[length, ROAD_WIDTH]} />
        <meshStandardMaterial color={ROAD_COLOR} />
      </mesh>
      {dashes.map((dash, i) => (
        <mesh key={i} position={[dash.offset, 0, 0]}>
          <planeGeometry args={[DASH_LENGTH, 0.1]} />
          <meshStandardMaterial color={MARKING_COLOR} emissive={MARKING_COLOR} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function IntersectionArea({ position }: { position: { x: number; z: number } }) {
  return (
    <mesh position={[position.x, 0.02, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[ROAD_WIDTH, ROAD_WIDTH]} />
      <meshStandardMaterial color={ROAD_COLOR} />
    </mesh>
  );
}

export default function RoadNetwork({ layout }: RoadNetworkProps) {
  const graph = useMemo(() => RoadGraph.fromLayout(layout), [layout]);

  const segments = useMemo(() => {
    const result: { id: string; from: { x: number; z: number }; to: { x: number; z: number }; direction: string }[] = [];
    for (const seg of graph.segments.values()) {
      const fromInter = graph.intersections.get(seg.from);
      const toInter = graph.intersections.get(seg.to);
      if (fromInter && toInter) {
        result.push({
          id: seg.id,
          from: fromInter.position,
          to: toInter.position,
          direction: seg.direction,
        });
      }
    }
    return result;
  }, [graph]);

  const intersections = useMemo(() => {
    return Array.from(graph.intersections.values());
  }, [graph]);

  return (
    <group>
      {segments.map((seg) => (
        <RoadSegment key={seg.id} from={seg.from} to={seg.to} direction={seg.direction} />
      ))}
      {intersections.map((inter) => (
        <IntersectionArea key={inter.id} position={inter.position} />
      ))}
    </group>
  );
}
