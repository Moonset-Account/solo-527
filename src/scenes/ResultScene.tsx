import { useEffect, useState } from 'react';
import {
  RotateCcw,
  SkipForward,
  Save,
  ArrowLeftRight,
  Star,
  Clock,
  PlugZap,
  Shapes,
  XCircle,
  RefreshCw,
  Home,
} from 'lucide-react';
import useGameStore, { type ResultPayload } from '@/store/useGameStore';
import useUIStore from '@/store/useUIStore';
import AudioTrigger from '@/core/AudioTrigger';
import { getLevelById, getNextLevelId } from '@/data/levelData';
import type { SavedCircuit } from '@/game/types';

interface SceneProps {
  onEnter?: () => void;
  onExit?: () => void;
}

const audio = AudioTrigger.getInstance();

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

const errorLabels: Record<string, string> = {
  short_circuit: '短路',
  no_power: '无电源',
  wrong_component: '错误元件',
  disconnected: '断路',
  other: '其他',
};

export default function ResultScene({ onEnter, onExit }: SceneProps) {
  const {
    currentLevelId,
    resultPayload,
    setScene,
    setCurrentLevel,
    saveCircuit,
  } = useGameStore();
  const { pushNotification } = useUIStore();
  const [starsAnimated, setStarsAnimated] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);

  const defaultPayload: ResultPayload = {
    timeSpent: 45230,
    stars: 3,
    usedComponents: 5,
    wiresCount: 4,
    failures: 1,
    retries: 0,
    errorDistribution: { short_circuit: 1, disconnected: 0, no_power: 0 },
  };

  const payload: ResultPayload = resultPayload || defaultPayload;
  const level = currentLevelId ? getLevelById(currentLevelId) : undefined;
  const nextLevelId = currentLevelId ? getNextLevelId(currentLevelId) : null;
  const isSuccess = payload.stars > 0;
  const isPerfect = payload.stars === 3;

  useEffect(() => {
    onEnter?.();
    setTimeout(() => setStarsAnimated(true), 300);
    return () => onExit?.();
  }, []);

  useEffect(() => {
    if (!soundPlayed && starsAnimated) {
      if (isSuccess) {
        audio.playSuccess();
        if (isPerfect) {
          setTimeout(() => audio.playStarEarned(3), 400);
        } else if (payload.stars === 2) {
          setTimeout(() => audio.playStarEarned(2), 400);
        } else {
          setTimeout(() => audio.playStarEarned(1), 400);
        }
      } else {
        audio.playError();
      }
      setSoundPlayed(true);
    }
  }, [starsAnimated]);

  const handleRetry = () => {
    audio.playClick();
    if (currentLevelId) {
      setCurrentLevel(currentLevelId);
    }
    setScene('sandbox');
  };

  const handleNextLevel = () => {
    if (!nextLevelId) return;
    audio.playClick();
    setCurrentLevel(nextLevelId);
    setScene('sandbox');
  };

  const handleSaveCircuit = () => {
    audio.playClick();
    const newCircuit: SavedCircuit = {
      id: `circuit-${Date.now()}`,
      name: level
        ? `${level.name} - ${new Date().toLocaleDateString()}`
        : `方案 ${new Date().toLocaleString()}`,
      levelId: currentLevelId || undefined,
      createdAt: Date.now(),
      thumbnail: '',
      circuit: { components: [], wires: [] },
    };
    saveCircuit(newCircuit);
    pushNotification({
      type: 'success',
      title: '💾 方案已保存',
      message: '当前电路方案已存入存档',
    });
  };

  const handleBackToLevels = () => {
    audio.playClick();
    setScene('level-select');
  };

  const totalErrors = Object.values(payload.errorDistribution || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="min-h-screen bg-circuit-bg text-white font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,212,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <style>{`
        .screw-border {
          position: relative;
          border: 2px solid #2d3a5c;
          box-shadow:
            0 0 0 2px #1a1a2e,
            0 0 0 4px #2d3a5c,
            inset 0 0 30px rgba(0,212,255,0.05);
        }
        .screw-border::before,
        .screw-border::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: #445;
          border-radius: 50%;
          box-shadow: inset 0 0 4px #000;
        }
        .screw-border::before { top: -7px; left: -7px; }
        .screw-border::after { bottom: -7px; right: -7px; }
        @keyframes popIn {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          60% { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .star-pop {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <header className="text-center space-y-3">
            <div className="text-sm text-gray-500">
              {level ? `第 ${level.order.toString().padStart(3, '0')} 关 · ${level.name}` : '演示模式'}
            </div>
            <h1
              className={`font-pixel text-2xl md:text-4xl ${
                isSuccess ? 'text-circuit-bulb' : 'text-circuit-error'
              }`}
              style={{
                textShadow: isSuccess
                  ? '0 0 10px rgba(255,179,71,0.8), 0 0 20px rgba(255,179,71,0.5), 0 0 40px rgba(255,179,71,0.25)'
                  : '0 0 10px rgba(248,113,113,0.8), 0 0 20px rgba(248,113,113,0.5)',
              }}
            >
              {isSuccess ? '🎉 关卡完成！' : '🔧 再来一次！'}
            </h1>
            {isPerfect && (
              <p
                className="font-pixel text-lg text-circuit-bulb animate-pulse"
                style={{
                  textShadow: '0 0 10px rgba(255,179,71,0.6)',
                }}
              >
                ⭐⭐⭐ 完美通关！
              </p>
            )}
            {!isSuccess && (
              <p className="text-gray-400 text-sm">检查电路连接，调整后再试一次</p>
            )}
          </header>

          <div className="screw-border bg-circuit-panel rounded-lg p-8">
            <div className="flex items-center justify-center gap-6">
              {[1, 2, 3].map((i) => {
                const lit = i <= payload.stars;
                return (
                  <div
                    key={i}
                    className={starsAnimated ? 'star-pop' : 'opacity-0'}
                    style={{
                      animationDelay: `${i * 0.15}s`,
                    }}
                  >
                    <Star
                      size={80}
                      className={lit ? 'text-circuit-bulb' : 'text-gray-700'}
                      fill={lit ? '#ffb347' : 'none'}
                      style={
                        lit
                          ? {
                              filter:
                                'drop-shadow(0 0 15px rgba(255,179,71,0.8)) drop-shadow(0 0 30px rgba(255,179,71,0.4))',
                            }
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="screw-border bg-circuit-panel rounded-lg p-6 space-y-4">
            <h3 className="font-pixel text-sm text-circuit-current border-b border-circuit-current/30 pb-2">
              📊 数据统计
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Clock size={14} /> 耗时
                </div>
                <div className="font-pixel text-circuit-current text-lg">
                  {formatTime(payload.timeSpent)}
                </div>
              </div>
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <PlugZap size={14} /> 使用元件
                </div>
                <div className="font-pixel text-white text-lg">
                  {payload.usedComponents} 个
                </div>
              </div>
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Shapes size={14} /> 连线数
                </div>
                <div className="font-pixel text-white text-lg">
                  {payload.wiresCount} 条
                </div>
              </div>
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <XCircle size={14} /> 失败次数
                </div>
                <div
                  className={`font-pixel text-lg ${
                    payload.failures > 0 ? 'text-circuit-error' : 'text-green-400'
                  }`}
                >
                  {payload.failures} 次
                </div>
              </div>
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <RefreshCw size={14} /> 重试次数
                </div>
                <div
                  className={`font-pixel text-lg ${
                    payload.retries > 0 ? 'text-yellow-400' : 'text-green-400'
                  }`}
                >
                  {payload.retries} 次
                </div>
              </div>
              <div className="bg-circuit-board rounded p-3 border border-circuit-border">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Star size={14} /> 获得星星
                </div>
                <div className="font-pixel text-circuit-bulb text-lg">
                  {payload.stars} / 3
                </div>
              </div>
            </div>

            {totalErrors > 0 && payload.errorDistribution && (
              <div className="mt-4 pt-4 border-t border-circuit-border">
                <h4 className="text-sm text-circuit-error mb-3 font-pixel">
                  ⚠️ 错误类型分布
                </h4>
                <div className="space-y-2">
                  {Object.entries(payload.errorDistribution).map(([type, count]) => {
                    const pct = totalErrors > 0 ? (count / totalErrors) * 100 : 0;
                    const label = errorLabels[type] || type;
                    if (count === 0) return null;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">{label}</span>
                          <span className="text-gray-500">
                            {count} 次 ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-circuit-board rounded overflow-hidden border border-circuit-border">
                          <div
                            className="h-full rounded transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              background:
                                type === 'short_circuit'
                                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                                  : type === 'no_power'
                                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                  : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                              boxShadow:
                                type === 'short_circuit'
                                  ? '0 0 8px rgba(248,113,113,0.5)'
                                  : undefined,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="screw-border bg-circuit-panel rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleRetry}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded border-2 border-circuit-current/50
                  bg-circuit-board hover:bg-circuit-current/10 text-circuit-current
                  transition-all active:translate-y-[2px] font-pixel text-xs"
              >
                <RotateCcw size={24} />
                <span>重玩本关</span>
              </button>

              <button
                onClick={handleNextLevel}
                disabled={!nextLevelId || !isSuccess}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded border-2
                  transition-all font-pixel text-xs
                  ${
                    nextLevelId && isSuccess
                      ? 'border-circuit-bulb/60 bg-circuit-board hover:bg-circuit-bulb/10 text-circuit-bulb active:translate-y-[2px] cursor-pointer'
                      : 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed'
                  }`}
              >
                <SkipForward size={24} />
                <span>下一关</span>
              </button>

              <button
                onClick={handleSaveCircuit}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded border-2 border-green-600/50
                  bg-circuit-board hover:bg-green-600/10 text-green-400
                  transition-all active:translate-y-[2px] font-pixel text-xs"
              >
                <Save size={24} />
                <span>保存方案</span>
              </button>

              <button
                onClick={handleBackToLevels}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded border-2 border-circuit-border
                  bg-circuit-board hover:bg-circuit-panel text-white
                  transition-all active:translate-y-[2px] font-pixel text-xs"
              >
                <Home size={24} />
                <span>返回选关</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
