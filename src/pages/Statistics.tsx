import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Trophy,
  Target,
  Crosshair,
  AlertTriangle,
  BookOpen,
  PlayCircle,
  Trash2,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  GraduationCap,
  SkipForward,
  X,
  Radar as RadarIcon,
  BarChart3,
  Clock3,
  TrendingDown,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { saveManager } from '@/game/SaveManager';
import { LEVELS } from '@/data/levels/levels';
import type { LevelRecord, ReplayData } from '@/types';

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

interface FailureEntry {
  levelId: string;
  levelName: string;
  reason: string;
  timestamp: number;
}

function formatPlayTimeHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '从未';
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return formatDateTime(timestamp);
}

function getDifficultyStars(level: number): string {
  return '⭐'.repeat(level);
}

export default function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TotalStats>(saveManager.getTotalStats());
  const [replays, setReplays] = useState<ReplayData[]>(saveManager.getReplays());
  const [showExportModal, setShowExportModal] = useState(false);
  const [clearConfirmStep, setClearConfirmStep] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setStats(saveManager.getTotalStats());
      setReplays(saveManager.getReplays());
    };
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(handleUpdate, 2000);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const levelRecords = LEVELS.map((level) => ({
    level,
    record: saveManager.getLevelRecord(level.id) as LevelRecord,
  }));

  const failureTimeline: FailureEntry[] = (() => {
    const entries: FailureEntry[] = [];
    LEVELS.forEach((level) => {
      const record = saveManager.getLevelRecord(level.id) as LevelRecord;
      record.failureReasons.forEach((reason) => {
        entries.push({
          levelId: level.id,
          levelName: level.name,
          reason,
          timestamp: record.lastPlayedAt,
        });
      });
    });
    return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  })();

  const radarData = levelRecords.map(({ level, record }) => ({
    subject: level.name,
    score: record.bestScore || 0,
    fullMark: 10000,
  }));

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleDownloadJSON = () => {
    const json = saveManager.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-sim-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(saveManager.export());
    } catch {
      // ignore
    }
  };

  const handleClearSave = () => {
    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
      setTimeout(() => setClearConfirmStep(0), 5000);
    } else if (clearConfirmStep === 1) {
      setClearConfirmStep(2);
      setTimeout(() => setClearConfirmStep(0), 5000);
    } else {
      saveManager.clear();
      setStats(saveManager.getTotalStats());
      setReplays(saveManager.getReplays());
      setClearConfirmStep(0);
    }
  };

  const handleDeleteReplay = (replayId: string) => {
    if (deleteConfirm === replayId) {
      saveManager.deleteReplay(replayId);
      setReplays(saveManager.getReplays());
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(replayId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getLevelName = (levelId: string): string => {
    return LEVELS.find((l) => l.id === levelId)?.name || levelId;
  };

  const completedCount = stats.completedLevels;
  const progressPercent = (completedCount / LEVELS.length) * 100;

  const statCards = [
    {
      icon: Clock,
      label: '总游玩时长',
      sublabel: 'Total Playtime',
      value: formatPlayTimeHMS(stats.totalPlayTime),
      gradient: 'from-cyan-500 via-sky-500 to-blue-600',
      glow: 'shadow-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      accent: 'cyan',
    },
    {
      icon: Trophy,
      label: '完成关卡',
      sublabel: 'Levels Completed',
      value: `${completedCount} / ${LEVELS.length}`,
      progress: progressPercent,
      gradient: 'from-emerald-500 via-teal-500 to-green-600',
      glow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      accent: 'emerald',
    },
    {
      icon: Target,
      label: '最佳分数',
      sublabel: 'Best Score',
      value: stats.bestScore.toLocaleString(),
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      glow: 'shadow-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      accent: 'amber',
    },
    {
      icon: Crosshair,
      label: '平均尝试次数',
      sublabel: 'Avg Attempts',
      value: stats.avgAttemptsPerLevel.toFixed(1),
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      glow: 'shadow-violet-500/30',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
      accent: 'violet',
    },
  ];

  return (
    <div
      className="min-h-screen w-full pb-16"
      style={{ backgroundColor: '#0a1628' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-white/5 border border-white/10 text-white/80
                       hover:bg-white/10 hover:text-white
                       transition-all duration-300 backdrop-blur-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">返回首页</span>
          </button>

          <div className="text-center">
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{
                fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #22d3ee 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              数据统计中心
            </h1>
            <p className="text-xs md:text-sm text-gray-500 tracking-widest uppercase mt-0.5">
              Statistics Dashboard
            </p>
          </div>

          <div className="w-[130px]" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-white/10
                           bg-white/[0.03] backdrop-blur-sm p-5 md:p-6
                           hover:border-white/20 hover:-translate-y-0.5
                           transition-all duration-300 group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0
                              group-hover:opacity-5 transition-opacity duration-500`}
                />
                <div
                  className={`absolute -top-16 -right-16 w-32 h-32 rounded-full
                              bg-gradient-to-br ${card.gradient} opacity-0
                              group-hover:opacity-20 blur-2xl transition-opacity duration-500`}
                />
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient} opacity-60`}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${card.iconBg}
                                  flex items-center justify-center
                                  group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${card.iconColor}`} />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {card.label}
                  </div>
                  <div
                    className="text-2xl md:text-3xl font-bold text-white mb-1"
                    style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}
                  >
                    {card.value}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-600 mb-3">
                    {card.sublabel}
                  </div>

                  {card.progress !== undefined && (
                    <div className="mt-3">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${card.gradient}
                                      transition-all duration-1000 ease-out`}
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
                        <span>进度</span>
                        <span className={card.iconColor}>{card.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tutorial Stats */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20
                            border border-purple-500/30 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">教程统计</h2>
              <p className="text-xs text-gray-500">Tutorial Status</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stats.tutorialCompleted
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-gray-500/10 border border-gray-500/20'
                  }`}
                >
                  {stats.tutorialCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">教程完成状态</div>
                  <div
                    className={`text-base font-semibold ${
                      stats.tutorialCompleted ? 'text-emerald-400' : 'text-gray-500'
                    }`}
                  >
                    {stats.tutorialCompleted ? '已完成' : '未完成'}
                  </div>
                </div>
              </div>

              <div className="h-10 w-px bg-white/10 hidden md:block" />

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stats.tutorialSkipped
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : 'bg-gray-500/10 border border-gray-500/20'
                  }`}
                >
                  {stats.tutorialSkipped ? (
                    <SkipForward className="w-5 h-5 text-amber-400" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-400">完成方式</div>
                  <div
                    className={`text-base font-semibold ${
                      stats.tutorialSkipped ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {stats.tutorialCompleted
                      ? stats.tutorialSkipped
                        ? '跳过完成'
                        : '完整学习'
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          {/* Level Progress */}
          <div className="xl:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                              border border-cyan-500/30 flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">关卡进度</h2>
                <p className="text-xs text-gray-500">Level Progress</p>
              </div>
            </div>

            <div className="space-y-3">
              {levelRecords.map(({ level, record }, idx) => (
                <div
                  key={level.id}
                  className={`relative overflow-hidden rounded-xl border p-4
                              bg-white/[0.03] backdrop-blur-sm transition-all duration-300
                              ${
                                record.completed
                                  ? 'border-emerald-500/20 hover:border-emerald-500/40'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                >
                  {record.completed && (
                    <div
                      className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-cyan-500"
                    />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                                  text-lg font-bold ${
                                    record.completed
                                      ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                      : 'bg-white/10 text-white/70 border border-white/10'
                                  }`}
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-white">{level.name}</h3>
                        <span className="text-[10px]">{getDifficultyStars(level.difficulty)}</span>
                        {record.completed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                                           bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> 已通关
                          </span>
                        ) : record.attempts > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                                           bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> 挑战中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                                           bg-gray-500/10 text-gray-500 border border-gray-500/20">
                            <XCircle className="w-3 h-3" /> 未开始
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">最佳分数</div>
                          <div className="text-sm font-bold text-cyan-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {record.bestScore || '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">尝试次数</div>
                          <div className="text-sm font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {record.attempts}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">失败次数</div>
                          <div className="text-sm font-bold text-rose-400" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {record.failures}
                          </div>
                        </div>
                      </div>

                      {record.failureReasons.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <TrendingDown className="w-3 h-3 text-rose-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500">最近失败：</span>
                            <span className="text-rose-300/80 line-clamp-1">
                              {record.failureReasons[record.failureReasons.length - 1]}
                            </span>
                          </div>
                        </div>
                      )}

                      {record.lastPlayedAt > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 mt-1.5">
                          <Clock3 className="w-3 h-3" />
                          <span>最近游玩：{formatRelativeTime(record.lastPlayedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="xl:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20
                              border border-violet-500/30 flex items-center justify-center">
                <RadarIcon className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">分数雷达图</h2>
                <p className="text-xs text-gray-500">Score Radar Chart</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11,
                      fontFamily: "'Rajdhani', sans-serif",
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 'auto']}
                    tick={{
                      fill: '#475569',
                      fontSize: 9,
                    }}
                    axisLine={false}
                    tickCount={5}
                  />
                  <Radar
                    name="最佳分数"
                    dataKey="score"
                    stroke="#06b6d4"
                    fill="url(#radarGradient)"
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <Legend
                    wrapperStyle={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 22, 40, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontFamily: "'Rajdhani', sans-serif",
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), '最佳分数']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Failure Timeline */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500/20 to-red-500/20
                            border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">失败时间线</h2>
              <p className="text-xs text-gray-500">
                Failure Timeline · 共 {failureTimeline.length} 条记录
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
            {failureTimeline.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                                flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-white font-semibold mb-1">太棒了！暂无失败记录</div>
                <div className="text-sm text-gray-500">继续保持完美的通关记录吧</div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-rose-500/50 via-white/10 to-transparent" />
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {failureTimeline.map((failure, idx) => (
                    <div key={idx} className="relative flex gap-4 pl-10">
                      <div className="absolute left-0 top-1.5 w-[30px] h-[30px] rounded-full
                                      bg-rose-500/20 border border-rose-500/40
                                      flex items-center justify-center">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 p-3
                                      hover:border-rose-500/20 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md
                                             bg-cyan-500/10 text-cyan-300 border border-cyan-500/20
                                             font-medium">
                              {failure.levelName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Clock3 className="w-3 h-3" />
                            {formatDateTime(failure.timestamp)}
                          </div>
                        </div>
                        <div className="text-sm text-rose-300/90 leading-relaxed">
                          {failure.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replay List */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20
                            border border-blue-500/30 flex items-center justify-center">
              <PlayCircle className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">历史回放</h2>
              <p className="text-xs text-gray-500">
                Replay History · 最多保存 20 条
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-500">
              共 <span className="text-white font-bold">{replays.length}</span> / 20 条
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
            {replays.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-500/10 border border-gray-500/20
                                flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-gray-500" />
                </div>
                <div className="text-white font-semibold mb-1">暂无回放记录</div>
                <div className="text-sm text-gray-500">通关一次关卡后会自动保存回放</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {replays.map((replay, idx) => {
                  const isConfirming = deleteConfirm === replay.id;
                  return (
                    <div
                      key={replay.id}
                      className="group flex items-center gap-4 p-3 rounded-xl
                                 bg-white/[0.02] border border-white/5
                                 hover:border-blue-500/20 hover:bg-white/[0.04]
                                 transition-all duration-200"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg
                                      bg-gradient-to-br from-blue-500/30 to-indigo-500/30
                                      border border-blue-500/30 flex items-center justify-center
                                      font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-white text-sm truncate">
                            {getLevelName(replay.levelId)}
                          </span>
                          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded
                                           bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <Trophy className="w-2.5 h-2.5 mr-0.5" />
                            {replay.finalMetrics?.congestionIndex !== undefined
                              ? `拥堵 ${replay.finalMetrics.congestionIndex.toFixed(1)}`
                              : '回放数据'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-cyan-400" />
                            吞吐 {replay.finalMetrics?.throughput || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatPlayTimeHMS(replay.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3 h-3" />
                            {formatRelativeTime(replay.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">最终分数</div>
                          <div className="text-lg font-bold text-cyan-400 leading-none"
                               style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {replay.finalMetrics
                              ? Math.max(0, Math.round(
                                  (100 - (replay.finalMetrics.congestionIndex || 0)) * 100 +
                                  (replay.finalMetrics.throughput || 0)
                                )).toLocaleString()
                              : '—'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReplay(replay.id)}
                          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                                      transition-all duration-200 ${
                                        isConfirming
                                          ? 'bg-rose-600/90 text-white border border-rose-400/50 shadow-lg shadow-rose-500/30'
                                          : 'bg-white/5 text-gray-500 hover:bg-rose-500/15 hover:text-rose-400 border border-white/5 hover:border-rose-500/30'
                                      }`}
                          title={isConfirming ? '再次确认删除' : '删除回放'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                       bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white
                       font-semibold shadow-lg shadow-cyan-500/25
                       hover:shadow-xl hover:shadow-cyan-500/35 hover:scale-[1.01]
                       active:scale-[0.99] transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            <span>导出存档 JSON</span>
          </button>

          <button
            onClick={handleClearSave}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                        font-semibold transition-all duration-200 border
                        ${
                          clearConfirmStep === 0
                            ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                            : clearConfirmStep === 1
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20'
                            : 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400/50 shadow-xl shadow-rose-500/40 animate-pulse'
                        }`}
          >
            {clearConfirmStep === 2 ? (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>⚠️ 最后确认：清空全部存档</span>
              </>
            ) : clearConfirmStep === 1 ? (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>确定要清空吗？再次点击确认</span>
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                <span>清空存档</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4
                     bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10
                       bg-[#0a1628] shadow-2xl overflow-hidden
                       animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                                border border-cyan-500/30 flex items-center justify-center">
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">存档数据导出</h3>
                  <p className="text-xs text-gray-500">Save Data Export</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center
                           bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white
                           border border-white/5 transition-all duration-200"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-gradient-to-r from-cyan-500 to-blue-600 text-white
                             text-sm font-medium shadow-lg shadow-cyan-500/20
                             hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                             transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  下载 .json 文件
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-white/5 text-gray-300 text-sm font-medium
                             border border-white/10 hover:bg-white/10 hover:text-white
                             transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制到剪贴板
                </button>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                  <span className="text-xs text-gray-500 font-mono">save-data.json</span>
                  <span className="text-[10px] text-gray-600">
                    {new Blob([saveManager.export()]).size.toLocaleString()} bytes
                  </span>
                </div>
                <pre className="p-4 max-h-[50vh] overflow-auto text-xs text-gray-400
                                bg-black/30 font-mono leading-relaxed custom-scrollbar">
{saveManager.export()}
                </pre>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between
                            bg-white/[0.02]">
              <div className="text-xs text-gray-500">
                提示：导出文件可用于备份或在其他设备导入
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-medium
                           border border-white/10 hover:bg-white/10 hover:text-white
                           transition-all duration-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
