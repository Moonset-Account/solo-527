import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Environment() {
  const groundRef = useRef<THREE.Mesh>(null);

  return (
    <>
      <ambientLight intensity={0.15} color="#4a5568" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={0.3}
        color="#b0c4de"
        castShadow
      />
      <fog attach="fog" args={['#0a0a1a', 15, 50]} />

      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>

      <StreetLights />
    </>
  );
}

function StreetLights() {
  const positions = [
    [-4, 0, -4], [-4, 0, 4], [4, 0, -4], [4, 0, 4],
    [-4, 0, 0], [4, 0, 0], [0, 0, -4], [0, 0, 4],
    [0, 0, -8], [0, 0, 8], [-8, 0, 0], [8, 0, 0],
  ];

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 3, 6]} />
            <meshStandardMaterial color="#555" roughness={0.6} />
          </mesh>
          <pointLight
            position={[0, 3.2, 0]}
            color="#ffd700"
            intensity={0.4}
            distance={8}
            decay={2}
          />
          <mesh position={[0, 3.1, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
