import { useEffect, useState } from 'react';
import { Home, RotateCcw, ArrowRight, Trophy, Target, Clock, ShieldAlert, Sparkles, AlertTriangle, Star, Share2, BookOpen, ChevronRight } from 'lucide-react';
import { GameButton, cn } from '../ui/GameButton';
import { GlassCard } from '../ui/GlassCard';
import type { LevelResult } from '../../types/save';
import { getLevelById, getNextLevel } from '../../utils/config';
import { useGameNavStore } from '../../store/useGameNavStore';
import { useSaveStore } from '../../store/useSaveStore';
import { computeStars } from '../../utils/save';
import { formatTime } from '../../utils/math';

interface ResultPageProps {
  levelId: string;
  result: LevelResult;
}

export function ResultPage({ levelId, result }: ResultPageProps) {
  const navigate = useGameNavStore(s => s.navigate);
  const selectLevel = useGameNavStore(s => s.selectLevel);
  const setResult = useGameNavStore(s => s.setResult);
  const addRecord = useSaveStore(s => s.addRecord);
  const level = getLevelById(levelId);
  const nextLevel = getNextLevel(levelId);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showStars, setShowStars] = useState(0);
  const isSuccess = result.status === 'success';

  useEffect(() => {
    if (!level) return;
    const record = {
      id: `rec_${Date.now()}`,
      levelId,
      levelName: level.name,
      timestamp: Date.now(),
      duration: result.duration,
      score: result.score,
      stars: result.stars,
      completed: isSuccess,
      totalErrors: result.errors,
      safetyViolations: result.safetyViolations,
      steps: result.stepRecords,
      knowledgeViewed: result.knowledgeViewed,
    };
    addRecord(record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(result.score * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const t1 = setTimeout(() => setShowStars(1), 700);
    const t2 = setTimeout(() => setShowStars(2), 900);
    const t3 = setTimeout(() => setShowStars(3), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [result.score]);

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-slate-300">
        <div className="text-center">
          <p>关卡信息丢失</p>
          <GameButton className="mt-4" onClick={() => navigate('levels')}>返回关卡选择</GameButton>
        </div>
      </div>
    );
  }

  const statusText: Record<LevelResult['status'], { title: string; desc: string; color: string }> = {
    success: { title: '🎉 实验成功', desc: '出色地完成了本次化学实验！', color: 'emerald' },
    timeout: { title: '⏰ 实验超时', desc: '时间不够啦，下次加快速度哦～', color: 'amber' },
    failed_safety: { title: '⚠️ 安全违规', desc: '多次触发安全警告，实验被迫终止', color: 'rose' },
    abandoned: { title: '🚪 实验中断', desc: '实验未完成就退出了，再试一次吧！', color: 'slate' },
  };
  const st = statusText[result.status];
  const expectedStars = computeStars(result.maxScore, level.starThresholds);

  return (
    <div className="min-h-screen w-full bg-[#0a1628] relative overflow-hidden flex items-center justify-center py-12 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-3xl animate-fadeIn">
        <div className="text-center mb-8">
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4',
            st.color === 'emerald' && 'bg-emerald-500/15 border border-emerald-400/40 text-emerald-200',
            st.color === 'amber' && 'bg-amber-500/15 border border-amber-400/40 text-amber-200',
            st.color === 'rose' && 'bg-rose-500/15 border border-rose-400/40 text-rose-200',
            st.color === 'slate' && 'bg-slate-500/15 border border-slate-400/40 text-slate-200',
          )}>
            {isSuccess ? <Trophy className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {st.title}
          </div>
          <h1 className="text-5xl font-black text-slate-100 mb-3 bg-gradient-to-br from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
            {level.name}
          </h1>
          <p className="text-slate-400">{st.desc}</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-end gap-3">
            {[0, 1, 2].map(i => {
              const filled = showStars > i && (expectedStars > i);
              return (
                <Star
                  key={i}
                  className={cn(
                    'transition-all duration-500',
                    filled
                      ? 'w-20 h-20 text-amber-400 fill-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)] -translate-y-2'
                      : 'w-16 h-16 text-slate-700 fill-slate-900 opacity-60',
                    showStars > i && filled && 'animate-star-pop',
                  )}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              );
            })}
          </div>
        </div>

        <GlassCard
          glow={isSuccess}
          title={<span className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" />实验成绩</span>}
          icon={<Trophy className="w-5 h-5" />}
        >
          <div className="text-center mb-6">
            <div className="text-7xl font-black bg-gradient-to-br from-cyan-300 via-white to-amber-300 bg-clip-text text-transparent tabular-nums leading-none">
              {animatedScore.toLocaleString()}
            </div>
            <div className="text-slate-400 mt-2">
              <span className="font-mono text-lg text-slate-300">{animatedScore}</span>
              <span className="text-slate-500 mx-2">/</span>
              <span className="font-mono">{result.maxScore.toLocaleString()}</span>
              <span className="text-slate-500 mx-2">·</span>
              <span className="text-cyan-300 font-mono">
                {result.maxScore ? Math.round((animatedScore / result.maxScore) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: '准确度', value: Math.round(result.accuracy * 100), icon: <Target className="w-4 h-4" />,
                color: result.accuracy >= 0.8 ? 'emerald' : result.accuracy >= 0.5 ? 'amber' : 'rose',
              },
              {
                label: '安全度', value: Math.round(result.safety * 100), icon: <ShieldAlert className="w-4 h-4" />,
                color: result.safety >= 0.9 ? 'emerald' : result.safety >= 0.6 ? 'amber' : 'rose',
              },
              {
                label: '效率值', value: Math.round(result.efficiency * 100), icon: <Clock className="w-4 h-4" />,
                color: result.efficiency >= 0.7 ? 'emerald' : result.efficiency >= 0.4 ? 'amber' : 'rose',
              },
            ].map(stat => (
              <div key={stat.label} className="relative p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center overflow-hidden">
                <div className={cn(
                  'absolute top-0 left-0 h-1 transition-all duration-700',
                  stat.color === 'emerald' && 'bg-emerald-400',
                  stat.color === 'amber' && 'bg-amber-400',
                  stat.color === 'rose' && 'bg-rose-400',
                )} style={{ width: `${stat.value}%` }} />
                <div className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide mb-2',
                  stat.color === 'emerald' && 'bg-emerald-500/15 text-emerald-300',
                  stat.color === 'amber' && 'bg-amber-500/15 text-amber-300',
                  stat.color === 'rose' && 'bg-rose-500/15 text-rose-300',
                )}>
                  {stat.icon}{stat.label}
                </div>
                <div className="text-3xl font-black text-slate-100 tabular-nums">
                  {stat.value}<span className="text-xl text-slate-500 ml-0.5">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 text-center mb-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <div>
              <div className="text-xs text-slate-500">用时</div>
              <div className="text-sm font-semibold text-cyan-200 font-mono">{formatTime(result.duration)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">失误</div>
              <div className={cn('text-sm font-semibold font-mono', result.errors > 0 ? 'text-amber-300' : 'text-emerald-300')}>
                {result.errors}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">违规</div>
              <div className={cn('text-sm font-semibold font-mono', result.safetyViolations > 0 ? 'text-rose-300' : 'text-emerald-300')}>
                {result.safetyViolations}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">知识点</div>
              <div className="text-sm font-semibold text-violet-300 font-mono">{result.knowledgeViewed.length}</div>
            </div>
          </div>

          {result.stepRecords.length > 0 && (
            <div className="border-t border-slate-700/50 pt-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />步骤明细
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {result.stepRecords.map((sr, i) => {
                  const step = level.steps[i];
                  return (
                    <div key={sr.stepId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors text-sm">
                      <div className={cn(
                        'w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold',
                        sr.status === 'completed' && sr.errors === 0
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                          : sr.status === 'completed'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            : sr.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                              : 'bg-slate-700/50 text-slate-400',
                      )}>
                        {sr.status === 'completed' && sr.errors === 0 ? '✓' :
                          sr.status === 'completed' ? '!' :
                          sr.status === 'failed' ? '✕' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 truncate text-xs">{step?.title || sr.stepId}</div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                        {sr.errors > 0 && <span className="text-amber-400">⚠{sr.errors}</span>}
                        <span className="text-cyan-300">+{sr.score}</span>
                        <span className="text-slate-500 w-12 text-right tabular-nums">{sr.timeTaken.toFixed(1)}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.knowledgeViewed.length > 0 && (
            <div className="mt-4 p-3 rounded-xl border border-violet-500/30 bg-violet-500/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-300 mb-2">
                <BookOpen className="w-4 h-4" />已学习知识点
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.knowledgeViewed.map(kid => {
                  const kc = level.knowledgeCards.find(k => k.id === kid);
                  return (
                    <span key={kid} className="px-2 py-1 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-200 text-xs">
                      {kc?.title || kid}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </GlassCard>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <GameButton variant="secondary" size="lg" icon={<Home className="w-5 h-5" />}
            onClick={() => { setResult(null); navigate('menu'); }}>返回主菜单</GameButton>
          <GameButton variant="warning" size="lg" icon={<RotateCcw className="w-5 h-5" />}
            onClick={() => { setResult(null); selectLevel(levelId); }}>再试一次</GameButton>
          {isSuccess && nextLevel && (
            <GameButton size="lg" glow icon={<ArrowRight className="w-5 h-5" />} iconRight={<ChevronRight className="w-5 h-5" />}
              onClick={() => { setResult(null); selectLevel(nextLevel.id); }}>
              下一关：{nextLevel.name}
            </GameButton>
          )}
          <GameButton variant="ghost" size="lg" icon={<Share2 className="w-5 h-5" />}>
            分享成绩
          </GameButton>
        </div>
      </div>
    </div>
  );
}
