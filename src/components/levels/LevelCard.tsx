import { Star, Lock } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../ui/GameButton';
import { getLevelById, isLevelUnlocked } from '../../utils/config';
import type { LevelProgress } from '../../types/save';

interface LevelCardProps {
  levelId: string;
  progress?: LevelProgress;
  allProgress: LevelProgress[];
  onClick: () => void;
}

export function LevelCard({ levelId, progress, allProgress, onClick }: LevelCardProps) {
  const level = getLevelById(levelId);
  if (!level) return null;
  const unlocked = progress?.unlocked ?? isLevelUnlocked(levelId, allProgress);
  const completed = progress?.completed;
  const stars = progress?.stars ?? 0;
  const bestScore = progress?.bestScore ?? 0;
  return (
    <GlassCard
      hoverable={unlocked}
      selected={completed}
      className={cn(!unlocked && 'opacity-60', 'overflow-hidden')}
      icon={
        <div className="relative">
          <span className="text-2xl font-black">
            {level.id.replace(/[^\d]/g, '').slice(0, 2).padStart(2, '0') || '★'}
          </span>
        </div>
      }
      title={<span className="flex items-center gap-2">{level.name}{!unlocked && <Lock className="w-4 h-4 text-slate-400" />}</span>}
      subtitle={level.description}
      onClick={unlocked ? onClick : undefined}
    >
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <Star
              key={i}
              className={cn(
                'w-5 h-5 transition-all duration-300',
                i < stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                  : 'text-slate-600 fill-slate-800',
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
            难度 {level.difficulty}
          </span>
          {completed && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              {bestScore}分
            </span>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              completed ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : 'bg-slate-600',
            )}
            style={{ width: `${(bestScore / level.maxScore) * 100}%` }}
          />
        </div>
      </div>
      {progress && progress.attempts > 0 && (
        <div className="mt-2 text-xs text-slate-400 flex justify-between">
          <span>尝试 {progress.attempts} 次</span>
          {progress.bestTime > 0 && <span>最佳用时 {(progress.bestTime).toFixed(0)}s</span>}
        </div>
      )}
    </GlassCard>
  );
}
