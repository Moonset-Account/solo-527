import { useMemo } from 'react';
import * as THREE from 'three';
import type { VehicleType } from '@/types';

interface VehicleModelProps {
  type: VehicleType;
  color: string;
  waiting?: boolean;
}

export function VehicleModel({ type, color, waiting = false }: VehicleModelProps) {
  const dims = useMemo(() => {
    switch (type) {
      case 'bus':
        return { w: 2.5, l: 10, h: 2.8, wheelY: 0.7 };
      case 'taxi':
      case 'car':
      default:
        return { w: 2, l: 4.5, h: 1.4, wheelY: 0.4 };
    }
  }, [type]);

  const wheelPositions = useMemo(() => {
    const hw = dims.w * 0.45;
    const hl = dims.l * 0.38;
    return [
      [-hw, dims.wheelY, -hl],
      [hw, dims.wheelY, -hl],
      [-hw, dims.wheelY, hl],
      [hw, dims.wheelY, hl],
    ] as [number, number, number][];
  }, [dims]);

  return (
    <group>
      <mesh position={[0, dims.h * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[dims.w, dims.h * 0.7, dims.l]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.2}
          emissive={waiting ? '#ff6b6b' : color}
          emissiveIntensity={waiting ? 0.3 : 0}
        />
      </mesh>

      <mesh position={[0, dims.h * 0.85, -dims.l * 0.1]} castShadow>
        <boxGeometry
          args={[dims.w * 0.85, dims.h * 0.45, dims.l * (type === 'bus' ? 0.75 : 0.55)]}
        />
        <meshStandardMaterial
          color={type === 'bus' ? '#2a3a4a' : '#405060'}
          roughness={0.3}
          metalness={0.5}
          emissive="#aaccff"
          emissiveIntensity={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {wheelPositions.map((p, i) => (
        <mesh key={`wheel_${i}`} position={p} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>
      ))}

      <mesh
        position={[0, dims.h * 0.6, dims.l * 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial
          color={type === 'bus' ? '#4ecdc4' : '#ffffaa'}
          emissive={type === 'bus' ? '#4ecdc4' : '#ffffaa'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {type === 'taxi' && (
        <mesh position={[0, dims.h * 1.15, 0]} castShadow>
          <boxGeometry args={[0.6, 0.25, 1.6]} />
          <meshStandardMaterial
            color="#ffe066"
            emissive="#ffe066"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {type === 'bus' && (
        <>
          <mesh
            position={[-dims.w * 0.4, dims.h * 0.55, dims.l * 0.35]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial
              color="#4ecdc4"
              emissive="#4ecdc4"
              emissiveIntensity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            position={[dims.w * 0.4, dims.h * 0.55, dims.l * 0.35]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial
              color="#4ecdc4"
              emissive="#4ecdc4"
              emissiveIntensity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
