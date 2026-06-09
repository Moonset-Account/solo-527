import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { TrafficLightState } from '@/types';
import * as THREE from 'three';

interface TrafficLightsProps {
  state: TrafficLightState | null;
}

type PoleConfig = {
  pos: [number, number, number];
  rotation?: number;
  direction: 'NS' | 'EW';
};

export function TrafficLights({ state }: TrafficLightsProps) {
  const nsColorRef = useRef<THREE.MeshStandardMaterial>(null);
  const ewColorRef = useRef<THREE.MeshStandardMaterial>(null);

  const poles: PoleConfig[] = useMemo(
    () => [
      { pos: [-11, 0, -11], rotation: Math.PI * 0.75, direction: 'NS' },
      { pos: [11, 0, 11], rotation: -Math.PI * 0.25, direction: 'NS' },
      { pos: [11, 0, -11], rotation: Math.PI * 0.25, direction: 'EW' },
      { pos: [-11, 0, 11], rotation: -Math.PI * 0.75, direction: 'EW' },
    ],
    []
  );

  useFrame(() => {
    if (!state) return;
    const nsIntensity = Math.max(0.15, state.nsIntensity);
    const ewIntensity = Math.max(0.15, state.ewIntensity);
    if (nsColorRef.current) {
      nsColorRef.current.emissiveIntensity = nsIntensity * 1.8;
    }
    if (ewColorRef.current) {
      ewColorRef.current.emissiveIntensity = ewIntensity * 1.8;
    }
  });

  const nsColor = state?.currentPhase?.includes('NS')
    ? state?.currentPhase === 'NS_GREEN'
      ? '#33ff55'
      : '#ffcc00'
    : '#ff3333';

  const ewColor = state?.currentPhase?.includes('EW')
    ? state?.currentPhase === 'EW_GREEN'
      ? '#33ff55'
      : '#ffcc00'
    : '#ff3333';

  return (
    <group>
      {poles.map((pole, idx) => {
        const isNS = pole.direction === 'NS';
        const lightColor = isNS ? nsColor : ewColor;
        const materialRef = isNS ? nsColorRef : ewColorRef;
        const intensity = isNS ? state?.nsIntensity ?? 0 : state?.ewIntensity ?? 0;

        return (
          <group
            key={`pole_${idx}`}
            position={pole.pos}
            rotation={[0, pole.rotation || 0, 0]}
          >
            <mesh position={[0, 3.5, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 7, 8]} />
              <meshStandardMaterial color="#2a2f3a" metalness={0.8} roughness={0.3} />
            </mesh>

            <mesh position={[1.5, 6, 0]} castShadow>
              <boxGeometry args={[3, 0.15, 0.15]} />
              <meshStandardMaterial color="#2a2f3a" metalness={0.8} roughness={0.3} />
            </mesh>

            <group position={[3, 6, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.6, 2, 0.6]} />
                <meshStandardMaterial color="#1a1f2a" metalness={0.6} roughness={0.5} />
              </mesh>

              <mesh position={[0, 0.6, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
                <meshStandardMaterial
                  ref={materialRef}
                  color={lightColor}
                  emissive={lightColor}
                  emissiveIntensity={intensity * 2}
                  transparent
                  opacity={0.95}
                />
              </mesh>

              <mesh position={[0, 0, 0.31]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
                <meshStandardMaterial
                  color={isNS
                    ? state?.currentPhase === 'NS_YELLOW'
                      ? '#ffcc00'
                      : '#665500'
                    : state?.currentPhase === 'EW_YELLOW'
                      ? '#ffcc00'
                      : '#665500'}
                  emissive={isNS
                    ? state?.currentPhase === 'NS_YELLOW'
                      ? '#ffcc00'
                      : '#000000'
                    : state?.currentPhase === 'EW_YELLOW'
                      ? '#ffcc00'
                      : '#000000'}
                  emissiveIntensity={isNS
                    ? state?.currentPhase === 'NS_YELLOW'
                      ? 2
                      : 0
                    : state?.currentPhase === 'EW_YELLOW'
                      ? 2
                      : 0}
                  transparent
                  opacity={0.9}
                />
              </mesh>

              <mesh position={[0, -0.6, 0.31]}>
                <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
                <meshStandardMaterial
                  color={isNS
                    ? state?.currentPhase?.startsWith('NS')
                      ? '#334433'
                      : '#33ff55'
                    : state?.currentPhase?.startsWith('EW')
                      ? '#334433'
                      : '#33ff55'}
                  emissive={isNS
                    ? state?.currentPhase?.startsWith('NS')
                      ? '#000000'
                      : '#33ff55'
                    : state?.currentPhase?.startsWith('EW')
                      ? '#000000'
                      : '#33ff55'}
                  emissiveIntensity={isNS
                    ? state?.currentPhase?.startsWith('NS')
                      ? 0
                      : 2
                    : state?.currentPhase?.startsWith('EW')
                      ? 0
                      : 2}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            </group>

            <pointLight
              position={[3, 6, 1]}
              color={lightColor}
              intensity={intensity * 0.8}
              distance={12}
              decay={2}
            />
          </group>
        );
      })}
    </group>
  );
}
