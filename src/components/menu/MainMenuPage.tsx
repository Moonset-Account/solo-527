import { Play, List, Settings, BookOpen, Trophy, ShieldAlert, FlaskConical, Star } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { useSaveStore } from '../../store/useSaveStore';
import { LEVELS } from '../../utils/config';
import { useGameNavStore } from '../../store/useGameNavStore';
import { cn } from '../ui/GameButton';
import { useMemo } from 'react';

export function MainMenuPage() {
  const save = useSaveStore(s => s.save);
  const navigate = useGameNavStore(s => s.navigate);
  const selectLevel = useGameNavStore(s => s.selectLevel);

  const totalProgress = useMemo(() => {
    const total = LEVELS.length;
    const completed = save.progress.filter(p => p.completed).length;
    const stars = save.progress.reduce((s, p) => s + p.stars, 0);
    const maxStars = total * 3;
    return { total, completed, stars, maxStars, pct: total > 0 ? (completed / total) * 100 : 0 };
  }, [save.progress]);

  const lastLevel = useMemo(() => {
    const lastPlayed = save.progress
      .filter(p => p.lastPlayed > 0 && p.unlocked)
      .sort((a, b) => b.lastPlayed - a.lastPlayed)[0];
    return lastPlayed || save.progress.find(p => p.unlocked && !p.completed) || save.progress[0];
  }, [save.progress]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a1628]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-slate-950" />
        {Array.from({ length: 35 }).map((_, i) => {
          const cx = 10 + (i * 73) % 90;
          const cy = 15 + (i * 51) % 85;
          const r = 2 + (i % 5) * 2;
          const color = i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#00ff88' : '#ff6b35';
          const delay = (i * 0.17) % 5;
          return (
            <div key={i}
              className="absolute rounded-full animate-float"
              style={{
                left: `${cx}%`, top: `${cy}%`, width: `${r}px`, height: `${r}px`,
                backgroundColor: color, opacity: 0.18,
                boxShadow: `0 0 ${r * 4}px ${color}`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00d4ff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-6 py-12">
        <div className="text-center mb-14 animate-fadeIn">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-cyan-400/30 bg-cyan-500/5 backdrop-blur-md mb-6">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-cyan-200 font-medium tracking-wide">安全虚拟实验室 · 零危险实验体验</span>
          </div>
          <h1 className="text-7xl font-black tracking-tight mb-4 bg-gradient-to-br from-cyan-300 via-white to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,212,255,0.3)]">
            CHEM LAB
          </h1>
          <p className="text-2xl text-slate-300 font-light tracking-widest mb-3">化学实验室教学游戏</p>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
            在安全的虚拟环境中，学习配置溶液、控制温度、观察反应现象，体验沉浸式化学实验的乐趣
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-2xl animate-slideUp" style={{ animationDelay: '0.1s' }}>
          {[
            { label: '已解锁', value: save.progress.filter(p => p.unlocked).length, icon: <FlaskConical className="w-5 h-5" />, color: 'cyan' },
            { label: '已完成', value: totalProgress.completed, icon: <Trophy className="w-5 h-5" />, color: 'amber' },
            { label: '星数', value: `${totalProgress.stars}/${totalProgress.maxStars}`, icon: <Star className="w-5 h-5" />, color: 'amber' },
            { label: '总实验', value: save.statistics.totalExperiments, icon: <BookOpen className="w-5 h-5" />, color: 'emerald' },
          ].map((s, i) => (
            <div key={i}
              className="rounded-xl p-4 bg-slate-800/40 border border-slate-700/50 backdrop-blur-md
                hover:border-cyan-400/30 transition-all hover:-translate-y-0.5 text-center">
              <div className={cn(
                'inline-flex p-2 rounded-lg mb-2',
                s.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-300' :
                s.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-300',
              )}>{s.icon}</div>
              <div className="text-2xl font-bold text-slate-100 tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-sm mb-10 animate-slideUp" style={{ animationDelay: '0.25s' }}>
          <GameButton size="xl" className="w-full"
            icon={<Play className="w-6 h-6" />}
            glow
            onClick={() => { if (lastLevel?.levelId) selectLevel(lastLevel.levelId); else navigate('levels'); }}>
            {save.statistics.totalExperiments > 0 ? '继续实验' : '开始实验'}
          </GameButton>
          <div className="grid grid-cols-3 gap-2 w-full">
            <GameButton variant="secondary" size="lg" className="w-full" icon={<List className="w-5 h-5" />}
              onClick={() => navigate('levels')}>关卡</GameButton>
            <GameButton variant="secondary" size="lg" className="w-full" icon={<Settings className="w-5 h-5" />}
              onClick={() => navigate('settings')}>设置</GameButton>
            <GameButton variant="ghost" size="lg" className="w-full" icon={<BookOpen className="w-5 h-5" />}>
              说明
            </GameButton>
          </div>
        </div>

        <div className="w-full max-w-2xl text-center animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <span className="font-medium">学习进度</span>
            <span className="font-mono">{totalProgress.completed}/{totalProgress.total} 关卡 · {totalProgress.stars}/{totalProgress.maxStars} ⭐</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800/70 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000 relative overflow-hidden"
              style={{ width: `${totalProgress.pct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 text-xs text-slate-600 flex items-center gap-2">
          <ShieldAlert className="w-3 h-3" />
          <span>本游戏仅为教学模拟，请勿在现实中进行未经培训的危险化学操作</span>
        </div>
      </div>
    </div>
  );
}
