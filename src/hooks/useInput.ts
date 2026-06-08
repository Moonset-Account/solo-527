import { useEffect, useCallback } from 'react';
import { inputManager } from '@/engine/input/manager';
import { InputMode } from '@/types/game';
import { InputAction } from '@/engine/input/manager';
import { eventEmitter } from '@/engine/events/emitter';

export function useInput(mode: InputMode, canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    inputManager.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) inputManager.init(canvas);
  }, [canvasRef]);

  const onAction = useCallback((handler: (action: InputAction) => void) => {
    return eventEmitter.on('input:action', handler as (...args: unknown[]) => void);
  }, []);

  const onClick = useCallback((handler: (pos: { x: number; y: number }) => void) => {
    return eventEmitter.on('input:click', handler as (...args: unknown[]) => void);
  }, []);

  const getHint = useCallback((action: string) => {
    return inputManager.getKeyHint(action);
  }, []);

  return { onAction, onClick, getHint };
}
