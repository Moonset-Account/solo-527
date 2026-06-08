import { useRef, useCallback, useEffect } from 'react';
import { Simulation } from '@/engine/Simulation';
import { useSimulationStore } from '@/store/simulationStore';
import type { LevelConfig, TrafficLightConfig } from '@/engine/types';

export function useSimulation(levelConfig: LevelConfig) {
  const simRef = useRef<Simulation | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const {
    animationState,
    speed,
    setSimulationTime,
    updateTrafficLightStates,
    setCurrentScore,
    initTrafficLightConfigs,
  } = useSimulationStore();

  if (!simRef.current) {
    simRef.current = new Simulation(levelConfig);
    initTrafficLightConfigs(
      levelConfig.initialTrafficLightConfigs,
    );
  }

  const tick = useCallback((timestamp: number) => {
    const sim = simRef.current;
    if (!sim) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    const dt = Math.min(rawDt, 0.1);
    lastTimeRef.current = timestamp;

    if (sim.isRunning) {
      const state = sim.update(dt);
      setSimulationTime(state.time);
      updateTrafficLightStates(state.trafficLightStates);
      setCurrentScore(state.score);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [setSimulationTime, updateTrafficLightStates, setCurrentScore]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;

    if (animationState === 'playing') {
      sim.setRunning(true);
      sim.setSpeed(1);
    } else if (animationState === 'fastForward') {
      sim.setRunning(true);
      sim.setSpeed(4);
    } else if (animationState === 'paused') {
      sim.setRunning(false);
    } else if (animationState === 'replaying') {
      sim.setRunning(true);
      sim.setSpeed(2);
    } else {
      sim.setRunning(false);
    }
  }, [animationState]);

  const updateConfig = useCallback((intersectionId: string, patch: Partial<TrafficLightConfig>) => {
    simRef.current?.updateTrafficLightConfig(intersectionId, patch);
    useSimulationStore.getState().updateTrafficLightConfig(intersectionId, patch);
  }, []);

  const reset = useCallback(() => {
    simRef.current?.reset();
    lastTimeRef.current = 0;
  }, []);

  const getSim = useCallback(() => simRef.current, []);

  return {
    getSim,
    updateConfig,
    reset,
  };
}
