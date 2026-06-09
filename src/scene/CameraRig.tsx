import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  target?: [number, number, number];
  distance?: number;
  autoRotate?: boolean;
}

export function CameraRig({
  target = [0, 0, 0],
  distance = 60,
  autoRotate = false,
}: CameraRigProps) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef({ theta: Math.PI / 4, phi: Math.PI / 4 });
  const targetPos = useRef(new THREE.Vector3(...target));
  const distanceRef = useRef(distance);

  useEffect(() => {
    const updateCamera = () => {
      const { theta, phi } = spherical.current;
      const r = distanceRef.current;
      const x = targetPos.current.x + r * Math.sin(phi) * Math.sin(theta);
      const y = targetPos.current.y + r * Math.cos(phi);
      const z = targetPos.current.z + r * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);
      camera.lookAt(targetPos.current);
    };

    updateCamera();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distanceRef.current = THREE.MathUtils.clamp(
        distanceRef.current + e.deltaY * 0.05,
        25,
        120
      );
      updateCamera();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - previousMouse.current.x;
      const dy = e.clientY - previousMouse.current.y;
      spherical.current.theta -= dx * 0.005;
      spherical.current.phi = THREE.MathUtils.clamp(
        spherical.current.phi - dy * 0.005,
        0.2,
        Math.PI / 2.1
      );
      previousMouse.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const canvas = gl.domElement;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    if (autoRotate && !isDragging.current) {
      spherical.current.theta += delta * 0.1;
      const { theta, phi } = spherical.current;
      const r = distanceRef.current;
      const x = targetPos.current.x + r * Math.sin(phi) * Math.sin(theta);
      const y = targetPos.current.y + r * Math.cos(phi);
      const z = targetPos.current.z + r * Math.sin(phi) * Math.cos(theta);
      camera.position.set(x, y, z);
      camera.lookAt(targetPos.current);
    }
  });

  return null;
}
