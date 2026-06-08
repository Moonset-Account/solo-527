import { useRef } from 'react';
import * as THREE from 'three';

interface VehicleMeshProps {
  position: { from: [number, number]; to: [number, number] };
  progress: number;
  lane: number;
  totalLanes: number;
  color: string;
  waiting: boolean;
}

export default function VehicleMesh({
  position,
  progress,
  lane,
  totalLanes,
  color,
  waiting,
}: VehicleMeshProps) {
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

    return [x + perpX * laneOffset, 0.25, z + perpZ * laneOffset] as [number, number, number];
  })();

  const rotation = (() => {
    const { from, to } = position;
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    return Math.atan2(dx, dz);
  })();

  const brakeColor = waiting ? '#e74c3c' : undefined;

  return (
    <group position={worldPos} rotation={[0, rotation, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.5, 0.3, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, -0.35]}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
        <meshStandardMaterial color="#bdc3c7" roughness={0.3} metalness={0.5} />
      </mesh>
      <pointLight
        position={[0, 0, 0.5]}
        color="#ffffcc"
        intensity={0.3}
        distance={3}
      />
      {waiting && (
        <mesh position={[0.2, 0.1, -0.4]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color={brakeColor}
            emissive={brakeColor}
            emissiveIntensity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}
