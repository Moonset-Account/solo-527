import { useNavigate } from 'react-router-dom';
import { useSaveStore } from '@/stores/saveStore';
import { getLevelById, getLevelsOrdered } from '@/data/levels';
import { formatDuration } from '@/utils/tracker';
import { ArrowLeft, Trophy, Clock, XCircle, CheckCircle } from 'lucide-react';

export default function Records() {
  const navigate = useNavigate();
  const save = useSaveStore(s => s.save);
  const levels = getLevelsOrdered();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0a2e2e] via-[#0D4F4F] to-[#0a2e2e] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-[#F5C542] transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <h1 className="text-2xl font-bold text-[#F5C542] mb-6">实验记录</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-1 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
            <Trophy className="w-6 h-6 text-[#F5C542]" />
            <span className="text-white font-bold text-lg">{save.completedLevels.length}</span>
            <span className="text-gray-400 text-xs">完成关卡</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
            <Clock className="w-6 h-6 text-sky-400" />
            <span className="text-white font-bold text-lg">{formatDuration(save.totalPlayTime)}</span>
            <span className="text-gray-400 text-xs">总用时</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-[#0a2e2e]/80 rounded-xl border border-[#1a5a5a]">
            <XCircle className="w-6 h-6 text-red-400" />
            <span className="text-white font-bold text-lg">{save.totalFailures}</span>
            <span className="text-gray-400 text-xs">总失败</span>
          </div>
        </div>

        <div className="space-y-3">
          {levels.map(level => {
            const isCompleted = save.completedLevels.includes(level.id);
            const levelTrackers = save.trackers.filter(t => t.levelId === level.id);
            const bestTracker = levelTrackers.reduce<null | typeof levelTrackers[0]>((best, t) => (!best || t.score > best.score) ? t : best, null);

            return (
              <div key={level.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isCompleted ? 'bg-[#0a2e2e]/80 border-emerald-500/30' : 'bg-[#0a2e2e]/40 border-[#1a5a5a] opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500/20' : 'bg-gray-700/30'}`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-gray-500 text-xs">{level.order + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{level.title}</h3>
                  <p className="text-gray-500 text-xs truncate">{level.description}</p>
                </div>
                {bestTracker && (
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${bestTracker.score >= 80 ? 'text-emerald-400' : bestTracker.score >= 50 ? 'text-[#F5C542]' : 'text-red-400'}`}>
                      {bestTracker.score}分
                    </span>
                    <span className="text-gray-500 text-xs">{formatDuration(bestTracker.duration)}</span>
                  </div>
                )}
                <button
                  onClick={() => navigate(isCompleted ? `/result/${level.id}` : `/lab/${level.id}`)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCompleted ? 'bg-[#0D4F4F] text-[#F5C542] hover:bg-[#0D4F4F]/80' : 'bg-[#F5C542] text-[#0a2e2e] hover:bg-[#e8a830]'
                  }`}
                >
                  {isCompleted ? '详情' : '开始'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
