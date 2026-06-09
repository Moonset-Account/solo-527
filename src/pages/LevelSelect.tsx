import { ArrowLeft, Lock, Clock, Trophy, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LEVELS, getLevelById } from '@/data/levels/levels';
import { saveManager } from '@/game/SaveManager';
import { cn } from '@/lib/utils';

export default function LevelSelect() {
  const navigate = useNavigate();

  const completedCount = LEVELS.filter((l) =>
    saveManager.getLevelRecord(l.id).completed
  ).length;

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#0a1628' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-10">
          <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-white/5 border border-white/10 text-white/80
                     hover:bg-white/10 hover:text-white
                     transition-all duration-300 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回首页</span>
        </button>

        <h1 className="text-3xl font-bold text-white tracking-tight">
          关卡选择
        </h1>

        <div className="w-32" />
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/70 text-sm font-medium">
          关卡进度
          </span>
          <span className="text-cyan-400 font-bold text-lg">
          {completedCount} / {LEVELS.length}
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(completedCount / LEVELS.length) * 100}%`,
            background: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
          }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {LEVELS.map((l) => {
            const isCompleted = saveManager.getLevelRecord(l.id).completed;
            return (
              <div
              key={l.id}
              className={cn(
                'w-3 h-3 rounded-full mt-1 border border-white/20 transition-all duration-300',
                isCompleted
                  ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  : 'bg-white/10'
              )}
              />
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-blue-600/30" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-500/60 to-blue-500/40 transition-all duration-1000"
          style={{
            width: `${Math.max(1, (completedCount / (LEVELS.length - 1)) * 100)}%`,
          }}
        />

        <div className="grid grid-cols-5 gap-4 relative">
          {LEVELS.map((level, index) => {
            const isUnlocked = saveManager.isLevelUnlocked(
              level.id,
              level.unlockRequirement
            );
            const record = saveManager.getLevelRecord(level.id);
            const isCompleted = record.completed;
            const unlockLevel = level.unlockRequirement
              ? getLevelById(level.unlockRequirement)
              : null;

            return (
              <div key={level.id} className="flex flex-col">
                <div
                  className={cn(
                    'relative rounded-2xl p-5 border transition-all duration-300',
                    'border backdrop-blur-md',
                    isUnlocked
                      ? isCompleted
                        ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/40 hover:border-cyan-400/60 hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(6,182,212,0.1)]'
                        : 'bg-white/5 border-white/15 hover:border-white/25 hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.03)]'
                      : 'bg-white/[0.02] border-white/5 opacity-75 grayscale'
                  )}
                  style={{
                    transform: isUnlocked
                      ? undefined
                      : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold',
                        isCompleted
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : isUnlocked
                            ? 'bg-white/10 text-white border border-white/15'
                            : 'bg-white/5 text-white/40 border border-white/10'
                      )}
                    >
                      {index + 1}
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: level.difficulty }).map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                    {!isCompleted && isUnlocked && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: level.difficulty }).map((_, i) => (
                          <span key={i} className="text-yellow-500/70 text-lg">
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-5 h-5 text-white/30" />
                    </div>
                  )}

                  <h3
                    className={cn(
                      'text-lg font-bold mb-2',
                      isUnlocked ? 'text-white' : 'text-white/40'
                    )}
                  >
                    {level.name}
                  </h3>

                  <p
                    className={cn(
                      'text-xs leading-relaxed mb-4 h-10',
                      isUnlocked ? 'text-white/50' : 'text-white/25'
                    )}
                  >
                    {level.description}
                  </p>

                  <div
                    className={cn(
                      'flex items-center gap-1.5 text-xs mb-4 py-1.5 px-2.5 rounded-lg w-fit',
                      isUnlocked
                        ? 'bg-white/5 text-white/60'
                        : 'bg-white/[0.02] text-white/25'
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{level.duration}秒</span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div
                      className={cn(
                        'text-[11px] font-medium mb-2 flex items-center gap-1',
                        isUnlocked ? 'text-white/40' : 'text-white/20'
                      )}
                    >
                      <Target className="w-3 h-3" />
                      通关目标
                    </div>
                    {level.targetConditions.map((tc) => (
                      <div
                        key={tc.type}
                        className={cn(
                          'text-[11px] py-1 px-2 rounded-md border',
                          isUnlocked
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300/90'
                            : 'bg-white/[0.02] border-white/5 text-white/20'
                        )}
                      >
                        {tc.description}
                      </div>
                    ))}
                  </div>

                  {level.newRules.length > 0 && (
                    <div className="mb-4">
                      <div
                        className={cn(
                          'text-[11px] font-medium mb-2 flex items-center gap-1',
                          isUnlocked ? 'text-amber-400/70' : 'text-white/15'
                        )}
                      >
                        <Sparkles className="w-3 h-3" />
                        新规则
                      </div>
                      {level.newRules.map((rule) => (
                        <div
                          key={rule.ruleId}
                          className={cn(
                            'text-[11px] py-2 px-2.5 rounded-lg border',
                            isUnlocked
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/80'
                              : 'bg-white/[0.02] border-white/5 text-white/15'
                          )}
                        >
                          <div className="font-semibold mb-0.5">
                            {rule.title}
                          </div>
                          <div className="opacity-80 leading-relaxed">
                            {rule.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isUnlocked && (
                    <div className="border-t border-white/10 pt-4 mt-auto">
                      <div className="flex items-center justify-between text-xs mb-4">
                        <div className="flex items-center gap-1 text-white/50">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>最佳: </span>
                          <span className="text-cyan-400 font-bold">
                            {record.bestScore || '-'}
                          </span>
                        </div>
                        <div className="text-white/50">
                          尝试: <span className="text-white/70">{record.attempts}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isUnlocked && unlockLevel && (
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="text-[11px] text-white/30 text-center py-2">
                        🔒 完成「{unlockLevel.name}」解锁
                      </div>
                    </div>
                  )}

                  {isUnlocked && (
                    <button
                      onClick={() => navigate(`/game/${level.id}`)}
                      className={cn(
                        'w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-300',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        'shadow-lg hover:shadow-xl'
                      )}
                      style={{
                        background:
                          'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                        boxShadow: isCompleted
                          ? '0 4px 20px rgba(6,182,212,0.3)'
                          : '0 4px 20px rgba(37,99,235,0.25)',
                      }}
                    >
                      {isCompleted ? '再次挑战' : '开始挑战'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}