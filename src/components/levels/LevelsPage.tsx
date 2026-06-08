import { ArrowLeft, Filter, Trophy, Search, Sparkles, Info, FlaskConical as FlaskConicalIcon, Shield as ShieldIcon, Play } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { GlassCard } from '../ui/GlassCard';
import { LevelCard } from '../levels/LevelCard';
import { LEVELS } from '../../utils/config';
import { useGameNavStore } from '../../store/useGameNavStore';
import { useSaveStore } from '../../store/useSaveStore';
import { useMemo, useState } from 'react';
import { cn } from '../ui/GameButton';

export function LevelsPage() {
  const navigate = useGameNavStore(s => s.navigate);
  const selectLevel = useGameNavStore(s => s.selectLevel);
  const save = useSaveStore(s => s.save);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = LEVELS;
    if (filter !== 'all') list = list.filter(l => l.difficulty === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.objective.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, search]);

  const stats = useMemo(() => {
    const total = LEVELS.length;
    const unlocked = save.progress.filter(p => p.unlocked).length;
    const completed = save.progress.filter(p => p.completed).length;
    const totalStars = save.progress.reduce((s, p) => s + p.stars, 0);
    return { total, unlocked, completed, totalStars, pct: (completed / Math.max(1, total)) * 100 };
  }, [save.progress]);

  const selectedLevel = selectedInfo ? LEVELS.find(l => l.id === selectedInfo) : null;

  return (
    <div className="min-h-screen w-full bg-[#0a1628] text-slate-100">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <GameButton variant="ghost" size="md" icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('menu')}>返回</GameButton>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              关卡选择
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">选择一个关卡开始你的化学实验之旅</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm">
              <span className="text-slate-400">进度：</span>
              <span className="text-cyan-300 font-mono font-semibold ml-1">
                {stats.completed}/{stats.total}
              </span>
              <span className="text-slate-500 mx-2">·</span>
              <span className="text-amber-400 font-mono">⭐ {stats.totalStars}</span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索关卡..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50
                text-sm text-slate-100 placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
                transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <Filter className="w-4 h-4 text-slate-400 mx-2" />
            {(['all', 1, 2, 3, 4, 5] as const).map(f => (
              <button
                key={String(f)}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filter === f
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40',
                )}
              >
                {f === 'all' ? '全部' : `${f}⭐`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(level => (
            <div key={level.id} className="relative">
              <LevelCard
                levelId={level.id}
                progress={save.progress.find(p => p.levelId === level.id)}
                allProgress={save.progress}
                onClick={() => selectLevel(level.id)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedInfo(selectedInfo === level.id ? null : level.id); }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-700/70 border border-slate-600/50 text-slate-300
                  hover:bg-slate-600/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                style={{ opacity: selectedInfo === level.id ? 1 : undefined }}
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 text-lg">没有找到匹配的关卡</p>
            <GameButton variant="ghost" className="mt-4" onClick={() => { setFilter('all'); setSearch(''); }}>
              清除筛选
            </GameButton>
          </div>
        )}
      </div>

      {selectedLevel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-30 p-6"
          onClick={() => setSelectedInfo(null)}>
          <GlassCard className="max-w-xl w-full" onClick={e => e.stopPropagation()}
            title={<span className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" />{selectedLevel.name}</span>}
            subtitle={`难度 ${selectedLevel.difficulty} · ${selectedLevel.steps.length} 个步骤`}
            icon={<FlaskConicalIcon />}>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">实验目标</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedLevel.objective}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">简介</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedLevel.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
                  <div className="text-xs text-slate-400 mb-1">实验试剂</div>
                  <div className="text-sm font-semibold text-cyan-200">{selectedLevel.availableReagents.length} 种</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
                  <div className="text-xs text-slate-400 mb-1">实验器材</div>
                  <div className="text-sm font-semibold text-emerald-200">{selectedLevel.availableEquipment.length} 件</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
                  <div className="text-xs text-slate-400 mb-1">时间限制</div>
                  <div className="text-sm font-semibold text-amber-200">
                    {Math.floor(selectedLevel.timeLimit / 60)}:{(selectedLevel.timeLimit % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
                  <div className="text-xs text-slate-400 mb-1">满分</div>
                  <div className="text-sm font-semibold text-purple-200">{selectedLevel.maxScore}</div>
                </div>
              </div>
              {selectedLevel.safetyNotes.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    <ShieldIcon />安全提示
                  </div>
                  <ul className="list-disc list-inside text-xs text-rose-200/80 space-y-0.5">
                    {selectedLevel.safetyNotes.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <GameButton variant="ghost" className="flex-1" onClick={() => setSelectedInfo(null)}>关闭</GameButton>
                <GameButton className="flex-1" icon={<Play />}
                  onClick={() => { selectLevel(selectedLevel.id); setSelectedInfo(null); }}>
                  开始实验
                </GameButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function FlaskConicalIcon() {
  return <FlaskConicalIconEl />;
}
import { FlaskConical as FlaskConicalIconEl, Shield as ShieldIcon, Play } from 'lucide-react';
