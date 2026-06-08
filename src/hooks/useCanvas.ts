import { useRef, useEffect, useCallback } from 'react';
import { canvasRenderer } from '@/engine/canvas/renderer';
import { LabObject, ReactionEffect } from '@/types/game';

interface UseCanvasOptions {
  width: number;
  height: number;
  labObjects: LabObject[];
  effects: ReactionEffect[];
  temperature: number;
  hoveredObject: string | null;
  selectedObject: string | null;
}

export function useCanvas(options: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    timeRef.current = performance.now();
    canvasRenderer.render({
      ctx,
      width: options.width,
      height: options.height,
      labObjects: options.labObjects,
      effects: options.effects,
      temperature: options.temperature,
      hoveredObject: options.hoveredObject,
      selectedObject: options.selectedObject,
      time: timeRef.current,
    });
  }, [options]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = options.width;
    canvas.height = options.height;
    canvasRenderer.init(canvas);

    const animate = () => {
      render();
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [options.width, options.height, render]);

  return canvasRef;
}
