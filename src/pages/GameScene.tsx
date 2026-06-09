import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SceneRoot } from '@/scene/SceneRoot';
import { ControlPanel } from '@/components/game/ControlPanel';
import { HUD } from '@/components/game/HUD';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { ResultScreen } from '@/components/result/ResultScreen';
import { ArrowLeft, Eye, EyeOff, Pause, Play, RotateCcw, Layers } from 'lucide-react';

export default function GameScene() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const {
    initSimulator,
    destroySimulator,
    simulator,
    currentLevel,
    status,
    attemptCount,
    timeElapsed,
    compareReplayFrames,
    loadComparisonReplayForLevel,
    clearComparison,
    startSimulation,
    pauseSimulation,
    resetSimulation,
  } = useGameStore();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [lightState, setLightState] = useState<any>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);

  useEffect(() => {
    if (levelId) {
      initSimulator(levelId);
    }
    return () => {
      destroySimulator();
    };
  }, [levelId, initSimulator, destroySimulator]);

  useEffect(() => {
    const PRIMARY_INTERSECTION = 'int_main';
    let rafId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = useGameStore.getState();
      state.tick(delta);
      state.tickPlayTime(delta);

      if (state.simulator) {
        setVehicles(state.simulator.getVehicles());
        const roadNetwork = state.simulator.getRoadNetwork();
        setLightState(roadNetwork.getTrafficLightState(PRIMARY_INTERSECTION));
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const compareFrame = useMemo(() => {
    if (!compareEnabled || !compareReplayFrames || compareReplayFrames.length === 0) {
      return null;
    }
    let closest = compareReplayFrames[0];
    let minDiff = Math.abs(timeElapsed - closest.time);
    for (let i = 1; i < compareReplayFrames.length; i++) {
      const diff = Math.abs(timeElapsed - compareReplayFrames[i].time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = compareReplayFrames[i];
      }
    }
    return closest;
  }, [compareEnabled, compareReplayFrames, timeElapsed]);

  const handleBack = useCallback(() => {
    destroySimulator();
    navigate('/');
  }, [destroySimulator, navigate]);

  const handleToggleCompare = useCallback(() => {
    if (compareEnabled) {
      clearComparison();
      setCompareEnabled(false);
    } else {
      if (levelId && !compareReplayFrames) {
        const loaded = loadComparisonReplayForLevel(levelId);
        if (!loaded) {
          return;
        }
      }
      setCompareEnabled(true);
    }
  }, [compareEnabled, clearComparison, compareReplayFrames, levelId, loadComparisonReplayForLevel]);

  const handleTogglePause = useCallback(() => {
    if (status === 'simulating') {
      pauseSimulation();
    } else if (status === 'paused') {
      startSimulation();
    }
  }, [status, pauseSimulation, startSimulation]);

  const isSimulating = status === 'simulating';
  const isPaused = status === 'paused';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <div className="absolute top-0 left-0 right-0 h-14 z-20 flex items-center justify-between px-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-cyan-500/20 hover:bg-slate-800/70 hover:border-cyan-400/40 text-slate-200 font-medium transition-all active:scale-95 shadow-lg shadow-cyan-500/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
            <div>
              <h2
                className="text-white font-bold text-base leading-tight"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                {currentLevel?.name || '加载中...'}
              </h2>
              <p className="text-slate-400 text-xs leading-tight">
                第 {attemptCount} 次尝试
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCompare}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl border transition-all active:scale-95 shadow-lg ${
              compareEnabled
                ? 'bg-purple-500/20 border-purple-400/40 text-purple-200 shadow-purple-500/10'
                : 'bg-slate-900/70 border-slate-600/40 hover:bg-slate-800/70 hover:border-purple-400/30 text-slate-300 shadow-cyan-500/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">对比回放</span>
            {compareEnabled ? (
              <Eye className="w-4 h-4 text-purple-300" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={handleTogglePause}
            disabled={status !== 'simulating' && status !== 'paused'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-600/40 hover:bg-slate-800/70 text-slate-200 transition-all active:scale-95 shadow-lg shadow-cyan-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <><Pause className="w-4 h-4" /><span className="text-sm font-medium">暂停</span></>
            ) : (
              <><Play className="w-4 h-4" /><span className="text-sm font-medium">继续</span></>
            )}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl bg-slate-900/70 border border-slate-600/40 hover:bg-amber-900/40 hover:border-amber-500/40 text-slate-200 transition-all active:scale-95 shadow-lg shadow-cyan-500/5"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">重置</span>
          </button>
        </div>
      </div>

      <div className="absolute inset-0">
        <SceneRoot
          vehicles={vehicles}
          lightState={lightState}
          compareFrame={compareFrame}
        />
      </div>

      <div id="control-panel">
        <ControlPanel />
      </div>

      <HUD />
      <TutorialOverlay />
      <ResultScreen />
    </div>
  );
}
