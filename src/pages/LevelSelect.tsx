import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/config/levels';
import { useGameStore } from '@/store/gameStore';
import LevelCard from '@/components/menu/LevelCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAudio } from '@/hooks/useAudio';

export default function LevelSelect() {
  const navigate = useNavigate();
  const { play } = useAudio();
  const unlockedLevels = useGameStore(s => s.unlockedLevels);
  const levelResults = useGameStore(s => s.levelResults);

  const handleLevelClick = (levelId: string) => {
    play('button-click');
    navigate(`/game/${levelId}`);
  };

  const handleBack = () => {
    play('button-click');
    navigate('/');
  };

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1526 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl font-bold tracking-wider"
            style={{
              fontFamily: 'Orbitron, monospace',
              color: '#00ff88',
              textShadow: '0 0 15px #00ff8866',
            }}
          >
            关卡选择
          </h1>
          <NeonButton variant="orange" size="sm" onClick={handleBack}>
            返回
          </NeonButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map(level => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const result = levelResults[level.id];
            const isSandbox = level.id === 'sandbox';

            return (
              <LevelCard
                key={level.id}
                levelId={level.id}
                name={level.name}
                description={level.description}
                starRating={result?.starRating ?? 0}
                isUnlocked={isUnlocked}
                isSandbox={isSandbox}
                onClick={handleLevelClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
