import { useMemo } from 'react';
import * as THREE from 'three';

interface TrafficLightMeshProps {
  position: [number, number];
  direction: string;
  currentPhaseIdx: number;
  phases: { direction: string; greenDuration: number; cycleLength: number; busPriority: boolean }[];
}

export default function TrafficLightMesh({
  position,
  direction,
  currentPhaseIdx,
  phases,
}: TrafficLightMeshProps) {
  const isGreen = useMemo(() => {
    if (phases.length === 0) return true;
    const currentPhase = phases[currentPhaseIdx % phases.length];
    const isNS = direction === 'north' || direction === 'south';
    const phaseNS = currentPhase.direction === 'north' || currentPhase.direction === 'south';
    return isNS === phaseNS;
  }, [direction, currentPhaseIdx, phases]);

  const isYellow = useMemo(() => {
    if (phases.length === 0) return false;
    const currentPhase = phases[currentPhaseIdx % phases.length];
    return currentPhase.direction === direction;
  }, [direction, currentPhaseIdx, phases]);

  const color = isGreen ? '#2ecc71' : isYellow ? '#f1c40f' : '#e74c3c';
  const emissiveIntensity = isGreen || isYellow ? 1.5 : 0.3;

  const offset = useMemo(() => {
    const size = 2.8;
    switch (direction) {
      case 'north': return [0, 0, -size] as [number, number, number];
      case 'south': return [0, 0, size] as [number, number, number];
      case 'east': return [-size, 0, 0] as [number, number, number];
      case 'west': return [size, 0, 0] as [number, number, number];
      default: return [0, 0, 0] as [number, number, number];
    }
  }, [direction]);

  return (
    <group position={[position[0] + offset[0], 0, position[1] + offset[2]]}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2, 8]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[0.25, 0.6, 0.15]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.3, 0.08]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      {(isGreen || isYellow) && (
        <pointLight
          position={[0, 2.3, 0.3]}
          color={color}
          intensity={0.8}
          distance={5}
        />
      )}
    </group>
  );
}
