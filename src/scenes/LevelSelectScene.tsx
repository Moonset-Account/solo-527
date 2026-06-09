import { useEffect } from 'react';
import { ArrowLeft, Lock, Star, Clock } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import useUIStore from '@/store/useUIStore';
import AudioTrigger from '@/core/AudioTrigger';
import { LEVELS, isLevelUnlocked } from '@/data/levelData';
import type { Difficulty } from '@/game/types';

interface SceneProps {
  onEnter?: () => void;
  onExit?: () => void;
}

const audio = AudioTrigger.getInstance();

const difficultyConfig: Record<
  Difficulty,
  { label: string; bg: string; text: string; border: string }
> = {
  tutorial: {
    label: '教程',
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-400',
    border: 'border-emerald-600/50',
  },
  easy: {
    label: '简单',
    bg: 'bg-green-900/40',
    text: 'text-green-400',
    border: 'border-green-600/50',
  },
  medium: {
    label: '中等',
    bg: 'bg-yellow-900/40',
    text: 'text-yellow-400',
    border: 'border-yellow-600/50',
  },
  hard: {
    label: '困难',
    bg: 'bg-red-900/40',
    text: 'text-red-400',
    border: 'border-red-600/50',
  },
};

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LevelSelectScene({ onEnter, onExit }: SceneProps) {
  const { saveData, loadSave, setScene, setCurrentLevel } = useGameStore();
  const { pushNotification } = useUIStore();

  useEffect(() => {
    loadSave();
    onEnter?.();
    return () => onExit?.();
  }, []);

  const { progress } = saveData;

  const totalStars = (Object.values(progress.levelStars) as number[]).reduce((a, b) => a + b, 0);
  const maxStars = LEVELS.length * 3;
  const completedCount = Object.values(progress.levelStars).filter(
    (s) => s > 0
  ).length;
  const progressPercent = Math.round((completedCount / LEVELS.length) * 100);

  const handleBack = () => {
    audio.playClick();
    setScene('menu');
  };

  const handleLevelClick = (levelId: string) => {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    const unlocked = isLevelUnlocked(progress, levelId);
    if (!unlocked) {
      audio.playError();
      pushNotification({
        type: 'warning',
        title: '🔒 关卡未解锁',
        message: '请先完成前置关卡',
      });
      return;
    }
    audio.playClick();
    setCurrentLevel(levelId);
    setScene('sandbox');
  };

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
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-8">
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-3 rounded border-2 border-circuit-border
              hover:border-circuit-current bg-circuit-board/60 hover:bg-circuit-board
              transition-all active:translate-y-[2px] active:shadow-inset-panel"
          >
            <ArrowLeft size={20} className="text-circuit-current" />
            <span className="font-pixel text-sm">返回</span>
          </button>
          <h1
            className="font-pixel text-2xl md:text-3xl text-circuit-current flex-1 text-center"
            style={{
              textShadow:
                '0 0 10px rgba(0,212,255,0.6), 0 0 20px rgba(0,212,255,0.3)',
            }}
          >
            选择关卡
          </h1>
          <div className="w-[110px]" />
        </header>

        <div className="screw-border bg-circuit-panel rounded-lg p-4 mb-6 max-w-4xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Star size={24} fill="#ffb347" className="text-circuit-bulb" />
              <div>
                <div className="text-xs text-gray-400">总进度</div>
                <div className="font-pixel text-circuit-bulb">
                  {totalStars} / {maxStars} ★ ({progressPercent}%)
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-circuit-board rounded-full overflow-hidden border border-circuit-border">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      'linear-gradient(90deg, #00d4ff, #ffb347)',
                    boxShadow: '0 0 10px rgba(0,212,255,0.5)',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-400">
                已完成:{' '}
                <span className="text-circuit-current">{completedCount}</span>/
                {LEVELS.length}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {LEVELS.map((level) => {
              const unlocked = isLevelUnlocked(progress, level.id);
              const stars = progress.levelStars[level.id] || 0;
              const bestTime = progress.levelBestTimes[level.id];
              const completed = stars > 0;
              const diffCfg = difficultyConfig[level.difficulty];

              return (
                <button
                  key={level.id}
                  onClick={() => handleLevelClick(level.id)}
                  disabled={!unlocked}
                  className={`
                    screw-border relative p-4 rounded-lg text-left
                    transition-all duration-200
                    ${!unlocked
                      ? 'bg-gray-900/80 cursor-not-allowed'
                      : completed
                      ? 'bg-circuit-panel hover:bg-circuit-panel/90 cursor-pointer'
                      : 'bg-circuit-board/60 hover:bg-circuit-board cursor-pointer'
                    }
                    ${completed ? 'shadow-neon-bulb border-circuit-bulb/50' : ''}
                    ${!unlocked ? 'opacity-70' : 'active:translate-y-[2px]'}
                  `}
                  style={
                    completed
                      ? {
                          boxShadow:
                            '0 0 0 2px #1a1a2e, 0 0 0 4px rgba(255,179,71,0.4), 0 0 20px rgba(255,179,71,0.15), inset 0 0 30px rgba(255,179,71,0.05)',
                        }
                      : undefined
                  }
                >
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
                      <Lock size={36} className="text-gray-500" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="font-pixel text-circuit-current text-lg">
                      #{level.order.toString().padStart(3, '0')}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${diffCfg.bg} ${diffCfg.text} ${diffCfg.border} font-pixel`}
                    >
                      {diffCfg.label}
                    </span>
                  </div>

                  <div className="font-pixel text-sm mb-2 text-white min-h-[2.5rem] line-clamp-2">
                    {level.name}
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i <= stars ? 'text-circuit-bulb' : 'text-gray-600'}
                        fill={i <= stars ? '#ffb347' : 'none'}
                      />
                    ))}
                  </div>

                  {bestTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>最佳: {formatTime(bestTime)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
