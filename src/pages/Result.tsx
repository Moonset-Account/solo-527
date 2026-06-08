import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Clock, Target, BookOpen, Shield, ChevronRight, RotateCcw, Home } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useLevelStore } from '@/stores/levelStore';
import type { KnowledgeCard } from '@/types';

function calculateStars(accuracy: number): number {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

function StarDisplay({ count, delay = 0 }: { count: number; delay: number }) {
  return (
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={48}
          className={i <= count ? 'animate-star-pop' : ''}
          fill={i <= count ? 'var(--accent-amber)' : 'none'}
          style={{
            color: i <= count ? 'var(--accent-amber)' : 'var(--border-color)',
            animationDelay: `${delay + i * 200}ms`,
            animationFillMode: 'both',
          }}
        />
      ))}
    </div>
  );
}

function KnowledgeFlipCard({ card, delay }: { card: KnowledgeCard; delay: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="card-base cursor-pointer animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        perspective: '600px',
      }}
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className="p-4 transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="flex flex-col items-center justify-center min-h-[120px]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <BookOpen size={24} style={{ color: 'var(--accent-blue)', marginBottom: '8px' }} />
          <h4 className="font-body font-bold text-center" style={{ color: 'var(--text-primary)' }}>
            {card.title}
          </h4>
          {card.formula && (
            <p className="text-sm mt-2 font-mono" style={{ color: 'var(--accent-green)' }}>
              {card.formula}
            </p>
          )}
          <span className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            点击翻转
          </span>
        </div>

        <div
          className="flex flex-col items-center justify-center min-h-[120px] absolute inset-0 p-4"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {card.backContent ?? card.principle ?? card.content}
          </p>
          {card.safetyNote && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--accent-amber)' }}>
              ⚠️ {card.safetyNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Result() {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId: string }>();
  const { accuracy, elapsedTime, currentLevel } = useGameStore();
  const { updateProgress, levels } = useLevelStore();

  const stars = calculateStars(accuracy);
  const knowledgeCards = currentLevel?.knowledgeCards ?? [];
  const levelIndex = levels.findIndex((l) => l.id === levelId);
  const nextLevel = levelIndex >= 0 && levelIndex < levels.length - 1 ? levels[levelIndex + 1] : null;

  useEffect(() => {
    if (levelId) {
      updateProgress(levelId, stars, elapsedTime);
    }
  }, [levelId, stars, elapsedTime, updateProgress]);

  return (
    <div
      className="flex flex-col h-screen overflow-y-auto scrollbar-thin"
      style={{ background: 'linear-gradient(180deg, #0A2E36 0%, #0D3B46 50%, #12434F 100%)' }}
    >
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="animate-fade-in-up text-center mb-6">
          <h1
            className="font-display text-3xl md:text-4xl tracking-wider mb-2"
            style={{ color: 'var(--accent-green)' }}
          >
            EXPERIMENT COMPLETE
          </h1>
          <p className="font-body text-lg" style={{ color: 'var(--text-secondary)' }}>
            🎉 恭喜完成实验！
          </p>
        </div>

        <div className="animate-fade-in-up mb-8" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <StarDisplay count={stars} delay={400} />
        </div>

        <div
          className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 animate-fade-in-up"
          style={{ animationDelay: '600ms', animationFillMode: 'both' }}
        >
          <div className="card-base p-4 flex flex-col items-center">
            <Clock size={24} style={{ color: 'var(--accent-blue)', marginBottom: '4px' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>用时</span>
            <span className="font-body font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="card-base p-4 flex flex-col items-center">
            <Target size={24} style={{ color: 'var(--accent-green)', marginBottom: '4px' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>准确率</span>
            <span className="font-body font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {accuracy}%
            </span>
          </div>
        </div>

        {knowledgeCards.length > 0 && (
          <div className="w-full max-w-md mb-8">
            <h2
              className="font-body font-bold text-lg mb-4 flex items-center gap-2"
              style={{ color: 'var(--accent-blue)' }}
            >
              <BookOpen size={20} />
              知识卡片
            </h2>
            <div className="grid gap-3">
              {knowledgeCards.map((card, i) => (
                <KnowledgeFlipCard key={card.id} card={card} delay={800 + i * 150} />
              ))}
            </div>
          </div>
        )}

        <div
          className="card-base p-4 w-full max-w-md mb-8 animate-fade-in-up"
          style={{ animationDelay: '1000ms', animationFillMode: 'both' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} style={{ color: 'var(--accent-amber)' }} />
            <span className="font-body font-bold text-sm" style={{ color: 'var(--accent-amber)' }}>
              安全提示
            </span>
          </div>
          <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            实验中涉及的操作请在专业指导下进行，切勿在无人监督的情况下自行尝试化学实验。
          </p>
        </div>

        <div
          className="flex flex-col gap-3 w-full max-w-md animate-fade-in-up"
          style={{ animationDelay: '1200ms', animationFillMode: 'both' }}
        >
          {nextLevel && (
            <button
              className="btn-primary flex items-center justify-center gap-2 w-full"
              onClick={() => navigate('/levels')}
            >
              下一关
              <ChevronRight size={18} />
            </button>
          )}
          <button
            className="btn-amber flex items-center justify-center gap-2 w-full"
            onClick={() => navigate(`/game/${levelId}`)}
          >
            <RotateCcw size={18} />
            重玩
          </button>
          <button
            className="btn-primary flex items-center justify-center gap-2 w-full"
            onClick={() => navigate('/')}
          >
            <Home size={18} />
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}
