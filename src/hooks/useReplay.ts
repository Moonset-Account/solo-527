import { useCallback } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import type { TrafficLightConfig, ScoreResult, ReplaySnapshot } from '@/engine/types';

export function useReplay() {
  const { snapshots, addSnapshot, clearSnapshots } = useSimulationStore();

  const captureSnapshot = useCallback(
    (config: TrafficLightConfig[], score: ScoreResult, simulationTime: number = 0) => {
      const snapshot: ReplaySnapshot = {
        timestamp: Date.now(),
        trafficLightConfig: config.map(c => ({ ...c })),
        scoreSnapshot: { ...score },
        simulationTime,
      };
      addSnapshot(snapshot);
    },
    [addSnapshot],
  );

  const getLatestSnapshot = useCallback((): ReplaySnapshot | null => {
    if (snapshots.length === 0) return null;
    return snapshots[snapshots.length - 1];
  }, [snapshots]);

  const getPreviousSnapshot = useCallback((): ReplaySnapshot | null => {
    if (snapshots.length < 2) return null;
    return snapshots[snapshots.length - 2];
  }, [snapshots]);

  const compareWithLatest = useCallback(
    (currentScore: ScoreResult): {
      congestionDelta: number;
      throughputDelta: number;
      improved: boolean;
    } | null => {
      const latest = getLatestSnapshot();
      if (!latest) return null;
      return {
        congestionDelta: latest.scoreSnapshot.congestionScore - currentScore.congestionScore,
        throughputDelta: currentScore.throughput - latest.scoreSnapshot.throughput,
        improved: currentScore.congestionScore < latest.scoreSnapshot.congestionScore,
      };
    },
    [getLatestSnapshot],
  );

  const clearHistory = useCallback(() => {
    clearSnapshots();
  }, [clearSnapshots]);

  return {
    snapshots,
    captureSnapshot,
    getLatestSnapshot,
    getPreviousSnapshot,
    compareWithLatest,
    clearHistory,
  };
}
