import { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { LabObject, ReactionEffect } from '@/types/game';
import { canvasRenderer } from '@/engine/canvas/renderer';

interface LabCanvasProps {
  onObjectClick?: (obj: LabObject) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

export default function LabCanvas({ onObjectClick, onCanvasClick }: LabCanvasProps) {
  const labObjects = useGameStore(s => s.labObjects);
  const effects = useGameStore(s => s.effects);
  const temperature = useGameStore(s => s.temperature);
  const [hoveredObj, setHoveredObj] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        setCanvasSize({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    canvasRenderer.init(canvas);
  }, [canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frameId: number;
    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvasRenderer.render({
          ctx,
          width: canvasSize.width,
          height: canvasSize.height,
          labObjects,
          effects,
          temperature,
          hoveredObject: hoveredObj,
          selectedObject: null,
          time: performance.now(),
        });
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [canvasSize, labObjects, effects, temperature, hoveredObj]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const clicked = labObjects.find(obj =>
      x >= obj.x - obj.width / 2 && x <= obj.x + obj.width / 2 &&
      y >= obj.y - obj.height / 2 && y <= obj.y + obj.height / 2
    );
    if (clicked) {
      onObjectClick?.(clicked);
    } else {
      onCanvasClick?.(x, y);
    }
  }, [labObjects, onObjectClick, onCanvasClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const hovered = labObjects.find(obj =>
      x >= obj.x - obj.width / 2 && x <= obj.x + obj.width / 2 &&
      y >= obj.y - obj.height / 2 && y <= obj.y + obj.height / 2
    );
    setHoveredObj(hovered?.id || null);
  }, [labObjects]);

  return (
    <div ref={containerRef} className="w-full h-full relative rounded-xl overflow-hidden border border-[#1a5a5a] shadow-[0_0_30px_rgba(13,79,79,0.5)]">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-pointer"
      />
    </div>
  );
}
