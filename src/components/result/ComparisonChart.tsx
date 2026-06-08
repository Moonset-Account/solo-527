import { cn } from '@/lib/utils'
import type { ScoreResult } from '@/engine/types'

interface ComparisonChartProps {
  before: ScoreResult | null
  after: ScoreResult
}

interface BarRowProps {
  label: string
  beforeValue: number
  afterValue: number
  maxValue: number
  formatValue: (v: number) => string
  lowerIsBetter: boolean
  hasBefore: boolean
}

function BarRow({ label, beforeValue, afterValue, maxValue, formatValue, lowerIsBetter, hasBefore }: BarRowProps) {
  const beforePct = maxValue > 0 ? Math.min((beforeValue / maxValue) * 100, 100) : 0
  const afterPct = maxValue > 0 ? Math.min((afterValue / maxValue) * 100, 100) : 0
  const delta = afterValue - beforeValue
  const improved = lowerIsBetter ? delta < 0 : delta > 0

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-white/60">{label}</span>
        {!hasBefore && <span className="text-xs text-white/30">首次调整</span>}
      </div>

      {hasBefore && (
        <div className="mb-1 flex items-center gap-2">
          <span className="w-8 text-right text-[10px] text-white/30">前</span>
          <div className="h-3 flex-1 overflow-hidden rounded bg-white/5">
            <div
              className="h-full rounded bg-white/20 transition-all duration-500"
              style={{ width: `${beforePct}%` }}
            />
          </div>
          <span className="w-14 text-right text-[10px] text-white/30">{formatValue(beforeValue)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="w-8 text-right text-[10px] text-white/50">后</span>
        <div className="h-3 flex-1 overflow-hidden rounded bg-white/5">
          <div
            className={cn(
              'h-full rounded transition-all duration-500',
              !hasBefore && 'bg-[#00ff88]/60',
              hasBefore && improved && 'bg-[#00ff88]/60',
              hasBefore && !improved && 'bg-[#ff4444]/60',
            )}
            style={{ width: `${afterPct}%` }}
          />
        </div>
        <span className="w-14 text-right text-[10px] text-white/50">{formatValue(afterValue)}</span>
      </div>

      {hasBefore && delta !== 0 && (
        <div className="mt-0.5 text-right text-[10px]">
          <span className={cn(improved ? 'text-[#00ff88]' : 'text-[#ff4444]')}>
            {improved ? '↓' : '↑'} {formatValue(Math.abs(delta))}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ComparisonChart({ before, after }: ComparisonChartProps) {
  const maxCongestion = Math.max(before?.congestionScore ?? 0, after.congestionScore, 1)
  const maxThroughput = Math.max(before?.throughput ?? 0, after.throughput, 1)
  const maxWait = Math.max(before?.avgWaitTime ?? 0, after.avgWaitTime, 1)

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md',
        'shadow-[0_0_20px_rgba(0,255,136,0.08)]',
      )}
    >
      <h3 className="mb-4 text-sm font-bold text-white/70">数据对比</h3>

      <BarRow
        label="拥堵指数"
        beforeValue={before?.congestionScore ?? 0}
        afterValue={after.congestionScore}
        maxValue={maxCongestion}
        formatValue={(v) => v.toFixed(0)}
        lowerIsBetter
        hasBefore={before !== null}
      />

      <BarRow
        label="吞吐量"
        beforeValue={before?.throughput ?? 0}
        afterValue={after.throughput}
        maxValue={maxThroughput}
        formatValue={(v) => v.toFixed(0)}
        lowerIsBetter={false}
        hasBefore={before !== null}
      />

      <BarRow
        label="平均等待时间"
        beforeValue={before?.avgWaitTime ?? 0}
        afterValue={after.avgWaitTime}
        maxValue={maxWait}
        formatValue={(v) => `${v.toFixed(1)}s`}
        lowerIsBetter
        hasBefore={before !== null}
      />
    </div>
  )
}
