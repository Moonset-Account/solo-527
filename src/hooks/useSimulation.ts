import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { trafficSim } from '@/engine/TrafficSim';
import { calculateCongestion } from '@/engine/CongestionCalc';

export function useSimulation() {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const replayAccumRef = useRef<number>(0);

  const phase = useGameStore((s) => s.phase);
  const speed = useGameStore((s) => s.speed);
  const level = useGameStore((s) => s.level);
  const updateGameTime = useGameStore((s) => s.updateGameTime);
  const updateSimulation = useGameStore((s) => s.updateSimulation);
  const recordReplayFrame = useGameStore((s) => s.recordReplayFrame);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const congestionScore = useGameStore((s) => s.congestionScore);

  const loop = useCallback(
    (time: number) => {
      if (!level || phase !== 'playing') {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const realDt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const simDt = realDt * speed;
      trafficSim.update(simDt);

      const vehicles = trafficSim.getVehicles();
      const intersections = trafficSim.getIntersections();
      const roadCount = level.roads.length;
      const score = calculateCongestion(vehicles, roadCount);
      const throughput = trafficSim.getThroughput();
      const waitTime = trafficSim.getAvgWaitTime();

      updateSimulation(vehicles, intersections, score, throughput, waitTime);
      updateGameTime(simDt);

      replayAccumRef.current += realDt;
      if (replayAccumRef.current >= 0.5) {
        replayAccumRef.current = 0;
        recordReplayFrame({
          time: trafficSim.getGameTime(),
          vehicles: vehicles.map((v) => ({ ...v })),
          intersections: intersections.map((i) => ({ ...i, phases: i.phases.map((p) => ({ ...p })) })),
          congestionScore: score,
          throughput,
          avgWaitTime: waitTime,
        });
      }

      if (trafficSim.getGameTime() >= level.timeLimit && phase === 'playing') {
        useGameStore.getState().setPhase('paused');
      }

      frameRef.current = requestAnimationFrame(loop);
    },
    [level, phase, speed, updateGameTime, updateSimulation, recordReplayFrame, completeLevel],
  );

  useEffect(() => {
    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [loop]);
}
