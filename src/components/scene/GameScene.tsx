import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { useUIStore } from '@/store/useUIStore';
import { trafficSim } from '@/engine/TrafficSim';
import RoadMesh from './RoadMesh';
import IntersectionMesh from './IntersectionMesh';
import VehicleMesh from './VehicleMesh';
import TrafficLightMesh from './TrafficLightMesh';
import BusMesh from './BusMesh';
import Environment from './Environment';

export default function GameScene() {
  const level = useGameStore((s) => s.level);
  const vehicles = useGameStore((s) => s.vehicles);
  const intersections = useGameStore((s) => s.intersections);
  const cameraMode = useUIStore((s) => s.cameraMode);
  const selectIntersection = useGameStore((s) => s.selectIntersection);

  const roadMeshes = useMemo(() => {
    if (!level) return [];
    const intersectionIds = new Set(level.intersections.map((i) => i.id));
    return level.roads.map((road) => {
      const fromPos = level.intersections.find((i) => i.id === road.from)?.position;
      const toPos = level.intersections.find((i) => i.id === road.to)?.position;
      if (!fromPos || !toPos) return null;
      return { id: road.id, from: fromPos, to: toPos, lanes: road.lanes, direction: road.direction };
    }).filter(Boolean);
  }, [level]);

  const vehicleMeshes = useMemo(() => {
    return vehicles.map((v) => {
      const pos = trafficSim.getRoadPosition(v.roadId);
      if (!pos) return null;
      const road = level?.roads.find((r) => r.id === v.roadId);
      if (!road) return null;
      return {
        ...v,
        roadPosition: pos,
        lanes: road.lanes,
      };
    }).filter(Boolean);
  }, [vehicles, level]);

  if (!level) return null;

  return (
    <Canvas
      camera={{
        position: cameraMode === 'topdown' ? [0, 25, 0.1] : [12, 12, 12],
        fov: 50,
        near: 0.1,
        far: 200,
      }}
      style={{ background: '#0a0a1a' }}
      onPointerMissed={() => selectIntersection(null)}
    >
      <Environment />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate={cameraMode === 'orbit'}
        maxPolarAngle={cameraMode === 'topdown' ? 0.01 : Math.PI / 3}
        minDistance={5}
        maxDistance={40}
        target={[0, 0, 0]}
      />

      {roadMeshes.map((road) =>
        road ? (
          <RoadMesh
            key={road.id}
            from={road.from}
            to={road.to}
            lanes={road.lanes}
          />
        ) : null,
      )}

      {level.intersections.map((ic) => (
        <IntersectionMesh
          key={ic.id}
          position={ic.position}
          type={ic.type}
        />
      ))}

      {intersections.map((is) =>
        is.phases.map((phase) => (
          <TrafficLightMesh
            key={`${is.id}-${phase.direction}`}
            position={
              level.intersections.find((ic) => ic.id === is.id)?.position ?? [0, 0]
            }
            direction={phase.direction}
            currentPhaseIdx={is.currentPhase}
            phases={is.phases}
          />
        )),
      )}

      {vehicleMeshes.map((v) =>
        v.isBus ? (
          <BusMesh
            key={v.id}
            position={v.roadPosition}
            progress={v.position}
            lane={v.lane}
            totalLanes={v.lanes}
            color={v.color}
          />
        ) : (
          <VehicleMesh
            key={v.id}
            position={v.roadPosition}
            progress={v.position}
            lane={v.lane}
            totalLanes={v.lanes}
            color={v.color}
            waiting={v.waiting}
          />
        ),
      )}
    </Canvas>
  );
}
