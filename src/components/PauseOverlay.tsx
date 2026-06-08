import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

interface PauseOverlayProps {
  levelId: string;
}

export default function PauseOverlay({ levelId }: PauseOverlayProps) {
  const navigate = useNavigate();
  const { resetGame, setPaused } = useGameStore();

  const handleResume = () => {
    setPaused(false);
  };

  const handleRestart = () => {
    resetGame();
    navigate(`/game/${levelId}`);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleMainMenu = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5, 14, 18, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="card-base p-8 w-80 flex flex-col items-center gap-6 animate-fade-in-up"
        style={{ boxShadow: '0 0 40px rgba(0, 255, 136, 0.1)' }}
      >
        <h2
          className="font-display text-3xl tracking-widest"
          style={{
            color: 'var(--accent-green)',
            textShadow: '0 0 15px rgba(0, 255, 136, 0.5)',
          }}
        >
          已暂停
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            className="btn-primary flex items-center justify-center gap-2 w-full"
            onClick={handleResume}
          >
            <Play size={18} />
            继续游戏
          </button>
          <button
            className="btn-amber flex items-center justify-center gap-2 w-full"
            onClick={handleRestart}
          >
            <RotateCcw size={18} />
            重新开始
          </button>
          <button
            className="btn-primary flex items-center justify-center gap-2 w-full"
            onClick={handleSettings}
          >
            <Settings size={18} />
            设置
          </button>
          <button
            className="btn-danger flex items-center justify-center gap-2 w-full"
            onClick={handleMainMenu}
          >
            <Home size={18} />
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}
