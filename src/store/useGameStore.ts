import { create } from 'zustand';
import type {
  Direction,
  GameState,
  GameStatus,
  LevelConfig,
  MetricsSnapshot,
  PhaseConfig,
  ScoreResult,
  SimulationFrame,
} from '@/types';
import { TrafficSimulator } from '@/game/TrafficSimulator';
import { saveManager } from '@/game/SaveManager';
import { getLevelById, LEVELS } from '@/data/levels/levels';
import { eventBus } from '@/game/EventBus';

interface GameStoreState extends GameState {
  simulator: TrafficSimulator | null;
  currentLevel: LevelConfig | null;
  currentMetrics: MetricsSnapshot;
  scoreResult: ScoreResult | null;
  compareReplayFrames: SimulationFrame[] | null;
  compareConfig: PhaseConfig | null;
  unlockedLevels: string[];
  initSimulator: (levelId: string) => void;
  destroySimulator: () => void;
  setStatus: (status: GameStatus) => void;
  setPhaseConfig: (config: Partial<PhaseConfig>) => void;
  applyPhaseConfig: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setSpeedScale: (scale: number) => void;
  tick: (delta: number) => void;
  endGame: () => void;
  retry: () => void;
  setTutorialStep: (step: number) => void;
  skipTutorial: () => void;
  loadComparisonReplay: (replayId: string) => void;
  clearComparison: () => void;
  refreshUnlockedLevels: () => void;
  tickPlayTime: (delta: number) => void;
  setSpawnRate: (rate: number) => void;
  setDirectionBias: (bias: Record<Direction, number>) => void;
  setBusRate: (rate: number) => void;
  setTaxiRate: (rate: number) => void;
}

