import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { useUIStore } from '@/store/useUIStore';
import { trafficSim } from '@/engine/TrafficSim';
import { useSimulation } from '@/hooks/useSimulation';
import { useAudio } from '@/hooks/useAudio';
import * as AudioTrigger from '@/engine/AudioTrigger';
import GameScene from '@/components/scene/GameScene';
import SignalPanel from '@/components/ui/SignalPanel';
import CongestionDash from '@/components/ui/CongestionDash';
import TimeControl from '@/components/ui/TimeControl';
import ReplayPanel from '@/components/ui/ReplayPanel';
import SaveSlots from '@/components/ui/SaveSlots';

const LEVEL_MODULES = import.meta.glob('/src/data/levels/*.json', { eager: true });

function loadLevelData(levelId: string) {
  const key = `/src/data/levels/${levelId}.json`;
  const mod = LEVEL_MODULES[key] as Record<string, unknown> | undefined;
  if (!mod) return null;
  return (mod.default as unknown) ?? mod;
}

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const startLevel = useGameStore((s) => s.startLevel);
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.level);
  const congestionScore = useGameStore((s) => s.congestionScore);
  const setPhase = useGameStore((s) => s.setPhase);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const throughput = useGameStore((s) => s.throughput);
  const avgWaitTime = useGameStore((s) => s.avgWaitTime);
  const failureCount = useGameStore((s) => s.failureCount);
  const adjustmentHistory = useGameStore((s) => s.adjustmentHistory);
  const playTimeSeconds = useGameStore((s) => s.playTimeSeconds);
  const gameTime = useGameStore((s) => s.gameTime);
  const cameraMode = useUIStore((s) => s.cameraMode);
  const setCameraMode = useUIStore((s) => s.setCameraMode);
  const [initialized, setInitialized] = useState(false);
  const completedRef = useRef(false);

  useSimulation();
  useAudio();

  useEffect(() => {
    if (!levelId) return;
    const data = loadLevelData(levelId);
    if (data) {
      trafficSim.init(data as any);
      startLevel(data as any);
      setInitialized(true);
      completedRef.current = false;
    }
  }, [levelId]);

  useEffect(() => {
    if (completedRef.current) return;
    if (!level || phase !== 'paused') return;
    if (gameTime < level.timeLimit) return;

    if (congestionScore <= level.targetScore) {
      completedRef.current = true;
      completeLevel(level.id);
    }
  }, [phase, gameTime, level, congestionScore, completeLevel]);

  const handleBack = () => {
    setPhase('menu');
    navigate('/');
    AudioTrigger.playUIClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        const currentPhase = useGameStore.getState().phase;
        useGameStore.getState().setPhase(currentPhase === 'playing' ? 'paused' : 'playing');
      }
      if (e.key === '1') useGameStore.getState().setSpeed(1);
      if (e.key === '2') useGameStore.getState().setSpeed(2);
      if (e.key === '4') useGameStore.getState().setSpeed(4);
      if (e.key === 'r' || e.key === 'R') useGameStore.getState().restartLevel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!initialized || !level) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a1a]">
        <span className="font-['Orbitron'] text-sm text-white/40">加载中...</span>
      </div>
    );
  }

  const isLevelComplete = phase === 'complete';
  const isTimeUp = phase === 'paused' && gameTime >= level.timeLimit;
  const didWin = congestionScore <= level.targetScore;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a1a]">
      <div className="h-full w-full">
        <GameScene />
      </div>

      <div className="absolute left-3 top-3 z-10">
        <button
          onClick={handleBack}
          className="rounded bg-[#1a1a2e]/80 px-3 py-1.5 font-['Orbitron'] text-[10px] text-white/50 backdrop-blur-sm transition hover:bg-[#1a1a2e] hover:text-white"
        >
          ← 返回
        </button>
      </div>

      <div className="absolute left-3 top-12 z-10">
        <button
          onClick={() => setCameraMode(cameraMode === 'orbit' ? 'topdown' : 'orbit')}
          className="rounded bg-[#1a1a2e]/80 px-3 py-1.5 font-['Orbitron'] text-[10px] text-white/50 backdrop-blur-sm transition hover:bg-[#1a1a2e] hover:text-white"
        >
          {cameraMode === 'orbit' ? '🔄 俯视' : '🔄 斜视'}
        </button>
      </div>

      <CongestionDash />
      <SignalPanel />
      <TimeControl />
      <ReplayPanel />
      <SaveSlots />

      {phase === 'paused' && !isTimeUp && !isLevelComplete && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-lg border border-white/10 bg-[#1a1a2e] p-8 text-center">
            <h2 className="mb-4 font-['Orbitron'] text-xl text-white/80">暂停</h2>
            <button
              onClick={() => setPhase('playing')}
              className="rounded bg-[#0abde3]/20 px-6 py-2 font-['Orbitron'] text-sm text-[#0abde3] transition hover:bg-[#0abde3]/30"
            >
              继续
            </button>
          </div>
        </div>
      )}

      {(isLevelComplete || isTimeUp) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-96 rounded-lg border border-white/10 bg-[#1a1a2e] p-8 text-center">
            {didWin ? (
              <>
                <h2 className="mb-2 font-['Orbitron'] text-2xl text-[#2ecc71]">
                  ✓ 通关
                </h2>
                <p className="mb-1 text-sm text-white/60">
                  拥堵评分: <span className="text-[#2ecc71]">{congestionScore}</span> / 目标 ≤{level.targetScore}
                </p>
                <p className="mb-1 text-xs text-white/40">
                  通行量: {throughput} | 等待车辆: {avgWaitTime.toFixed(0)}
                </p>
                <div className="mb-3 mt-3 rounded border border-white/5 bg-white/5 p-2">
                  <p className="text-[10px] text-white/40">试玩记录</p>
                  <div className="mt-1 flex justify-between text-[10px]">
                    <span className="text-white/30">用时</span>
                    <span className="text-white/60">{playTimeSeconds.toFixed(0)}s</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px]">
                    <span className="text-white/30">失败次数</span>
                    <span className="text-white/60">{failureCount}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px]">
                    <span className="text-white/30">信号调整</span>
                    <span className="text-white/60">{adjustmentHistory.length} 次</span>
                  </div>
                  {adjustmentHistory.length > 0 && (
                    <div className="mt-1 max-h-16 overflow-auto text-[9px] text-white/20">
                      {adjustmentHistory.slice(-3).map((adj, i) => (
                        <div key={i}>
                          {adj.intersectionId} @ {adj.timestamp.toFixed(0)}s
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="rounded bg-white/5 px-4 py-2 font-['Orbitron'] text-xs text-white/60 transition hover:bg-white/10"
                  >
                    返回主页
                  </button>
                  <button
                    onClick={() => {
                      completedRef.current = false;
                      restartLevel();
                    }}
                    className="rounded bg-[#0abde3]/20 px-4 py-2 font-['Orbitron'] text-xs text-[#0abde3] transition hover:bg-[#0abde3]/30"
                  >
                    再玩一次
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 font-['Orbitron'] text-2xl text-[#e74c3c]">
                  ✗ 未达标
                </h2>
                <p className="mb-1 text-sm text-white/60">
                  拥堵评分: <span className="text-[#e74c3c]">{congestionScore}</span> / 目标 ≤{level.targetScore}
                </p>
                <p className="mb-1 text-xs text-white/40">
                  通行量: {throughput} | 等待车辆: {avgWaitTime.toFixed(0)}
                </p>
                <div className="mb-3 mt-3 rounded border border-white/5 bg-white/5 p-2">
                  <p className="text-[10px] text-white/40">试玩记录</p>
                  <div className="mt-1 flex justify-between text-[10px]">
                    <span className="text-white/30">用时</span>
                    <span className="text-white/60">{playTimeSeconds.toFixed(0)}s</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px]">
                    <span className="text-white/30">失败次数</span>
                    <span className="text-white/60">{failureCount}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px]">
                    <span className="text-white/30">信号调整</span>
                    <span className="text-white/60">{adjustmentHistory.length} 次</span>
                  </div>
                </div>
                <p className="mb-3 text-xs text-white/30">
                  调整信号灯策略后重试
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="rounded bg-white/5 px-4 py-2 font-['Orbitron'] text-xs text-white/60 transition hover:bg-white/10"
                  >
                    返回主页
                  </button>
                  <button
                    onClick={() => {
                      completedRef.current = false;
                      restartLevel();
                    }}
                    className="rounded bg-[#e74c3c]/20 px-4 py-2 font-['Orbitron'] text-xs text-[#e74c3c] transition hover:bg-[#e74c3c]/30"
                  >
                    重试
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
