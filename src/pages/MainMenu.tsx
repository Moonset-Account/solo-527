import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Beaker,
  BarChart3,
  BookOpen,
  Clock,
  Trophy,
  Target,
  RotateCcw,
} from 'lucide-react';
import { saveManager } from '@/game/SaveManager';

interface TotalStats {
  totalPlayTime: number;
  tutorialCompleted: boolean;
  tutorialSkipped: boolean;
  completedLevels: number;
  totalAttempts: number;
  totalFailures: number;
  avgAttemptsPerLevel: number;
  bestScore: number;
}

function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}时${m}分`;
  return `${m}分钟`;
}

export default function MainMenu() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TotalStats>(saveManager.getTotalStats());
  const [resetConfirm, setResetConfirm] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(saveManager.getTotalStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (resetConfirm) {
      saveManager.clear();
      setStats(saveManager.getTotalStats());
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const modeCards = [
    {
      id: 'levels',
      icon: Play,
      title: '关卡模式',
      subtitle: '5关闯关游戏',
      description: '循序渐进的交通调度挑战',
      path: '/levels',
      gradient: 'from-cyan-500 to-blue-600',
      accent: 'cyan',
    },
    {
      id: 'sandbox',
      icon: Beaker,
      title: '沙盒模式',
      subtitle: '自由配时实验',
      description: '无限制探索信号灯策略',
      path: '/sandbox',
      gradient: 'from-amber-500 to-orange-600',
      accent: 'amber',
    },
    {
      id: 'statistics',
      icon: BarChart3,
      title: '数据统计',
      subtitle: '查看游玩数据',
      description: '全面的表现分析报告',
      path: '/statistics',
      gradient: 'from-emerald-500 to-teal-600',
      accent: 'emerald',
    },
    {
      id: 'tutorial',
      icon: BookOpen,
      title: '游戏说明',
      subtitle: '玩法教学',
      description: '了解信号灯调度基础',
      path: '#',
      gradient: 'from-purple-500 to-indigo-600',
      accent: 'purple',
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a1628]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#071020]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }}
      />
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
          animation: 'pulse 10s ease-in-out infinite reverse',
        }}
      />

      <button
        onClick={handleReset}
        className={`absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
          resetConfirm
            ? 'bg-red-600/90 border-red-400 text-white shadow-lg shadow-red-500/30'
            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-amber-500/50 hover:text-amber-400'
        }`}
      >
        <RotateCcw className="w-4 h-4" />
        <span className="text-sm font-medium">
          {resetConfirm ? '再次确认重置' : '重置存档'}
        </span>
      </button>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-5 py-2 mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
            <span className="text-cyan-400 text-sm tracking-widest uppercase">
              System Online
            </span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-4 tracking-tight"
            style={{
              fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #22d3ee 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(34, 211, 238, 0.3)',
            }}
          >
            星城交通指挥中心
          </h1>
          <h2
            className="text-2xl md:text-3xl font-semibold mb-4 tracking-wider text-cyan-300"
            style={{ fontFamily: "'Orbitron', 'Rajdhani', sans-serif" }}
          >
            TRAFFIC COMMAND
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            调度信号灯 · 优化车流量 · 成为最出色的交通指挥官
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-12">
          {modeCards.map((card) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;
            return (
              <button
                key={card.id}
                onClick={() => card.path !== '#' && navigate(card.path)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all duration-500 ${
                  isHovered
                    ? 'border-white/30 scale-[1.02] shadow-2xl'
                    : 'border-white/10 hover:border-white/20'
                } bg-white/[0.03] backdrop-blur-sm`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />
                <div
                  className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                />

                <div className="relative z-10 flex items-start gap-5">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                      {card.title}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full bg-${card.accent}-500/20 text-${card.accent}-400 border border-${card.accent}-500/30`}
                      >
                        {card.subtitle}
                      </span>
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{card.description}</p>
                    <div
                      className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                        isHovered ? 'text-white translate-x-1' : 'text-gray-500'
                      }`}
                    >
                      <span>
                        {card.id === 'tutorial' ? '即将开放' : '进入模式'}
                      </span>
                      {card.id !== 'tutorial' && (
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isHovered ? 'translate-x-1' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="w-full max-w-4xl">
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: 'linear-gradient(90deg, #06b6d4, #f59e0b, #06b6d4)',
              }}
            />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">指挥官档案</h3>
                <p className="text-xs text-gray-500">Commander Profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group rounded-xl border border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent p-4 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-colors">
                    <Clock className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    总游玩时间
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatPlayTime(stats.totalPlayTime)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Total Playtime</div>
              </div>

              <div className="group rounded-xl border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                    <Trophy className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    完成关卡
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <span className="text-emerald-400">{stats.completedLevels}</span>
                  <span className="text-gray-600 text-lg font-normal"> / 5</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">Levels Completed</div>
              </div>

              <div className="group rounded-xl border border-white/5 bg-gradient-to-br from-amber-500/5 to-transparent p-4 hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
                    <Target className="w-4.5 h-4.5 text-amber-400" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    最佳分数
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.bestScore.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Best Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>公交系统运行中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>信号灯待命中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>道路网络畅通</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
