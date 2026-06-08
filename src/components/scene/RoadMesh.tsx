import { useMemo } from 'react';
import * as THREE from 'three';

interface RoadMeshProps {
  from: [number, number];
  to: [number, number];
  lanes: number;
}

export default function RoadMesh({ from, to, lanes }: RoadMeshProps) {
  const geometry = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.sqrt(dx * dx + dz * dz);
    const width = lanes * 1.2;

    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 128, 512);

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.setLineDash([16, 16]);
    for (let i = 1; i < lanes; i++) {
      const x = (i / lanes) * 128;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(127, 0);
    ctx.lineTo(127, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, length / 4);

    return { geo, texture };
  }, [from, to, lanes]);

  const position = useMemo(() => {
    const cx = (from[0] + to[0]) / 2;
    const cz = (from[1] + to[1]) / 2;
    return new THREE.Vector3(cx, 0.01, cz);
  }, [from, to]);

  const rotation = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const angle = Math.atan2(dx, dz);
    return new THREE.Euler(0, angle, 0);
  }, [from, to]);

  return (
    <mesh position={position} rotation={rotation} geometry={geometry.geo}>
      <meshStandardMaterial map={geometry.texture} roughness={0.8} />
    </mesh>
  );
}
