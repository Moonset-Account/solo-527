import { useRef, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import RoadNetwork from './RoadNetwork';
import TrafficLight3D from './TrafficLight3D';
import Vehicles from './Vehicles';
import Buildings from './Buildings';
import { RoadGraph } from '@/engine/RoadGraph';
import type { RoadLayout, Vehicle, TrafficLightState } from '@/engine/types';
import { useSimulationStore } from '@/store/simulationStore';

interface GameSceneProps {
  layout: RoadLayout;
  vehicles: Vehicle[];
  trafficLightStates: TrafficLightState[];
  onIntersectionClick?: (id: string) => void;
}

function SceneContent({ layout, vehicles, trafficLightStates, onIntersectionClick }: GameSceneProps) {
  const graph = useMemo(() => RoadGraph.fromLayout(layout), [layout]);
  const selectedIntersection = useSimulationStore(s => s.selectedIntersection);

  const handleIntersectionClick = useCallback((id: string) => {
    onIntersectionClick?.(id);
  }, [onIntersectionClick]);

  const intersections = useMemo(() => {
    return Array.from(graph.intersections.values());
  }, [graph]);

  const centerPos = useMemo(() => {
    const positions = intersections.map(i => i.position);
    if (positions.length === 0) return { x: 0, z: 0 };
    const avgX = positions.reduce((s, p) => s + p.x, 0) / positions.length;
    const avgZ = positions.reduce((s, p) => s + p.z, 0) / positions.length;
    return { x: avgX, z: avgZ };
  }, [intersections]);

  return (
    <>
      <ambientLight intensity={0.15} color="#4466aa" />
      <directionalLight position={[50, 80, 30]} intensity={0.2} color="#aabbff" />

      <RoadNetwork layout={layout} />

      {intersections.map(intersection => {
        const state = trafficLightStates.find(s => s.intersectionId === intersection.id);
        return (
          <group
            key={intersection.id}
            position={[intersection.position.x, 0, intersection.position.z]}
            onClick={(e) => {
              e.stopPropagation();
              handleIntersectionClick(intersection.id);
            }}
          >
            <TrafficLight3D
              intersectionId={intersection.id}
              position={{ x: 0, z: 0 }}
              trafficLightState={state ?? null}
            />
            {selectedIntersection === intersection.id && (
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[6, 7, 4]} />
                <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
              </mesh>
            )}
          </group>
        );
      })}

      <Vehicles vehicles={vehicles} />
      <Buildings layout={layout} />

      <OrbitControls
        target={[centerPos.x, 0, centerPos.z]}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        minDistance={20}
        maxDistance={200}
        enablePan={true}
        enableDamping={true}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.8} />
      </EffectComposer>
    </>
  );
}

export default function GameScene(props: GameSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 80, 60], fov: 45, near: 0.1, far: 1000 }}
      style={{ background: '#0a0e1a' }}
      gl={{ antialias: true, alpha: false }}
    >
      <fog attach="fog" args={['#0a0e1a', 100, 250]} />
      <SceneContent {...props} />
    </Canvas>
  );
}
