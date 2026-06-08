import { useGameStore } from '@/store/useGameStore';
import { useUIStore } from '@/store/useUIStore';

export default function ReplayPanel() {
  const replayFrames = useGameStore((s) => s.replayFrames);
  const showReplayPanel = useUIStore((s) => s.showReplayPanel);
  const toggleReplayPanel = useUIStore((s) => s.toggleReplayPanel);
  const level = useGameStore((s) => s.level);

  if (!showReplayPanel) return null;

  const maxScore = replayFrames.length > 0
    ? Math.max(...replayFrames.map((f) => f.congestionScore))
    : 0;
  const minScore = replayFrames.length > 0
    ? Math.min(...replayFrames.map((f) => f.congestionScore))
    : 0;
  const latestFrame = replayFrames[replayFrames.length - 1];
  const earliestFrame = replayFrames[0];

  const chartWidth = 300;
  const chartHeight = 80;
  const pointSpacing = replayFrames.length > 1
    ? chartWidth / (replayFrames.length - 1)
    : 0;

  const scoreRange = maxScore - minScore || 1;
  const points = replayFrames.map((f, i) => {
    const x = i * pointSpacing;
    const y = chartHeight - ((f.congestionScore - minScore) / scoreRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const throughputPoints = replayFrames.map((f, i) => {
    const maxThru = Math.max(...replayFrames.map((r) => r.throughput), 1);
    const x = i * pointSpacing;
    const y = chartHeight - (f.throughput / maxThru) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="absolute bottom-16 left-1/2 w-[360px] -translate-x-1/2 rounded-lg border border-white/10 bg-[#1a1a2e]/95 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-['Orbitron'] text-xs font-bold text-white/80">
          回放对比
        </h3>
        <button
          onClick={toggleReplayPanel}
          className="text-xs text-white/40 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      {replayFrames.length < 2 ? (
        <p className="text-center text-[10px] text-white/40">
          暂无回放数据，请运行模拟一段时间
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-[10px]">
            <span className="text-white/40">拥堵评分趋势</span>
            <div className="flex items-center gap-3">
              <span className="text-[#e74c3c]">■ 拥堵</span>
              <span className="text-[#0abde3]">■ 通行量</span>
            </div>
          </div>

          <svg width={chartWidth} height={chartHeight} className="w-full">
            <line
              x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
            {level && (
              <line
                x1="0"
                y1={chartHeight - ((level.targetScore - minScore) / scoreRange) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - ((level.targetScore - minScore) / scoreRange) * chartHeight}
                stroke="#2ecc71"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.4"
              />
            )}
            <polyline
              points={points}
              fill="none"
              stroke="#e74c3c"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <polyline
              points={throughputPoints}
              fill="none"
              stroke="#0abde3"
              strokeWidth="1.5"
              opacity="0.8"
            />
          </svg>

          <div className="mt-2 flex justify-between text-[10px]">
            <div>
              <span className="text-white/40">最早: </span>
              <span className="text-white/60">{earliestFrame.congestionScore}</span>
            </div>
            <div>
              <span className="text-white/40">最新: </span>
              <span className="text-white/60">{latestFrame.congestionScore}</span>
            </div>
            <div>
              <span className="text-white/40">最低: </span>
              <span className="text-[#2ecc71]">{minScore}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
