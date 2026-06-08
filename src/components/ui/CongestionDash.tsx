import { useGameStore } from '@/store/useGameStore';

export default function CongestionDash() {
  const congestionScore = useGameStore((s) => s.congestionScore);
  const throughput = useGameStore((s) => s.throughput);
  const avgWaitTime = useGameStore((s) => s.avgWaitTime);
  const level = useGameStore((s) => s.level);
  const gameTime = useGameStore((s) => s.gameTime);

  if (!level) return null;

  const scoreColor =
    congestionScore <= 30
      ? '#2ecc71'
      : congestionScore <= 60
        ? '#f1c40f'
        : '#e74c3c';

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (congestionScore / 100) * circumference;

  const gameHour = (gameTime / level.timeLimit) * 24;
  const hourStr = `${Math.floor(gameHour).toString().padStart(2, '0')}:${Math.floor((gameHour % 1) * 60).toString().padStart(2, '0')}`;

  return (
    <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-6 rounded-lg border border-white/10 bg-[#1a1a2e]/90 px-6 py-3 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <svg width="64" height="64" className="-rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={scoreColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span
          className="-mt-10 font-['Orbitron'] text-lg font-bold"
          style={{ color: scoreColor }}
        >
          {congestionScore}
        </span>
        <span className="mt-4 text-[10px] text-white/40">拥堵评分</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">通行量</span>
          <span className="font-['Orbitron'] text-sm text-white/80">
            {throughput}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">等待车辆</span>
          <span className="font-['Orbitron'] text-sm text-white/80">
            {avgWaitTime.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">时间</span>
          <span className="font-['Orbitron'] text-sm text-[#0abde3]">
            {hourStr}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center border-l border-white/10 pl-4">
        <span className="text-[10px] text-white/40">目标</span>
        <span className="font-['Orbitron'] text-lg font-bold text-[#2ecc71]">
          ≤{level.targetScore}
        </span>
      </div>
    </div>
  );
}
