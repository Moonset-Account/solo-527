import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Star, Wrench } from 'lucide-react';
import { useLevelStore } from '@/stores/levelStore';
import type { Level } from '@/types';

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: '简单', color: 'var(--accent-green)', bg: 'rgba(0, 255, 136, 0.15)' },
  medium: { label: '中等', color: 'var(--accent-amber)', bg: 'rgba(255, 184, 0, 0.15)' },
  hard: { label: '困难', color: 'var(--accent-red)', bg: 'rgba(255, 68, 68, 0.15)' },
};

function StarRating({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < count ? 'var(--accent-amber)' : 'none'}
          style={{ color: i < count ? 'var(--accent-amber)' : 'var(--border-color)' }}
        />
      ))}
    </div>
  );
}

function LevelCard({ level, unlocked, stars, onClick }: {
  level: Level;
  unlocked: boolean;
  stars: number;
  onClick: () => void;
}) {
  const diff = difficultyConfig[String(level.difficulty)] ?? difficultyConfig.easy;

  return (
    <button
      className={`card-base p-5 text-left transition-all duration-200 w-full ${
        unlocked
          ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
          : 'cursor-not-allowed opacity-50'
      }`}
      style={{
        borderColor: unlocked ? 'var(--border-color)' : 'var(--border-color)',
        filter: unlocked ? 'none' : 'grayscale(0.6)',
      }}
      onClick={unlocked ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <h3
          className="font-body text-lg font-bold"
          style={{ color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {level.name}
        </h3>
        {unlocked ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ color: diff.color, background: diff.bg }}
          >
            {diff.label}
          </span>
        ) : (
          <Lock size={18} style={{ color: 'var(--text-secondary)' }} />
        )}
      </div>

      <p
        className="font-body text-sm mb-3 line-clamp-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {level.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {level.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--accent-blue)', background: 'rgba(184, 232, 252, 0.1)' }}
            >
              {tag}
            </span>
          ))}
        </div>
        {unlocked && <StarRating count={stars} />}
      </div>
    </button>
  );
}

export default function LevelSelect() {
  const navigate = useNavigate();
  const { levels, progress, isLevelUnlocked } = useLevelStore();

  const handleLevelClick = (levelId: string) => {
    navigate(`/game/${levelId}`);
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 100%)' }}
    >
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className="font-display text-2xl tracking-wider"
          style={{ color: 'var(--accent-green)' }}
        >
          选择实验
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {levels.map((level, index) => {
            const unlocked = isLevelUnlocked(level.id);
            const stars = progress[level.id]?.stars ?? 0;
            return (
              <div key={level.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}>
                <LevelCard
                  level={level}
                  unlocked={unlocked}
                  stars={stars}
                  onClick={() => handleLevelClick(level.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <footer className="px-6 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          className="btn-amber flex items-center justify-center gap-2 w-full"
          onClick={() => navigate('/editor')}
        >
          <Wrench size={18} />
          关卡编辑器
        </button>
      </footer>
    </div>
  );
}
