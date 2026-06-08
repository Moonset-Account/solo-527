import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { ReplayFrame } from '@/types';

export function useReplay() {
  const replayFrames = useGameStore((s) => s.replayFrames);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const frameCount = replayFrames.length;
  const hasFrames = frameCount > 0;

  const current = hasFrames ? replayFrames[Math.min(currentFrame, frameCount - 1)] : null;

  const goTo = useCallback(
    (index: number) => {
      setCurrentFrame(Math.max(0, Math.min(index, frameCount - 1)));
    },
    [frameCount],
  );

  const goNext = useCallback(() => {
    setCurrentFrame((prev) => Math.min(prev + 1, frameCount - 1));
  }, [frameCount]);

  const goPrev = useCallback(() => {
    setCurrentFrame((prev) => Math.max(prev - 1, 0));
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => {
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  return {
    frames: replayFrames,
    currentFrame,
    current,
    frameCount,
    hasFrames,
    isPlaying,
    goTo,
    goNext,
    goPrev,
    play,
    pause,
    reset,
  };
}
