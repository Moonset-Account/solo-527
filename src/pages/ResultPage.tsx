import { useParams, useNavigate } from 'react-router-dom';
import ScoreOverview from '@/components/result/ScoreOverview';
import ComparisonChart from '@/components/result/ComparisonChart';
import ActionButtons from '@/components/result/ActionButtons';
import { useGameStore } from '@/store/gameStore';
import { getLevelById, LEVELS } from '@/config/levels';
import type { ScoreResult } from '@/engine/types';

export default function ResultPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const levelConfig = levelId ? getLevelById(levelId) : null;
  const levelResults = useGameStore(s => s.levelResults);

  const result: ScoreResult | null = levelId ? (levelResults[levelId] ?? null) : null;

  if (!levelConfig || !result) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ background: '#0a0e1a' }}
      >
        <p className="text-white/50 text-xl">无结果数据</p>
      </div>
    );
  }

  const passed = result.starRating > 0;
  const levelIndex = LEVELS.findIndex(l => l.id === levelId);
  const hasNextLevel = levelIndex >= 0 && levelIndex < LEVELS.length - 1 && LEVELS[levelIndex + 1].id !== 'sandbox';

  const handleRetry = () => {
    navigate(`/game/${levelId}`);
  };

  const handleNextLevel = () => {
    if (hasNextLevel) {
      navigate(`/game/${LEVELS[levelIndex + 1].id}`);
    }
  };

  const handleBackToLevels = () => {
    navigate('/levels');
  };

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1526 50%, #0a0e1a 100%)' }}
    >
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        <h1
          className="text-4xl font-bold tracking-wider mb-2"
          style={{
            fontFamily: 'Orbitron, monospace',
            color: passed ? '#00ff88' : '#ff4444',
            textShadow: passed
              ? '0 0 20px #00ff8888, 0 0 40px #00ff8844'
              : '0 0 20px #ff444488, 0 0 40px #ff444444',
          }}
        >
          {passed ? '关卡通过' : '挑战失败'}
        </h1>

        <ScoreOverview
          score={result}
          levelName={levelConfig.name}
          targetScore={levelConfig.targetScore}
        />

        <ComparisonChart
          before={null}
          after={result}
        />

        <ActionButtons
          onRetry={handleRetry}
          onNextLevel={handleNextLevel}
          onBackToLevels={handleBackToLevels}
          hasNextLevel={hasNextLevel}
          passed={passed}
        />
      </div>
    </div>
  );
}
