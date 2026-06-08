import { useRef } from 'react';
import * as THREE from 'three';

interface BusMeshProps {
  position: { from: [number, number]; to: [number, number] };
  progress: number;
  lane: number;
  totalLanes: number;
  color: string;
  routeName?: string;
}

export default function BusMesh({
  position,
  progress,
  lane,
  totalLanes,
  color,
}: BusMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const worldPos = (() => {
    const { from, to } = position;
    const t = Math.min(1, Math.max(0, progress / 8));
    const x = from[0] + (to[0] - from[0]) * t;
    const z = from[1] + (to[1] - from[1]) * t;

    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const perpX = -dz / len;
    const perpZ = dx / len;
    const laneOffset = (lane - (totalLanes - 1) / 2) * 1.2;

    return [x + perpX * laneOffset, 0.35, z + perpZ * laneOffset] as [number, number, number];
  })();

  const rotation = (() => {
    const { from, to } = position;
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    return Math.atan2(dx, dz);
  })();

  return (
    <group position={worldPos} rotation={[0, rotation, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.6, 0.45, 1.4]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#ecf0f1" roughness={0.3} metalness={0.4} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0.5]}>
        <boxGeometry args={[0.55, 0.15, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0.8]}
        color="#ffffcc"
        intensity={0.5}
        distance={4}
      />
    </group>
  );
}
