import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TrafficLightState } from '@/engine/types';

interface TrafficLight3DProps {
  intersectionId: string;
  position: { x: number; z: number };
  trafficLightState: TrafficLightState | null;
}

const RED_COLOR = '#ff3333';
const YELLOW_COLOR = '#ff8800';
const GREEN_COLOR = '#00ff88';
const HOUSING_COLOR = '#1a1a2e';
const POLE_COLOR = '#3a3a4a';
const LIGHT_RADIUS = 0.25;
const LIGHT_SPACING = 0.7;
const POLE_HEIGHT = 4;

function LightBulb({ color, active, positionY, pulseRef }: { color: string; active: boolean; positionY: number; pulseRef: React.RefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowIntensity = active ? 1.0 + Math.sin(pulseRef.current) * 0.2 : 0;

  return (
    <group position={[0, positionY, 0.2]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[LIGHT_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color={active ? color : '#111111'}
          emissive={active ? color : '#000000'}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      {active && (
        <pointLight
          color={color}
          intensity={2 + Math.sin(pulseRef.current) * 0.5}
          distance={8}
          decay={2}
        />
      )}
    </group>
  );
}

export default function TrafficLight3D({ intersectionId, position, trafficLightState }: TrafficLight3DProps) {
  const pulseRef = useRef(0);

  useFrame((_, delta) => {
    pulseRef.current += delta * 3;
  });

  const phase = trafficLightState?.phase ?? 'ns-green';
  const nsActive = phase === 'ns-green' || phase === 'ns-yellow';
  const ewActive = phase === 'ew-green' || phase === 'ew-yellow';

  const nsGreenActive = phase === 'ns-green';
  const nsYellowActive = phase === 'ns-yellow';
  const nsRedActive = phase === 'ew-green' || phase === 'ew-yellow';

  const ewGreenActive = phase === 'ew-green';
  const ewYellowActive = phase === 'ew-yellow';
  const ewRedActive = phase === 'ns-green' || phase === 'ns-yellow';

  return (
    <group position={[position.x, 0, position.z]}>
      <group position={[3.5, 0, 0]}>
        <mesh position={[0, POLE_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, POLE_HEIGHT, 8]} />
          <meshStandardMaterial color={POLE_COLOR} />
        </mesh>
        <mesh position={[0, POLE_HEIGHT + 0.6, 0]}>
          <boxGeometry args={[0.6, 2.2, 0.5]} />
          <meshStandardMaterial color={HOUSING_COLOR} />
        </mesh>
        <group position={[0, POLE_HEIGHT + 0.6, 0]}>
          <LightBulb color={RED_COLOR} active={nsRedActive} positionY={0.7} pulseRef={pulseRef} />
          <LightBulb color={YELLOW_COLOR} active={nsYellowActive} positionY={0} pulseRef={pulseRef} />
          <LightBulb color={GREEN_COLOR} active={nsGreenActive} positionY={-0.7} pulseRef={pulseRef} />
        </group>
      </group>

      <group position={[-3.5, 0, 0]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, POLE_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, POLE_HEIGHT, 8]} />
          <meshStandardMaterial color={POLE_COLOR} />
        </mesh>
        <mesh position={[0, POLE_HEIGHT + 0.6, 0]}>
          <boxGeometry args={[0.6, 2.2, 0.5]} />
          <meshStandardMaterial color={HOUSING_COLOR} />
        </mesh>
        <group position={[0, POLE_HEIGHT + 0.6, 0]}>
          <LightBulb color={RED_COLOR} active={ewRedActive} positionY={0.7} pulseRef={pulseRef} />
          <LightBulb color={YELLOW_COLOR} active={ewYellowActive} positionY={0} pulseRef={pulseRef} />
          <LightBulb color={GREEN_COLOR} active={ewGreenActive} positionY={-0.7} pulseRef={pulseRef} />
        </group>
      </group>
    </group>
  );
}
