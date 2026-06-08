import { cn } from '@/lib/utils'

interface ScoreBarProps {
  congestionScore: number
  targetScore: number
  timeRemaining: number
  totalTime: number
}

function getCongestionColor(score: number) {
  if (score < 30) return { bg: '#00ff88', glow: 'rgba(0,255,136,0.4)', text: 'text-[#00ff88]' }
  if (score <= 60) return { bg: '#ffd700', glow: 'rgba(255,215,0,0.4)', text: 'text-[#ffd700]' }
  return { bg: '#ff4444', glow: 'rgba(255,68,68,0.4)', text: 'text-[#ff4444]' }
}

export default function ScoreBar({
  congestionScore,
  targetScore,
  timeRemaining,
  totalTime,
}: ScoreBarProps) {
  const cc = getCongestionColor(congestionScore)
  const timePercent = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0

  return (
    <div className="flex items-center gap-6 rounded-xl border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-md">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">拥堵指数</span>
          <span className={cn('font-semibold', cc.text)}>{congestionScore}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#2a2d3a]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${congestionScore}%`,
              background: cc.bg,
              boxShadow: `0 0 8px ${cc.glow}`,
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">剩余时间</span>
          <span className="font-semibold text-[#00ff88]">{timeRemaining}s</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#2a2d3a]">
          <div
            className="h-full rounded-full bg-[#00ff88] transition-all duration-300"
            style={{
              width: `${timePercent}%`,
              boxShadow: '0 0 8px rgba(0,255,136,0.4)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-xs text-white/60">目标</span>
        <span className="text-sm font-semibold text-[#ffd700]">&lt; {targetScore}</span>
      </div>
    </div>
  )
}
