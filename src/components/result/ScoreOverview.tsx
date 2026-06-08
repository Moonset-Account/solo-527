import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import StarDisplay from '@/components/ui/StarDisplay'
import type { ScoreResult } from '@/engine/types'

interface ScoreOverviewProps {
  score: ScoreResult
  levelName: string
  targetScore: number
}

function getCongestionColor(value: number) {
  if (value < 30) return 'text-[#00ff88]'
  if (value < 60) return 'text-[#ffd700]'
  return 'text-[#ff4444]'
}

function getCongestionGlow(value: number) {
  if (value < 30) return 'drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]'
  if (value < 60) return 'drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]'
  return 'drop-shadow-[0_0_12px_rgba(255,68,68,0.5)]'
}

export default function ScoreOverview({ score, levelName, targetScore }: ScoreOverviewProps) {
  const passed = score.congestionScore <= targetScore
  const [visibleStars, setVisibleStars] = useState(0)

  useEffect(() => {
    setVisibleStars(0)
    if (score.starRating === 0) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i <= score.starRating; i++) {
      timers.push(setTimeout(() => setVisibleStars(i), i * 300))
    }
    return () => timers.forEach(clearTimeout)
  }, [score.starRating])

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md',
        'shadow-[0_0_20px_rgba(0,255,136,0.08)]',
      )}
    >
      <h2 className="mb-2 text-center text-lg font-bold text-white/80">{levelName}</h2>

      <div className="mb-4 flex justify-center">
        <StarDisplay rating={visibleStars as 0 | 1 | 2 | 3} size="lg" />
      </div>

      <div className="mb-4 text-center">
        <span className="text-xs uppercase tracking-widest text-white/40">拥堵指数</span>
        <div className={cn('text-5xl font-black', getCongestionColor(score.congestionScore), getCongestionGlow(score.congestionScore))}>
          {score.congestionScore}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="text-sm text-white/50">目标: ≤{targetScore}</span>
        {passed ? (
          <span className="flex items-center gap-1 text-[#00ff88]">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">达标</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[#ff4444]">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">未达标</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-center">
          <div className="text-xs text-white/40">吞吐量</div>
          <div className="text-xl font-bold text-[#00ff88]">{score.throughput}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-3 text-center">
          <div className="text-xs text-white/40">平均等待</div>
          <div className="text-xl font-bold text-[#ffd700]">{score.avgWaitTime.toFixed(1)}s</div>
        </div>
        {score.busAvgWaitTime > 0 && (
          <div className="col-span-2 rounded-lg border border-white/5 bg-white/5 p-3 text-center">
            <div className="text-xs text-white/40">公交平均等待</div>
            <div className="text-xl font-bold text-[#ff8800]">{score.busAvgWaitTime.toFixed(1)}s</div>
          </div>
        )}
      </div>
    </div>
  )
}
