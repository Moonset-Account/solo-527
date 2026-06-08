import { useGameStore } from '@/store/useGameStore';
import { useUIStore } from '@/store/useUIStore';
import * as AudioTrigger from '@/engine/AudioTrigger';
import type { GameSpeed } from '@/types';

export default function TimeControl() {
  const phase = useGameStore((s) => s.phase);
  const speed = useGameStore((s) => s.speed);
  const setPhase = useGameStore((s) => s.setPhase);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const toggleReplayPanel = useUIStore((s) => s.toggleReplayPanel);
  const toggleSaveSlots = useUIStore((s) => s.toggleSaveSlots);

  const isPlaying = phase === 'playing';
  const isPaused = phase === 'paused';

  const handlePlayPause = () => {
    if (isPlaying) {
      setPhase('paused');
    } else if (isPaused) {
      setPhase('playing');
    }
    AudioTrigger.playUIClick();
  };

  const handleSpeed = (s: GameSpeed) => {
    setSpeed(s);
    if (phase === 'paused') setPhase('playing');
    AudioTrigger.playUIClick();
  };

  const handleRestart = () => {
    restartLevel();
    AudioTrigger.playUIClick();
  };

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a2e]/90 px-4 py-2 backdrop-blur-sm">
      <button
        onClick={handlePlayPause}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {([1, 2, 4] as GameSpeed[]).map((s) => (
        <button
          key={s}
          onClick={() => handleSpeed(s)}
          className={`flex h-8 w-8 items-center justify-center rounded text-xs transition ${
            speed === s
              ? 'bg-[#0abde3]/20 text-[#0abde3]'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          {s}x
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-white/10" />

      <button
        onClick={handleRestart}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-white/70 transition hover:bg-[#e74c3c]/20 hover:text-[#e74c3c]"
        title="重开"
      >
        ↺
      </button>

      <div className="mx-1 h-5 w-px bg-white/10" />

      <button
        onClick={toggleReplayPanel}
        className="flex h-8 items-center justify-center rounded bg-white/5 px-2 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        回放
      </button>

      <button
        onClick={toggleSaveSlots}
        className="flex h-8 items-center justify-center rounded bg-white/5 px-2 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        存档
      </button>
    </div>
  );
}
