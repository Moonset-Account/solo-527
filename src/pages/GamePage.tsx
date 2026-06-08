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
import { useReplay } from '@/hooks/useReplay';
import { useAudio } from '@/hooks/useAudio';
import { useSimulationStore } from '@/store/simulationStore';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { getLevelById } from '@/config/levels';
import { canTransition } from '@/animation/AnimationState';
import type { TrafficLightConfig, AnimationState as AnimState } from '@/engine/types';

function GameContent({ levelId }: { levelId: string }) {
  const navigate = useNavigate();
  const levelConfig = getLevelById(levelId)!;
  const { play } = useAudio();
  const { captureSnapshot, clearHistory } = useReplay();

  const animationState = useSimulationStore(s => s.animationState);
  const trafficLightConfigs = useSimulationStore(s => s.trafficLightConfigs);
  const trafficLightStates = useSimulationStore(s => s.trafficLightStates);
  const simulationTime = useSimulationStore(s => s.simulationTime);
  const currentScore = useSimulationStore(s => s.currentScore);
  const selectedIntersection = useSimulationStore(s => s.selectedIntersection);
  const setAnimationState = useSimulationStore(s => s.setAnimationState);
  const setSelectedIntersection = useSimulationStore(s => s.setSelectedIntersection);

  const showTutorial = useUIStore(s => s.showTutorial);
  const tutorialStep = useUIStore(s => s.tutorialStep);
  const showDebugPanel = useUIStore(s => s.showDebugPanel);
  const panelCollapsed = useUIStore(s => s.panelCollapsed);
  const setPanelCollapsed = useUIStore(s => s.setPanelCollapsed);
  const nextTutorialStep = useUIStore(s => s.nextTutorialStep);
  const prevTutorialStep = useUIStore(s => s.prevTutorialStep);
  const setShowTutorial = useUIStore(s => s.setShowTutorial);

  const completeLevel = useGameStore(s => s.completeLevel);

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fps, setFps] = useState(60);

  const { getSim, updateConfig, reset } = useSimulation(levelConfig);

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

  const tryTransition = useCallback((targetState: AnimState) => {
    if (canTransition(animationState, targetState)) {
      setAnimationState(targetState);
      if (targetState === 'playing') play('button-click');
      if (targetState === 'fastForward') play('slider-change');
    }
  }, [animationState, setAnimationState, play]);

  const handlePlay = useCallback(() => {
    tryTransition('playing');
    const sim = getSim();
    if (sim && !sim.isRunning) {
      sim.setRunning(true);
    }
  }, [tryTransition, getSim]);

  const handlePause = useCallback(() => {
    tryTransition('paused');
  }, [tryTransition]);

  const handleFastForward = useCallback(() => {
    tryTransition('fastForward');
  }, [tryTransition]);

  const handleStop = useCallback(() => {
    tryTransition('idle');
    reset();
    clearHistory();
  }, [tryTransition, reset, clearHistory]);

  const handleReplay = useCallback(() => {
    if (currentScore) {
      captureSnapshot(trafficLightConfigs, currentScore);
    }
    tryTransition('replaying');
  }, [currentScore, trafficLightConfigs, captureSnapshot, tryTransition]);

  const handleIntersectionClick = useCallback((id: string) => {
    setSelectedIntersection(id);
    play('button-click');
  }, [setSelectedIntersection, play]);

  const handleUpdateConfig = useCallback((intersectionId: string, patch: Partial<TrafficLightConfig>) => {
    if (currentScore) {
      captureSnapshot(trafficLightConfigs, currentScore);
    }
    updateConfig(intersectionId, patch);
    play('slider-change');
  }, [currentScore, trafficLightConfigs, captureSnapshot, updateConfig, play]);

  useEffect(() => {
    if (!levelConfig || levelConfig.timeLimit === 0) return;
    if (simulationTime >= levelConfig.timeLimit && animationState !== 'idle') {
      setAnimationState('idle');
      const sim = getSim();
      if (sim) {
        const finalState = sim.getState();
        if (finalState.score) {
          completeLevel(levelConfig.id, finalState.score);
          play(finalState.score.starRating > 0 ? 'level-complete' : 'level-fail');
          navigate(`/result/${levelConfig.id}`);
        }
      }
    }
  }, [simulationTime, levelConfig, animationState, setAnimationState, getSim, completeLevel, play, navigate]);

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
            color: '#00ff88',
            fontFamily: 'Orbitron, monospace',
            textShadow: '0 0 8px #00ff8844',
          }}
        >
          {levelConfig.name}
        </div>
      </div>

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
          }}
        >
          重置
        </button>
      </div>
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
