import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameScene from '@/three/GameScene';
import ControlPanel from '@/components/game/ControlPanel';
import BusPriorityPanel from '@/components/game/BusPriorityPanel';
import ReplayPanel from '@/components/game/ReplayPanel';
import DebugPanel from '@/components/game/DebugPanel';
import ScoreBar from '@/components/ui/ScoreBar';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import { useSimulation } from '@/hooks/useSimulation';
import { useAudio } from '@/hooks/useAudio';
import { useSimulationStore } from '@/store/simulationStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { getLevelById } from '@/config/levels';
import { canTransition } from '@/animation/AnimationState';
import { Simulation } from '@/engine/Simulation';
import type { TrafficLightConfig, AnimationState as AnimState, AdjustmentComparison, SimulationStateSnapshot, ScoreResult, TrafficLightState } from '@/engine/types';

type ReplayPhase = 'idle' | 'before' | 'after' | 'done';
const REPLAY_DURATION = 20;
const REPLAY_SPEED = 3;

function GameContent({ levelId }: { levelId: string }) {
  const navigate = useNavigate();
  const levelConfig = getLevelById(levelId)!;
  const { play } = useAudio();

  const animationState = useSimulationStore(s => s.animationState);
  const trafficLightConfigs = useSimulationStore(s => s.trafficLightConfigs);
  const trafficLightStates = useSimulationStore(s => s.trafficLightStates);
  const simulationTime = useSimulationStore(s => s.simulationTime);
  const currentScore = useSimulationStore(s => s.currentScore);
  const selectedIntersection = useSimulationStore(s => s.selectedIntersection);
  const latestComparison = useSimulationStore(s => s.latestComparison);
  const setAnimationState = useSimulationStore(s => s.setAnimationState);
  const setSelectedIntersection = useSimulationStore(s => s.setSelectedIntersection);
  const setLatestComparison = useSimulationStore(s => s.setLatestComparison);
  const setPreAdjustmentSnapshot = useSimulationStore(s => s.setPreAdjustmentSnapshot);
  const clearSnapshots = useSimulationStore(s => s.clearSnapshots);

  const showTutorial = useUIStore(s => s.showTutorial);
  const tutorialStep = useUIStore(s => s.tutorialStep);
  const showDebugPanel = useUIStore(s => s.showDebugPanel);
  const panelCollapsed = useUIStore(s => s.panelCollapsed);
  const toggleDebugPanel = useUIStore(s => s.toggleDebugPanel);
  const setPanelCollapsed = useUIStore(s => s.setPanelCollapsed);
  const nextTutorialStep = useUIStore(s => s.nextTutorialStep);
  const prevTutorialStep = useUIStore(s => s.prevTutorialStep);
  const setShowTutorial = useUIStore(s => s.setShowTutorial);

  const completeLevel = useGameStore(s => s.completeLevel);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [fps, setFps] = useState(60);
  const [showComparison, setShowComparison] = useState(false);
  const [replayPhase, setReplayPhase] = useState<ReplayPhase>('idle');
  const [replayPhaseLabel, setReplayPhaseLabel] = useState('');
  const [displayVehicles, setDisplayVehicles] = useState<any[]>([]);
  const [displayTlStates, setDisplayTlStates] = useState<TrafficLightState[]>([]);

  const savedBeforeConfig = useRef<TrafficLightConfig[]>([]);
  const savedAfterConfig = useRef<TrafficLightConfig[]>([]);
  const savedSnapshot = useRef<SimulationStateSnapshot | null>(null);
  const beforeScoreRef = useRef<ScoreResult | null>(null);

  const replaySimRef = useRef<Simulation | null>(null);
  const replayRafRef = useRef<number>(0);
  const replayLastTimeRef = useRef<number>(0);
  const replayStartSimTimeRef = useRef<number>(0);
  const replayPhaseRef = useRef<ReplayPhase>('idle');

  const { getSim, updateConfig, reset } = useSimulation(levelConfig);

  useEffect(() => {
    if (levelConfig.tutorialSteps && levelConfig.id === 'tutorial') {
      setShowTutorial(true);
    }
  }, [levelConfig, setShowTutorial]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (replayPhase === 'idle' || replayPhase === 'done') {
        const sim = getSim();
        if (sim) {
          setDisplayVehicles([...sim.vehicles]);
        }
        setDisplayTlStates(trafficLightStates);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [getSim, trafficLightStates, replayPhase]);

  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();
    let frameCount = 0;
    const measureFps = (time: number) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }
      animFrame = requestAnimationFrame(measureFps);
    };
    animFrame = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const startReplayLoop = useCallback(() => {
    replayLastTimeRef.current = 0;

    const tick = (timestamp: number) => {
      const sim = replaySimRef.current;
      if (!sim) return;

      if (replayLastTimeRef.current === 0) {
        replayLastTimeRef.current = timestamp;
      }

      const rawDt = (timestamp - replayLastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.1);
      replayLastTimeRef.current = timestamp;

      const phase = replayPhaseRef.current;

      if (sim.isRunning) {
        const scaledDt = dt * REPLAY_SPEED;
        sim.setSpeed(1);
        sim.update(scaledDt);

        setDisplayVehicles([...sim.vehicles]);
        const state = sim.getState();
        setDisplayTlStates(state.trafficLightStates);

        const elapsed = sim.time - replayStartSimTimeRef.current;

        if (phase === 'before' && elapsed >= REPLAY_DURATION) {
          beforeScoreRef.current = state.score;
          sim.setRunning(false);

          const snapshot = savedSnapshot.current;
          const afterConfig = savedAfterConfig.current;
          if (snapshot) {
            const afterSim = Simulation.createFromSnapshot(snapshot, afterConfig);
            replaySimRef.current = afterSim;
            replayStartSimTimeRef.current = afterSim.time;
            replayLastTimeRef.current = 0;
            afterSim.setRunning(true);
            afterSim.setSpeed(1);
            replayPhaseRef.current = 'after';
            setReplayPhase('after');
            setReplayPhaseLabel('调整后回放中...');
          }
          replayRafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (phase === 'after' && elapsed >= REPLAY_DURATION) {
          const afterScore = state.score;
          const beforeScore = beforeScoreRef.current;
          sim.setRunning(false);

          if (afterScore && beforeScore) {
            const comparison: AdjustmentComparison = {
              beforeScore,
              afterScore,
              beforeConfig: savedBeforeConfig.current,
              afterConfig: savedAfterConfig.current,
              congestionDelta: beforeScore.congestionScore - afterScore.congestionScore,
              throughputDelta: afterScore.throughput - beforeScore.throughput,
              avgWaitDelta: beforeScore.avgWaitTime - afterScore.avgWaitTime,
              busWaitDelta: beforeScore.busAvgWaitTime - afterScore.busAvgWaitTime,
              improved: afterScore.congestionScore < beforeScore.congestionScore,
            };
            setLatestComparison(comparison);
            setShowComparison(true);
          }

          setAnimationState('paused');
          replayPhaseRef.current = 'done';
          setReplayPhase('done');
          setReplayPhaseLabel('');
          replaySimRef.current = null;
          beforeScoreRef.current = null;
          return;
        }
      }

      replayRafRef.current = requestAnimationFrame(tick);
    };

    replayRafRef.current = requestAnimationFrame(tick);
  }, [setLatestComparison, setAnimationState]);

  useEffect(() => {
    return () => {
      if (replayRafRef.current) {
        cancelAnimationFrame(replayRafRef.current);
      }
    };
  }, []);

  const tryTransition = useCallback((targetState: AnimState) => {
    if (canTransition(animationState, targetState)) {
      setAnimationState(targetState);
      if (targetState === 'playing') play('button-click');
      if (targetState === 'fastForward') play('slider-change');
    }
  }, [animationState, setAnimationState, play]);

  const handlePlay = useCallback(() => {
    if (replayPhase !== 'idle' && replayPhase !== 'done') return;
    if (replayRafRef.current) cancelAnimationFrame(replayRafRef.current);
    replaySimRef.current = null;
    replayPhaseRef.current = 'idle';
    setReplayPhase('idle');
    setReplayPhaseLabel('');
    setShowComparison(false);
    tryTransition('playing');
    const sim = getSim();
    if (sim && !sim.isRunning) {
      sim.setRunning(true);
    }
  }, [replayPhase, tryTransition, getSim]);

  const handlePause = useCallback(() => {
    tryTransition('paused');
  }, [tryTransition]);

  const handleFastForward = useCallback(() => {
    if (replayPhase !== 'idle' && replayPhase !== 'done') return;
    tryTransition('fastForward');
  }, [replayPhase, tryTransition]);

  const handleStop = useCallback(() => {
    if (replayRafRef.current) cancelAnimationFrame(replayRafRef.current);
    replaySimRef.current = null;
    replayPhaseRef.current = 'idle';
    setReplayPhase('idle');
    setReplayPhaseLabel('');
    tryTransition('idle');
    reset();
    clearSnapshots();
    setLatestComparison(null);
    setPreAdjustmentSnapshot(null);
    setShowComparison(false);
  }, [tryTransition, reset, clearSnapshots, setLatestComparison, setPreAdjustmentSnapshot]);

  const handleReplay = useCallback(() => {
    const snapshot = savedSnapshot.current;
    if (!snapshot) return;

    const mainSim = getSim();
    if (mainSim) mainSim.setRunning(false);

    const beforeSim = Simulation.createFromSnapshot(snapshot, savedBeforeConfig.current);
    replaySimRef.current = beforeSim;
    replayStartSimTimeRef.current = beforeSim.time;
    beforeScoreRef.current = null;

    setReplayPhase('before');
    replayPhaseRef.current = 'before';
    setReplayPhaseLabel('调整前回放中...');
    setShowComparison(false);
    setAnimationState('replaying');

    beforeSim.setRunning(true);
    startReplayLoop();
  }, [getSim, setAnimationState, startReplayLoop]);

  const handleIntersectionClick = useCallback((id: string) => {
    setSelectedIntersection(id);
    play('button-click');
  }, [setSelectedIntersection, play]);

  const handleUpdateConfig = useCallback((intersectionId: string, patch: Partial<TrafficLightConfig>) => {
    const sim = getSim();

    const currentConfigs = trafficLightConfigs.map(c => ({ ...c }));

    savedBeforeConfig.current = currentConfigs;
    savedAfterConfig.current = currentConfigs.map(c =>
      c.intersectionId === intersectionId ? { ...c, ...patch } : c,
    );
    savedSnapshot.current = sim ? sim.captureSnapshot() : null;
    setPreAdjustmentSnapshot(null);
    setShowComparison(false);

    updateConfig(intersectionId, patch);
    play('slider-change');
  }, [trafficLightConfigs, getSim, setPreAdjustmentSnapshot, updateConfig, play]);

  useEffect(() => {
    if (!levelConfig || levelConfig.timeLimit === 0) return;
    if (replayPhase !== 'idle' && replayPhase !== 'done') return;
    if (simulationTime >= levelConfig.timeLimit && animationState !== 'idle') {
      setAnimationState('idle');
      const sim = getSim();
      if (sim) {
        const finalState = sim.getState();
        if (finalState.score) {
          completeLevel(levelConfig.id, finalState.score, null);
          play(finalState.score.starRating > 0 ? 'level-complete' : 'level-fail');
          navigate(`/result/${levelConfig.id}`);
        }
      }
    }
  }, [simulationTime, levelConfig, animationState, replayPhase, setAnimationState, getSim, completeLevel, play, navigate]);

  const handleNextTutorial = useCallback(() => {
    if (levelConfig.tutorialSteps && tutorialStep >= levelConfig.tutorialSteps.length - 1) {
      setShowTutorial(false);
      tryTransition('playing');
    } else {
      nextTutorialStep();
    }
  }, [levelConfig, tutorialStep, setShowTutorial, tryTransition, nextTutorialStep]);

  const selectedConfig = trafficLightConfigs.find(
    c => c.intersectionId === selectedIntersection,
  );

  const timeRemaining = levelConfig.timeLimit > 0
    ? Math.max(0, levelConfig.timeLimit - simulationTime)
    : 0;

  const isReplaying = replayPhase === 'before' || replayPhase === 'after';

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      <div className="absolute inset-0">
        <GameScene
          layout={levelConfig.roadLayout}
          vehicles={displayVehicles}
          trafficLightStates={displayTlStates}
          onIntersectionClick={handleIntersectionClick}
        />
      </div>

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <ReplayPanel
          animationState={animationState}
          onPlay={handlePlay}
          onPause={handlePause}
          onFastForward={handleFastForward}
          onStop={handleStop}
          onReplay={handleReplay}
        />
      </div>

      <div className="absolute top-4 right-4 z-20 w-72">
        {!panelCollapsed && (
          <div className="flex flex-col gap-3 mb-3">
            <ControlPanel
              intersectionId={selectedIntersection}
              config={selectedConfig ?? null}
              onUpdateConfig={handleUpdateConfig}
            />
            {levelConfig.busRoutes.length > 0 && (
              <BusPriorityPanel
                intersectionId={selectedIntersection}
                config={selectedConfig ?? null}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
          </div>
        )}
        <button
          className="w-full text-xs text-white/40 hover:text-white/70 transition-colors py-1"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
        >
          {panelCollapsed ? '展开面板 ▼' : '折叠面板 ▲'}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <ScoreBar
          congestionScore={currentScore?.congestionScore ?? 0}
          targetScore={levelConfig.targetScore}
          timeRemaining={timeRemaining}
          totalTime={levelConfig.timeLimit}
        />
      </div>

      {showDebugPanel && (
        <div className="absolute bottom-20 left-4 z-20 w-56">
          <DebugPanel
            vehicles={displayVehicles}
            time={simulationTime}
            fps={fps}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
          />
        </div>
      )}

      {levelConfig.tutorialSteps && (
        <TutorialOverlay
          steps={levelConfig.tutorialSteps}
          currentStep={tutorialStep}
          onNext={handleNextTutorial}
          onPrev={prevTutorialStep}
          onSkip={() => {
            setShowTutorial(false);
            tryTransition('playing');
          }}
          isVisible={showTutorial}
        />
      )}

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div
          className="px-4 py-1 rounded-full text-sm font-semibold"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: isReplaying ? '#ff8800' : '#00ff88',
            fontFamily: 'Orbitron, monospace',
            textShadow: isReplaying
              ? '0 0 8px #ff880044'
              : '0 0 8px #00ff8844',
          }}
        >
          {isReplaying ? replayPhaseLabel : levelConfig.name}
        </div>
      </div>

      {isReplaying && (
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: replayPhase === 'before' ? '#ff8800' : '#00ff88',
            border: `1px solid ${replayPhase === 'before' ? 'rgba(255,136,0,0.3)' : 'rgba(0,255,136,0.3)'}`,
          }}
        >
          {replayPhase === 'before' ? '▶ 调整前配置 · 同起点回放' : '▶ 调整后配置 · 同起点回放'}
          {' · '}{REPLAY_SPEED}x · {REPLAY_DURATION}s
        </div>
      )}

      <div className="absolute bottom-20 right-4 z-20 flex gap-2">
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#ff8800',
            border: '1px solid rgba(255,136,0,0.3)',
          }}
          onClick={() => navigate('/levels')}
        >
          退出
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#00ff88',
            border: '1px solid rgba(0,255,136,0.3)',
          }}
          onClick={() => {
            if (replayRafRef.current) cancelAnimationFrame(replayRafRef.current);
            replaySimRef.current = null;
            reset();
            tryTransition('idle');
            replayPhaseRef.current = 'idle';
    setReplayPhase('idle');
            setReplayPhaseLabel('');
            setLatestComparison(null);
            setPreAdjustmentSnapshot(null);
            setShowComparison(false);
          }}
        >
          重置
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: showDebugPanel ? 'rgba(255,136,0,0.15)' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#ff8800',
            border: `1px solid ${showDebugPanel ? 'rgba(255,136,0,0.5)' : 'rgba(255,136,0,0.3)'}`,
          }}
          onClick={toggleDebugPanel}
        >
          Debug
        </button>
      </div>

      {showComparison && latestComparison && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-96 animate-fade-in"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${latestComparison.improved ? '#00ff88' : '#ff4444'}44`,
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h3
            className="text-lg font-bold mb-1 text-center"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: latestComparison.improved ? '#00ff88' : '#ff4444',
              textShadow: `0 0 10px ${latestComparison.improved ? '#00ff8844' : '#ff444444'}`,
            }}
          >
            {latestComparison.improved ? '✓ 调整有效' : '✗ 调整需优化'}
          </h3>
          <p className="text-center text-xs text-white/40 mb-4">
            同起点回放对比 · 各 {REPLAY_DURATION} 秒 · {REPLAY_SPEED}x
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/60">拥堵评分</span>
              <span style={{ color: latestComparison.congestionDelta > 0 ? '#00ff88' : '#ff4444' }}>
                {latestComparison.beforeScore.congestionScore.toFixed(1)} → {latestComparison.afterScore.congestionScore.toFixed(1)}
                {' '}({latestComparison.congestionDelta > 0 ? '↓' : '↑'}{Math.abs(latestComparison.congestionDelta).toFixed(1)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">通行量</span>
              <span style={{ color: latestComparison.throughputDelta > 0 ? '#00ff88' : '#ff4444' }}>
                {latestComparison.beforeScore.throughput} → {latestComparison.afterScore.throughput}
                {' '}({latestComparison.throughputDelta > 0 ? '↑' : '↓'}{Math.abs(latestComparison.throughputDelta)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">平均等待</span>
              <span style={{ color: latestComparison.avgWaitDelta > 0 ? '#00ff88' : '#ff4444' }}>
                {latestComparison.beforeScore.avgWaitTime.toFixed(1)}s → {latestComparison.afterScore.avgWaitTime.toFixed(1)}s
              </span>
            </div>
            {latestComparison.beforeScore.busAvgWaitTime > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-white/60">公交等待</span>
                <span style={{ color: latestComparison.busWaitDelta > 0 ? '#00ff88' : '#ff4444' }}>
                  {latestComparison.beforeScore.busAvgWaitTime.toFixed(1)}s → {latestComparison.afterScore.busAvgWaitTime.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          <button
            className="w-full mt-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
            }}
            onClick={() => {
              setShowComparison(false);
              replayPhaseRef.current = 'idle';
    setReplayPhase('idle');
              setReplayPhaseLabel('');
              const sim = getSim();
              if (sim) {
                setDisplayVehicles([...sim.vehicles]);
              }
              setDisplayTlStates(trafficLightStates);
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  if (!levelId || !getLevelById(levelId)) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
        <div className="text-center">
          <p className="text-white/50 text-xl mb-4">关卡未找到</p>
          <button
            className="px-4 py-2 rounded-lg text-sm border border-[#ff8800] text-[#ff8800]"
            onClick={() => navigate('/levels')}
          >
            返回关卡选择
          </button>
        </div>
      </div>
    );
  }

  return <GameContent levelId={levelId} />;
}