const emptyMetrics: MetricsSnapshot = {
  timestamp: 0,
  congestionIndex: 0,
  avgWaitingTime: 0,
  avgSpeed: 0,
  busOnTimeRate: 85,
  throughput: 0,
  queueLengths: {},
  vehicleCount: 0,
  busCount: 0,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  status: 'idle',
  currentLevelId: null,
  phaseConfig: {
    nsGreen: 20,
    ewGreen: 20,
    yellow: 3,
    allRed: 2,
    busPriority: false,
    busThreshold: 3,
  },
  timeElapsed: 0,
  speedScale: 1,
  attemptCount: 0,
  tutorialStep: 0,
  failureReason: null,

  simulator: null,
  currentLevel: null,
  currentMetrics: emptyMetrics,
  scoreResult: null,
  compareReplayFrames: null,
  compareConfig: null,
  unlockedLevels: [],

  initSimulator: (levelId: string) => {
    const level = getLevelById(levelId);
    if (!level) return;

    const simulator = new TrafficSimulator(level);

    set({
      simulator,
      currentLevel: level,
      currentLevelId: levelId,
      phaseConfig: { ...level.initialPhaseConfig },
      timeElapsed: 0,
      status: saveManager.isTutorialCompleted() ? 'playing' : 'tutorial',
      tutorialStep: 0,
      attemptCount: 1,
      failureReason: null,
      currentMetrics: emptyMetrics,
      scoreResult: null,
    });

    saveManager.setCurrentLevel(levelId);
    eventBus.emit('game:start', { levelId });
  },

  destroySimulator: () => {
    set({
      simulator: null,
      currentLevel: null,
      currentLevelId: null,
      status: 'idle',
      timeElapsed: 0,
      attemptCount: 0,
      scoreResult: null,
    });
  },

  setStatus: (status) => set({ status }),

  setPhaseConfig: (config) => {
    set((s) => ({
      phaseConfig: { ...s.phaseConfig, ...config },
    }));
    eventBus.emit('timing:change', { config: { ...get().phaseConfig } });
  },

  applyPhaseConfig: () => {
    const { simulator, phaseConfig, status } = get();
    if (!simulator) return;

    simulator.applyPhaseConfig(phaseConfig);
    if (status !== 'simulating' && status !== 'replaying') {
      simulator.start();
      set({ status: 'simulating' });
    }
    eventBus.emit('timing:apply', { config: phaseConfig });
  },

  startSimulation: () => {
    const { simulator } = get();
    simulator?.start();
    set((s) => ({ status: s.status === 'paused' ? 'simulating' : s.status }));
    eventBus.emit('game:resume');
  },

  pauseSimulation: () => {
    const { simulator, status } = get();
    if (status === 'simulating') {
      simulator?.pause();
      set({ status: 'paused' });
      eventBus.emit('game:pause');
    }
  },

  resetSimulation: () => {
    const { simulator, currentLevel, attemptCount } = get();
    if (!simulator || !currentLevel) return;

    simulator.reset();
    simulator.applyPhaseConfig(get().phaseConfig);
    set({
      timeElapsed: 0,
      status: 'playing',
      currentMetrics: emptyMetrics,
      scoreResult: null,
      failureReason: null,
      attemptCount: attemptCount + 1,
    });
    eventBus.emit('game:reset');
  },

  setSpeedScale: (scale) => {
    get().simulator?.setSpeedScale(scale);
    set({ speedScale: scale });
  },

  tick: (delta) => {
    const { simulator, status, timeElapsed, currentLevel } = get();
    if (!simulator || status === 'success' || status === 'failed') return;

    const metrics = simulator.update(delta);
    const newTimeElapsed = simulator.getTimeElapsed();

    set({
      currentMetrics: metrics,
      timeElapsed: newTimeElapsed,
    });

    if (currentLevel && newTimeElapsed >= currentLevel.duration && status === 'simulating') {
      get().endGame();
    }

    if (metrics.congestionIndex > 95 && newTimeElapsed > 15 && status === 'simulating') {
      set({ failureReason: '拥堵指数过高，路网近乎瘫痪！请尝试调整配时。' });
    }
  },

  endGame: () => {
    const { simulator, currentLevel, currentLevelId, currentMetrics, phaseConfig, attemptCount } =
      get();
    if (!simulator || !currentLevel || !currentLevelId) return;

    simulator.pause();
    const result: ScoreResult = simulator.calculateFinalScore();

    const finalMetrics = simulator.getMetrics();
    const levelRecord = saveManager.recordLevelAttempt(
      currentLevelId,
      result.passed,
      result.total,
      finalMetrics,
      result.failureReason || undefined
    );

    const frames = simulator.getFrames();
    if (result.passed && frames.length > 0) {
      saveManager.saveReplay({
        levelId: currentLevelId,
        timingConfig: phaseConfig,
        frames,
        finalMetrics,
        duration: currentLevel.duration,
      });
    }

    set({
      status: result.passed ? 'success' : 'failed',
      scoreResult: result,
      failureReason: result.failureReason,
    });

    eventBus.emit('game:end', {
      success: result.passed,
      score: result.total,
      metrics: finalMetrics,
    });

    if (!result.passed) {
      eventBus.emit('level:fail', {
        levelId: currentLevelId,
        reason: result.failureReason || '未达成目标',
        attempt: attemptCount,
      });
    }

    get().refreshUnlockedLevels();
  },

  retry: () => {
    get().resetSimulation();
    set({ attemptCount: get().attemptCount });
  },

  setTutorialStep: (step) => {
    set({ tutorialStep: step });
    eventBus.emit('tutorial:step', { stepId: step, skipped: false });
  },

  skipTutorial: () => {
    saveManager.recordTutorial(true);
    set({ status: 'playing', tutorialStep: -1 });
    eventBus.emit('tutorial:skip');
  },

  loadComparisonReplay: (replayId) => {
    const replay = saveManager.getReplayById(replayId);
    if (!replay) return;
    set({
      compareReplayFrames: replay.frames,
      compareConfig: replay.timingConfig,
    });
    eventBus.emit('replay:compare', { enabled: true, replayId });
  },

  clearComparison: () => {
    set({ compareReplayFrames: null, compareConfig: null });
    eventBus.emit('replay:compare', { enabled: false });
  },

  refreshUnlockedLevels: () => {
    const unlocked = LEVELS.filter(
      (l) => saveManager.isLevelUnlocked(l.id, l.unlockRequirement) || l.id === 'level_1'
    ).map((l) => l.id);
    set({ unlockedLevels: unlocked });
  },

  tickPlayTime: (delta) => {
    saveManager.addPlayTime(delta);
  },

  setSpawnRate: (rate) => {
    get().simulator?.setSpawnRate(rate);
  },

  setDirectionBias: (bias) => {
    get().simulator?.setDirectionBias(bias);
  },

  setBusRate: (rate) => {
    get().simulator?.setBusRate(rate);
  },

  setTaxiRate: (rate) => {
    get().simulator?.setTaxiRate(rate);
  },
}));
