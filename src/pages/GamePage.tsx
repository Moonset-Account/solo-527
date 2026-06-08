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
import type { TrafficLightConfig, AnimationState as AnimState, AdjustmentComparison, ReplaySnapshot, ScoreResult } from '@/engine/types';

type ReplayPhase = 'idle' | 'before' | 'after' | 'done';
const REPLAY_PHASE_DURATION = 20;

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
  const preAdjustmentSnapshot = useSimulationStore(s => s.preAdjustmentSnapshot);
  const setAnimationState = useSimulationStore(s => s.setAnimationState);
  const setSelectedIntersection = useSimulationStore(s => s.setSelectedIntersection);
  const setLatestComparison = useSimulationStore(s => s.setLatestComparison);
  const setPreAdjustmentSnapshot = useSimulationStore(s => s.setPreAdjustmentSnapshot);
  const addSnapshot = useSimulationStore(s => s.addSnapshot);
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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fps, setFps] = useState(60);
  const [showComparison, setShowComparison] = useState(false);
  const [replayPhase, setReplayPhase] = useState<ReplayPhase>('idle');
  const [replayPhaseLabel, setReplayPhaseLabel] = useState('');

  const replayStartSimTime = useRef<number>(0);
  const beforeReplayScore = useRef<ScoreResult | null>(null);
  const savedAfterConfigs = useRef<TrafficLightConfig[]>([]);

  const { getSim, updateConfig, applyAllConfigs, reset } = useSimulation(levelConfig);

  useEffect(() => {
    if (levelConfig.tutorialSteps && levelConfig.id === 'tutorial') {
      setShowTutorial(true);
    }
  }, [levelConfig, setShowTutorial]);

  useEffect(() => {
    const interval = setInterval(() => {
      const sim = getSim();
      if (sim) {
        setVehicles([...sim.vehicles]);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [getSim]);

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

  useEffect(() => {
    if (replayPhase === 'idle' || replayPhase === 'done') return;

    const sim = getSim();
    if (!sim) return;

    const elapsed = sim.time - replayStartSimTime.current;

    if (replayPhase === 'before') {
      setReplayPhaseLabel('调整前回放中...');
      if (elapsed >= REPLAY_PHASE_DURATION) {
        const state = sim.getState();
        beforeReplayScore.current = state.score;

        applyAllConfigs(savedAfterConfigs.current);

        replayStartSimTime.current = sim.time;
        setReplayPhase('after');
      }
    } else if (replayPhase === 'after') {
      setReplayPhaseLabel('调整后回放中...');
      if (elapsed >= REPLAY_PHASE_DURATION) {
        const state = sim.getState();
        const afterScore = state.score;
        const beforeScore = beforeReplayScore.current;

        if (afterScore && beforeScore) {
          const comparison: AdjustmentComparison = {
            beforeScore,
            afterScore,
            beforeConfig: preAdjustmentSnapshot?.trafficLightConfig ?? [],
            afterConfig: savedAfterConfigs.current,
            congestionDelta: beforeScore.congestionScore - afterScore.congestionScore,
            throughputDelta: afterScore.throughput - beforeScore.throughput,
            avgWaitDelta: beforeScore.avgWaitTime - afterScore.avgWaitTime,
            busWaitDelta: beforeScore.busAvgWaitTime - afterScore.busAvgWaitTime,
            improved: afterScore.congestionScore < beforeScore.congestionScore,
          };
          setLatestComparison(comparison);
          setShowComparison(true);
        }

        sim.setRunning(false);
        setAnimationState('paused');
        setReplayPhase('done');
        setReplayPhaseLabel('');
        beforeReplayScore.current = null;
        savedAfterConfigs.current = [];
      }
    }
  }, [replayPhase, simulationTime, getSim, applyAllConfigs, preAdjustmentSnapshot, setLatestComparison, setAnimationState]);

  const tryTransition = useCallback((targetState: AnimState) => {
    if (canTransition(animationState, targetState)) {
      setAnimationState(targetState);
      if (targetState === 'playing') play('button-click');
      if (targetState === 'fastForward') play('slider-change');
    }
  }, [animationState, setAnimationState, play]);

  const handlePlay = useCallback(() => {
    if (replayPhase !== 'idle' && replayPhase !== 'done') return;
    setReplayPhase('idle');
    setReplayPhaseLabel('');
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
    if (!preAdjustmentSnapshot) return;

    const sim = getSim();
    if (!sim) return;

    savedAfterConfigs.current = trafficLightConfigs.map(c => ({ ...c }));

    addSnapshot({
      ...preAdjustmentSnapshot,
      simulationTime: sim.time,
    });

    applyAllConfigs(preAdjustmentSnapshot.trafficLightConfig);

    replayStartSimTime.current = sim.time;
    beforeReplayScore.current = null;
    setReplayPhase('before');
    setShowComparison(false);

    sim.setRunning(true);
    sim.setSpeed(3);
    setAnimationState('replaying');
  }, [preAdjustmentSnapshot, getSim, trafficLightConfigs, addSnapshot, applyAllConfigs, setAnimationState]);

  const handleIntersectionClick = useCallback((id: string) => {
    setSelectedIntersection(id);
    play('button-click');
  }, [setSelectedIntersection, play]);

  const handleUpdateConfig = useCallback((intersectionId: string, patch: Partial<TrafficLightConfig>) => {
    const sim = getSim();
    const score = currentScore ?? sim?.getState().score ?? null;

    const snapshot: ReplaySnapshot = {
      timestamp: Date.now(),
      trafficLightConfig: trafficLightConfigs.map(c => ({ ...c })),
      scoreSnapshot: score ?? {
        congestionScore: 0,
        throughput: 0,
        avgWaitTime: 0,
        busAvgWaitTime: 0,
        starRating: 0,
      },
      simulationTime,
    };
    setPreAdjustmentSnapshot(snapshot);
    setShowComparison(false);

    updateConfig(intersectionId, patch);
    play('slider-change');
  }, [currentScore, trafficLightConfigs, simulationTime, getSim, setPreAdjustmentSnapshot, updateConfig, play]);

  useEffect(() => {
    if (!levelConfig || levelConfig.timeLimit === 0) return;
    if (replayPhase !== 'idle' && replayPhase !== 'done') return;
    if (simulationTime >= levelConfig.timeLimit && animationState !== 'idle') {
      setAnimationState('idle');
      const sim = getSim();
      if (sim) {
        const finalState = sim.getState();
        if (finalState.score) {
          const beforeScore = preAdjustmentSnapshot?.scoreSnapshot ?? null;
          completeLevel(levelConfig.id, finalState.score, beforeScore);
          play(finalState.score.starRating > 0 ? 'level-complete' : 'level-fail');
          navigate(`/result/${levelConfig.id}`);
        }
      }
    }
  }, [simulationTime, levelConfig, animationState, replayPhase, setAnimationState, getSim, completeLevel, play, navigate, preAdjustmentSnapshot]);

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
          vehicles={vehicles}
          trafficLightStates={trafficLightStates}
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
            vehicles={vehicles}
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
          {replayPhase === 'before' ? '▶ 调整前配置回放' : '▶ 调整后配置回放'}
          {' · 3x'}
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
            reset();
            tryTransition('idle');
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
            回放对比 · 各 {REPLAY_PHASE_DURATION} 秒
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
              setReplayPhase('idle');
              setReplayPhaseLabel('');
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
