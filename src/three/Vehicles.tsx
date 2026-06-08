import { useMemo } from 'react';
import * as THREE from 'three';
import type { Vehicle, Direction } from '@/engine/types';

interface VehiclesProps {
  vehicles: Vehicle[];
}

const CAR_COLORS = ['#00ddff', '#ff4488', '#aa44ff', '#44ffaa', '#ffaa00', '#ff6644'];
const BUS_COLOR = '#ffd700';

const DIRECTION_ROTATION: Record<Direction, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: -Math.PI / 2,
};

function Car({ vehicle, colorIndex }: { vehicle: Vehicle; colorIndex: number }) {
  const rotation = DIRECTION_ROTATION[vehicle.direction];
  const color = CAR_COLORS[colorIndex % CAR_COLORS.length];

  return (
    <group position={[vehicle.position.x, 0.5, vehicle.position.z]} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, -0.3]}>
        <boxGeometry args={[1.6, 0.6, 2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.4, -0.3]}>
        <boxGeometry args={[1.5, 0.55, 1.8]} />
        <meshStandardMaterial color="#1a2a4a" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Bus({ vehicle }: { vehicle: Vehicle }) {
  const rotation = DIRECTION_ROTATION[vehicle.direction];

  return (
    <group position={[vehicle.position.x, 0.75, vehicle.position.z]} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.5, 10]} />
        <meshStandardMaterial color={BUS_COLOR} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.4, 0.8, 9.6]} />
        <meshStandardMaterial color="#334455" metalness={0.8} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, -0.6, 4.8]}>
        <boxGeometry args={[2.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function Vehicles({ vehicles }: VehiclesProps) {
  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const v of vehicles) {
      if (!map.has(v.id)) {
        map.set(v.id, idx);
        idx++;
      }
    }
    return map;
  }, [vehicles]);

  return (
    <group>
      {vehicles.map((vehicle) =>
        vehicle.type === 'bus' ? (
          <Bus key={vehicle.id} vehicle={vehicle} />
        ) : (
          <Car key={vehicle.id} vehicle={vehicle} colorIndex={colorMap.get(vehicle.id) ?? 0} />
        )
      )}
    </group>
  );
}
