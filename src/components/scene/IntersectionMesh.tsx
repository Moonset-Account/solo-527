import { useMemo } from 'react';
import * as THREE from 'three';

interface IntersectionMeshProps {
  position: [number, number];
  type: string;
}

export default function IntersectionMesh({ position, type }: IntersectionMeshProps) {
  const size = useMemo(() => {
    switch (type) {
      case 't-junction': return 5;
      case 'complex': return 6;
      default: return 4.8;
    }
  }, [type]);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 64);
    ctx.lineTo(128, 64);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <mesh
      position={[position[0], 0.02, position[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} roughness={0.7} />
    </mesh>
  );
}
