import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/useGameStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAudio } from '@/hooks/useAudio';
import * as SaveMgr from '@/engine/SaveMgr';

const LEVELS = [
  { id: 'level-1', name: '十字路口', desc: '入门' },
  { id: 'level-2', name: '早高峰', desc: '公交优先' },
  { id: 'level-3', name: '双路口联动', desc: '绿波带' },
  { id: 'level-4', name: '复杂枢纽', desc: '转向信号' },
  { id: 'level-5', name: '终极挑战', desc: '全机制' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const completedLevels = useGameStore((s) => s.completedLevels);
  const loadCompletedLevels = useGameStore((s) => s.loadCompletedLevels);
  useAudio();

  const latestSave = SaveMgr.getLatestSave();
  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    return completedLevels.includes(LEVELS[idx - 1].id);
  };

  const handleLevelSelect = async (levelId: string) => {
    navigate(`/game/${levelId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="h-3 w-3 rounded-full bg-[#e74c3c] shadow-[0_0_8px_#e74c3c]" />
            <span className="h-3 w-3 rounded-full bg-[#f1c40f] shadow-[0_0_8px_#f1c40f]" />
            <span className="h-3 w-3 rounded-full bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]" />
          </div>
        </div>
        <h1 className="mb-1 font-['Orbitron'] text-3xl font-black tracking-wider text-white/90">
          TRAFFIC SIGNAL
        </h1>
        <h2 className="mb-8 font-['Orbitron'] text-sm tracking-widest text-[#0abde3]">
          城市路口信号灯策略模拟
        </h2>

        <div className="mb-8 grid w-full max-w-lg grid-cols-5 gap-3">
          {LEVELS.map((lvl, idx) => {
            const unlocked = isUnlocked(idx);
            const completed = completedLevels.includes(lvl.id);
            return (
              <button
                key={lvl.id}
                onClick={() => unlocked && handleLevelSelect(lvl.id)}
                disabled={!unlocked}
                className={`group relative flex flex-col items-center rounded-lg border p-3 transition ${
                  completed
                    ? 'border-[#2ecc71]/30 bg-[#2ecc71]/10 hover:bg-[#2ecc71]/20'
                    : unlocked
                      ? 'border-white/10 bg-white/5 hover:border-[#0abde3]/30 hover:bg-white/10'
                      : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40'
                }`}
              >
                <span className="font-['Orbitron'] text-lg font-bold text-white/80">
                  {idx + 1}
                </span>
                <span className="mt-1 text-[9px] text-white/50">{lvl.name}</span>
                {completed && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2ecc71] text-[8px] text-black">
                    ✓
                  </span>
                )}
                {!unlocked && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[8px] text-white/30">
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex w-full max-w-lg gap-3">
          <button
            onClick={() => navigate('/sandbox')}
            className="flex-1 rounded-lg border-2 border-dashed border-white/20 bg-transparent px-4 py-3 font-['Orbitron'] text-xs text-white/50 transition hover:border-[#0abde3]/40 hover:bg-white/5 hover:text-[#0abde3]"
          >
            🚧 沙盒模式
          </button>

          {latestSave && (
            <button
              onClick={() => navigate(`/game/${latestSave.levelId}`)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-['Orbitron'] text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              ▶ 继续游戏
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="rounded px-4 py-2 text-xs text-white/30 transition hover:text-white/60"
        >
          ⚙ 设置
        </button>

        <button
          onClick={() => navigate('/editor')}
          className="mt-2 rounded px-4 py-2 text-xs text-white/30 transition hover:text-white/60"
        >
          📝 关卡编辑
        </button>
      </div>
    </div>
  );
}
