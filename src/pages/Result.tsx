import { useParams, useNavigate } from 'react-router-dom';
import { useSaveStore } from '@/stores/saveStore';
import { getLevelById, getLevelsOrdered } from '@/data/levels';
import { formatDuration } from '@/utils/tracker';
import { ArrowLeft, RotateCcw, ArrowRight, Trophy, Clock, XCircle, Lightbulb } from 'lucide-react';

export default function Result() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const save = useSaveStore(s => s.save);
  const level = levelId ? getLevelById(levelId) : null;
  const tracker = save.trackers.filter(t => t.levelId === levelId).pop();
  const levels = getLevelsOrdered();
  const nextLevel = level ? levels.find(l => l.order === level.order + 1) : null;

  if (!level || !tracker) {
    return (
      <div className="w-full h-screen bg-[#0a2e2e] flex items-center justify-center">
        <p className="text-gray-400">未找到结算数据</p>
      </div>
    );
  }

  const scoreColor = tracker.score >= 80 ? 'text-emerald-400' : tracker.score >= 50 ? 'text-[#F5C542]' : 'text-red-400';

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0a2e2e] via-[#0D4F4F] to-[#0a2e2e] flex flex-col items-center py-12 px-4">
      <button onClick={() => navigate('/')} className="self-start flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回主菜单
      </button>

      <h2 className="text-2xl font-bold text-[#F5C542] mb-2">{level.title} - 实验结算</h2>

      <div className="mt-8 mb-10 relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1a3a3a" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={tracker.score >= 80 ? '#10b981' : tracker.score >= 50 ? '#F5C542' : '#e74c3c'} strokeWidth="10" strokeDasharray={`${(tracker.score / 100) * 314} 314`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${scoreColor}`}>{tracker.score}</span>
          <span className="text-gray-400 text-xs">分</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-2 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
          <Clock className="w-6 h-6 text-sky-400" />
          <span className="text-white font-bold text-lg">{formatDuration(tracker.duration)}</span>
          <span className="text-gray-400 text-xs">用时</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
          <XCircle className="w-6 h-6 text-red-400" />
          <span className="text-white font-bold text-lg">{tracker.failureCount}</span>
          <span className="text-gray-400 text-xs">失败次数</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
          <Lightbulb className="w-6 h-6 text-[#F5C542]" />
          <span className="text-white font-bold text-lg">{tracker.hintsUsed}</span>
          <span className="text-gray-400 text-xs">使用提示</span>
        </div>
      </div>

      {tracker.keyChoices.length > 0 && (
        <div className="w-full max-w-md mb-8">
          <h3 className="text-[#F5C542] text-sm font-bold mb-3">关键选择记录</h3>
          <div className="flex flex-col gap-1.5">
            {tracker.keyChoices.map((choice, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${choice.correct ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                <span className={choice.correct ? 'text-emerald-400' : 'text-red-400'}>{choice.correct ? '✓' : '✗'}</span>
                <span className="text-gray-300 flex-1">{choice.choice}</span>
                <span className="text-gray-500">{formatDuration(choice.timestamp - tracker.startTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => navigate(`/lab/${level.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#0D4F4F] border border-[#F5C542]/50 text-[#F5C542] font-bold rounded-full hover:bg-[#0D4F4F]/80 transition-all">
          <RotateCcw className="w-4 h-4" /> 重新挑战
        </button>
        {nextLevel && (
          <button onClick={() => navigate(`/lab/${nextLevel.id}`)} className="flex items-center gap-2 px-5 py-2.5 bg-[#F5C542] text-[#0a2e2e] font-bold rounded-full hover:bg-[#e8a830] transition-all">
            下一关 <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {!nextLevel && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold rounded-full">
            <Trophy className="w-4 h-4" /> 全部通关！
          </div>
        )}
      </div>
    </div>
  );
}
