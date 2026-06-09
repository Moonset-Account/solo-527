import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { saveManager } from '@/game/SaveManager';
import { getLevelById, getNextLevelId, LEVELS } from '@/data/levels/levels';
import {
  Trophy,
  RefreshCw,
  Home,
  ChevronRight,
  Star,
  AlertCircle,
  BarChart3,
  Award,
  Target,
  ArrowRightLeft,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export function ResultScreen() {
  const navigate = useNavigate();
  const { levelId } = useParams();
  const {
    status,
    scoreResult,
    currentMetrics,
    currentLevel,
    retry,
    destroySimulator,
    compareReplayFrames,
    loadComparisonReplay,
    clearComparison,
  } = useGameStore();

  if (!scoreResult || !currentLevel || (status !== 'success' && status !== 'failed')) {
    return null;
  }

  const isSuccess = scoreResult.passed;
  const nextLevelId = getNextLevelId(currentLevel.id);
  const nextLevel = nextLevelId ? getLevelById(nextLevelId) : null;
  const levelRecord = saveManager.getLevelRecord(currentLevel.id);
  const previousBest = levelRecord.bestScore;
  const isNewBest = isSuccess && scoreResult.total > previousBest;

  const replays = saveManager.getReplays(currentLevel.id);

  const radarData = [
    { subject: '通畅度', A: scoreResult.breakdown.congestion, full: 100 },
    { subject: '等待时间', A: scoreResult.breakdown.waiting, full: 100 },
    { subject: '车速', A: scoreResult.breakdown.speed, full: 100 },
    { subject: '公交准点', A: scoreResult.breakdown.bus, full: 100 },
    { subject: '通行量', A: scoreResult.breakdown.throughput, full: 100 },
  ];

  const stars = Math.min(3, Math.ceil(scoreResult.total / 34));

  const handleBackToMenu = () => {
    destroySimulator();
    navigate('/');
  };

  const handleRetry = () => {
    clearComparison();
    retry();
  };

  const handleNextLevel = () => {
    if (!nextLevelId) return;
    destroySimulator();
    navigate(`/game/${nextLevelId}`);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-3xl p-4 animate-[fadeIn_0.5s_ease]">
        <div
          className={`relative rounded-3xl overflow-hidden border-2 shadow-2xl ${
            isSuccess
              ? 'border-emerald-500/40 shadow-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30'
              : 'border-rose-500/40 shadow-rose-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-rose-950/30'
          }`}
        >
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
                : 'bg-gradient-to-r from-rose-400 via-red-500 to-orange-500'
            }`}
          />

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-3">
                {isSuccess ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
                    <div className="relative p-4 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border border-emerald-400/40">
                      <Trophy className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/30 blur-2xl rounded-full animate-pulse" />
                    <div className="relative p-4 rounded-full bg-gradient-to-br from-rose-400/20 to-orange-500/20 border border-rose-400/40">
                      <AlertCircle className="w-12 h-12 text-rose-400" />
                    </div>
                  </div>
                )}
              </div>

              <h2
                className={`text-4xl font-black mb-2 ${isSuccess ? 'text-emerald-300' : 'text-rose-300'}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                {isSuccess ? '关卡通关！' : '挑战失败'}
              </h2>
              <p className="text-slate-400">{currentLevel.name}</p>

              {isSuccess && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className={`w-8 h-8 transition-all duration-500 ${
                        i <= stars
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                          : 'text-slate-700'
                      }`}
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <div
                    className={`text-6xl font-black tabular-nums leading-none mb-1 ${isSuccess ? 'text-white' : 'text-rose-200'}`}
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {scoreResult.total}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    综合得分
                  </div>
                </div>
                {isNewBest && (
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Award className="w-4 h-4" />
                      新纪录！
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">分项得分</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="80%">
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        tick={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Radar
                        name="得分"
                        dataKey="A"
                        stroke={isSuccess ? '#34d399' : '#fb7185'}
                        fill={isSuccess ? '#34d399' : '#fb7185'}
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">目标达成</span>
                    </div>
                    <div className="space-y-2">
                      {currentLevel.targetConditions.map((cond, i) => {
                        const met = scoreResult.failedConditions.every(
                          (f) => f.description !== cond.description
                        );
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                              met
                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                : 'bg-rose-500/10 border border-rose-500/20'
                            }`}
                          >
                            <span
                              className={met ? 'text-emerald-300' : 'text-rose-300'}
                            >
                              {cond.description}
                            </span>
                            <span
                              className={`text-xs font-bold ${met ? 'text-emerald-400' : 'text-rose-400'}`}
                            >
                              {met ? '✓' : '✗'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {replays.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-slate-400">对比上次</span>
                      </div>
                      <button
                        onClick={() => {
                          if (compareReplayFrames) clearComparison();
                          else if (replays[1]) loadComparisonReplay(replays[1].id);
                        }}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors"
                      >
                        {compareReplayFrames ? '取消对比' : '对比最佳回放'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isSuccess && scoreResult.failureReason && (
              <div className="mb-5 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-rose-300 font-bold text-sm mb-1">失败原因分析</p>
                    <p className="text-rose-400/80 text-sm">{scoreResult.failureReason}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-5 px-2 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400">尝试次数</span>
                  <span className="font-bold text-white tabular-nums">
                    {levelRecord.attempts}
                  </span>
                </div>
                {levelRecord.bestScore > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-400">最佳</span>
                    <span className="font-bold text-amber-300 tabular-nums">
                      {levelRecord.bestScore}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBackToMenu}
                className="px-5 py-3 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 text-slate-200 font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                返回主菜单
              </button>
              <button
                onClick={handleRetry}
                className={`flex-1 px-5 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isSuccess
                    ? 'bg-slate-800/70 hover:bg-slate-700/70 border border-slate-600/50 text-slate-200'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/30'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                {isSuccess ? '再来一次' : '重新挑战'}
              </button>
              {isSuccess && nextLevel && (
                <button
                  onClick={handleNextLevel}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  下一关
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
