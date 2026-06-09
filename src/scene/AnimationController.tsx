import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VehicleModel } from './vehicles/VehicleModels';
import type { SimulationFrame, TrafficLightState, Vehicle } from '@/types';

interface AnimationControllerProps {
  vehicles: Vehicle[];
  lightState: TrafficLightState | null;
  compareFrame?: SimulationFrame | null;
}

export function AnimationController({
  vehicles,
  compareFrame,
}: AnimationControllerProps) {
  const meshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const positions = useRef<Map<string, { pos: THREE.Vector3; rot: number }>>(new Map());

  useEffect(() => {
    positions.current.clear();
    for (const v of vehicles) {
      positions.current.set(v.id, {
        pos: new THREE.Vector3(v.position.x, 0, v.position.z),
        rot: v.rotation,
      });
    }
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    for (const v of vehicles) {
      const prev = positions.current.get(v.id);
      const targetPos = new THREE.Vector3(v.position.x, 0, v.position.z);
      const targetRot = v.rotation;

      if (!prev) {
        positions.current.set(v.id, { pos: targetPos.clone(), rot: targetRot });
        continue;
      }

      prev.pos.lerp(targetPos, Math.min(1, dt * 12));
      let diff = targetRot - prev.rot;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      prev.rot += diff * Math.min(1, dt * 10);

      const mesh = meshesRef.current.get(v.id);
      if (mesh) {
        mesh.position.copy(prev.pos);
        mesh.rotation.y = prev.rot;
      }
    }

    const currentIds = new Set(vehicles.map((v) => v.id));
    for (const id of Array.from(positions.current.keys())) {
      if (!currentIds.has(id)) {
        positions.current.delete(id);
      }
    }
  });

  const vehicleList = useMemo(() => {
    return vehicles.map((v) => ({
      id: v.id,
      type: v.type,
      color: v.color,
      waiting: v.waitingTime > 3,
    }));
  }, [vehicles.map((v) => v.id).join(',')]);

  const compareVehicles = useMemo(() => {
    if (!compareFrame) return [];
    return compareFrame.vehicles.map((v) => ({
      ...v,
      id: `cmp_${v.id}`,
    }));
  }, [compareFrame]);

  return (
    <group>
      {vehicleList.map((v) => (
        <group
          key={v.id}
          ref={(el) => {
            if (el) meshesRef.current.set(v.id, el);
          }}
        >
          <VehicleModel type={v.type} color={v.color} waiting={v.waiting} />
        </group>
      ))}

      {compareFrame && (
        <group position={[0, 0.15, 0]}>
          {compareVehicles.map((v) => (
            <group
              key={v.id}
              position={[v.position.x, 0, v.position.z]}
              rotation={[0, v.rotation, 0]}
            >
              <group>
                <mesh position={[0, 0.7, 0]}>
                  <boxGeometry args={[2, 0.98, 4.5]} />
                  <meshStandardMaterial
                    color={v.color}
                    emissive={v.color}
                    emissiveIntensity={0.1}
                    transparent
                    opacity={0.5}
                    wireframe
                  />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}
