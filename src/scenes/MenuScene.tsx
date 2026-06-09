import { useEffect, useState } from 'react';
import {
  Play,
  Gamepad2,
  FlaskConical,
  Settings,
  BarChart3,
  RotateCcw,
  ChevronRight,
  Clock,
  Star,
  Trophy,
  X,
  FolderArchive,
} from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import useUIStore from '@/store/useUIStore';
import AudioTrigger from '@/core/AudioTrigger';
import { LEVELS } from '@/data/levelData';

interface SceneProps {
  onEnter?: () => void;
  onExit?: () => void;
}

const audio = AudioTrigger.getInstance();

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export default function MenuScene({ onEnter, onExit }: SceneProps) {
  const { hasSave, saveData, loadSave, setScene, setCurrentLevel, resetAll } = useGameStore();
  const { openModal, closeModal } = useUIStore();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    loadSave();
    onEnter?.();
    return () => onExit?.();
  }, []);

  const handleBtnClick = (scene: 'level-select' | 'sandbox' | 'settings' | 'saved-circuits') => {
    audio.playClick();
    if (scene === 'sandbox') {
      setCurrentLevel(null);
    }
    setScene(scene);
  };

  const handleContinue = () => {
    if (!hasSave) return;
    audio.playClick();
    const lastStarred = Object.keys(saveData.progress.levelStars).pop();
    if (lastStarred) {
      const idx = LEVELS.findIndex((l) => l.id === lastStarred);
      const nextId = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1].id : lastStarred;
      setCurrentLevel(nextId);
    }
    setScene('sandbox');
  };

  const showStats = () => {
    audio.playClick();
    const { progress, analytics } = saveData;
    const completedLevels = Object.keys(progress.levelStars).filter(
      (id) => progress.levelStars[id] > 0
    ).length;
    const totalStars = (Object.values(progress.levelStars) as number[]).reduce((a, b) => a + b, 0);
    const levelsAttempted = Object.keys(analytics.levelsAttempted).length;

    openModal({
      title: '📊 数据统计',
      content: (
        <div className="space-y-4 font-mono text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-circuit-board p-3 rounded border border-circuit-border">
              <div className="text-gray-400 text-xs mb-1">总游戏时长</div>
              <div className="text-circuit-current text-lg flex items-center gap-2">
                <Clock size={18} />
                {formatTime(analytics.totalPlayTime)}
              </div>
            </div>
            <div className="bg-circuit-board p-3 rounded border border-circuit-border">
              <div className="text-gray-400 text-xs mb-1">完成关卡</div>
              <div className="text-circuit-bulb text-lg flex items-center gap-2">
                <Trophy size={18} />
                {completedLevels} / {LEVELS.length}
              </div>
            </div>
            <div className="bg-circuit-board p-3 rounded border border-circuit-border">
              <div className="text-gray-400 text-xs mb-1">总星星数</div>
              <div className="text-circuit-bulb text-lg flex items-center gap-2">
                <Star size={18} fill="#ffb347" />
                {totalStars} / {LEVELS.length * 3}
              </div>
            </div>
            <div className="bg-circuit-board p-3 rounded border border-circuit-border">
              <div className="text-gray-400 text-xs mb-1">尝试关卡数</div>
              <div className="text-circuit-current text-lg flex items-center gap-2">
                <Gamepad2 size={18} />
                {levelsAttempted}
              </div>
            </div>
            <div className="bg-circuit-board p-3 rounded border border-circuit-border col-span-2">
              <div className="text-gray-400 text-xs mb-1">电路构建</div>
              <div className="flex justify-between text-white">
                <span>放置元件: {analytics.componentsPlaced} 个</span>
                <span>绘制导线: {analytics.wiresDrawn} 条</span>
              </div>
            </div>
          </div>
        </div>
      ),
      showCancel: false,
      confirmText: '关闭',
      onConfirm: () => closeModal(''),
    });
  };

  const handleReset = () => {
    audio.playClick();
    openModal({
      title: '⚠️ 确认重置',
      type: 'danger',
      content: (
        <div className="space-y-3 font-mono text-sm">
          <p className="text-circuit-error">此操作将删除所有游戏进度！</p>
          <ul className="text-gray-300 space-y-1 list-disc list-inside">
            <li>所有关卡进度和星星</li>
            <li>游戏统计数据</li>
            <li>所有保存的电路方案</li>
            <li>设置将恢复默认</li>
          </ul>
          <p className="text-yellow-400">此操作无法撤销，确定继续吗？</p>
        </div>
      ),
      confirmText: '确认重置',
      cancelText: '取消',
      onConfirm: () => {
        audio.playError();
        resetAll();
        closeModal('');
      },
      onCancel: () => closeModal(''),
    });
  };

  const savedCircuitsCount = saveData.savedCircuits.length;

  const menuButtons = [
    {
      id: 'continue',
      icon: Play,
      label: '继续游戏',
      disabled: !hasSave,
      onClick: handleContinue,
      color: 'current',
      badge: 0,
    },
    {
      id: 'level',
      icon: Gamepad2,
      label: '关卡模式',
      onClick: () => handleBtnClick('level-select'),
      color: 'current',
      badge: 0,
    },
    {
      id: 'sandbox',
      icon: FlaskConical,
      label: '自由模式',
      onClick: () => handleBtnClick('sandbox'),
      color: 'current',
      badge: 0,
    },
    {
      id: 'saved-circuits',
      icon: FolderArchive,
      label: '我的电路方案',
      onClick: () => handleBtnClick('saved-circuits'),
      color: 'current',
      badge: savedCircuitsCount,
    },
    {
      id: 'settings',
      icon: Settings,
      label: '设置',
      onClick: () => handleBtnClick('settings'),
      color: 'current',
      badge: 0,
    },
    {
      id: 'stats',
      icon: BarChart3,
      label: '数据统计',
      onClick: showStats,
      color: 'current',
      badge: 0,
    },
    {
      id: 'reset',
      icon: RotateCcw,
      label: '重置所有进度',
      onClick: handleReset,
      color: 'error',
      badge: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-circuit-bg text-white font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,212,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          animation: 'moveGrid 20s linear infinite',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      <style>{`
        @keyframes moveGrid {
          0% { transform: translate(0, 0); }
          100% { transform: translate(24px, 24px); }
        }
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
        .screw-border::before {
          top: -7px;
          left: -7px;
        }
        .screw-border::after {
          bottom: -7px;
          right: -7px;
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between py-10 px-4">
        <header className="text-center space-y-4 w-full max-w-2xl">
          <h1
            className="font-pixel text-3xl md:text-4xl lg:text-5xl text-circuit-current"
            style={{
              textShadow:
                '0 0 10px rgba(0,212,255,0.8), 0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.3)',
            }}
          >
            电路沙盒
          </h1>
          <p className="text-gray-500 text-sm">教育模拟 · 非专业工程工具</p>
          <div className="h-8 flex items-center justify-center gap-1">
            <svg
              width="300"
              height="30"
              viewBox="0 0 300 30"
              className="opacity-60"
            >
              <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,15 Q25,5 50,15 T100,15 T150,15 T200,15 T250,15 T300,15"
                stroke="url(#waveGrad)"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="0" cy="15" r="3" fill="#00d4ff" opacity="0.8">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M0,15 Q25,5 50,15 T100,15 T150,15 T200,15 T250,15 T300,15"
                />
              </circle>
              <circle cx="0" cy="15" r="2" fill="#ffb347" opacity="0.9">
                <animateMotion
                  dur="6s"
                  repeatCount="indefinite"
                  path="M0,15 Q25,5 50,15 T100,15 T150,15 T200,15 T250,15 T300,15"
                />
              </circle>
            </svg>
          </div>
        </header>

        <main className="flex-1 w-full max-w-md flex items-center py-8">
          <div className="screw-border w-full bg-circuit-panel rounded-lg p-6 space-y-3">
            {menuButtons.map((btn) => {
              const Icon = btn.icon;
              const isError = btn.color === 'error';
              const borderColor = isError
                ? 'border-circuit-error'
                : 'border-circuit-border hover:border-circuit-current';
              const textColor = isError
                ? 'text-circuit-error'
                : btn.disabled
                ? 'text-gray-600'
                : 'text-white';
              const iconColor = isError
                ? 'text-circuit-error'
                : btn.disabled
                ? 'text-gray-600'
                : 'text-circuit-current';

              return (
                <button
                  key={btn.id}
                  disabled={btn.disabled}
                  onClick={btn.onClick}
                  onMouseEnter={() => !btn.disabled && setHoveredBtn(btn.id)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className={`
                    w-full flex items-center gap-4 px-5 py-4 rounded relative
                    border-2 ${borderColor}
                    bg-circuit-board/60 hover:bg-circuit-board
                    transition-all duration-150
                    ${btn.disabled ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-[2px] active:shadow-inset-panel cursor-pointer'}
                    ${textColor}
                  `}
                >
                  <Icon size={22} className={iconColor} />
                  <span className="flex-1 text-left font-pixel text-sm">
                    {btn.label}
                  </span>
                  {btn.badge > 0 && (
                    <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center
                      bg-circuit-error text-white text-xs font-pixel rounded-full
                      shadow-[0_0_8px_rgba(248,113,113,0.6)]">
                      {btn.badge > 99 ? '99+' : btn.badge}
                    </span>
                  )}
                  {hoveredBtn === btn.id && !btn.disabled && (
                    <ChevronRight
                      size={20}
                      className={`animate-pulse ${
                        isError ? 'text-circuit-error' : 'text-circuit-bulb'
                      } ${btn.badge > 0 ? 'mr-6' : ''}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </main>

        <footer className="text-center space-y-2 text-xs text-gray-600 font-mono w-full">
          <div className="flex items-center justify-center gap-4">
            <span>v1.0.0</span>
            <span className="text-circuit-current">●</span>
            <span>点击按钮开始...</span>
          </div>
          <div>© 2026 Circuit Lab MFG.</div>
        </footer>
      </div>
    </div>
  );
}
