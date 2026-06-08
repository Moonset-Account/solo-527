import { formatTime } from '@/types/game'
import type { Decision } from '@/types/game'

interface DecisionTimelineProps {
  decisions: Decision[]
}

export default function DecisionTimeline({ decisions }: DecisionTimelineProps) {
  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 text-sm" style={{ backgroundColor: '#1a2332' }}>
        暂无决策记录
      </div>
    )
  }

  return (
    <div className="relative" style={{ backgroundColor: '#1a2332' }}>
      <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ backgroundColor: '#2a3a4a' }} />
      <div className="flex flex-col">
        {decisions.map((d, i) => (
          <div key={i} className="relative flex items-start gap-3 px-3 py-2.5">
            <div
              className="relative z-10 mt-1 w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#0f1923', border: '2px solid #ff6b35' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff6b35' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">{formatTime(d.time)}</span>
                <span className="text-sm text-gray-200 font-medium">{d.action}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{d.detail}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px]">
                <ImpactDelta label="延迟" value={d.delayDelta} />
                <ImpactDelta label="成本" value={d.costDelta} />
                <ImpactDelta label="满意度" value={d.satisfactionDelta} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImpactDelta({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0
  const isNegative = value < 0
  const color = isNegative ? '#ef4444' : isPositive ? '#00c9a7' : '#6b7280'
  const sign = isPositive ? '+' : ''

  return (
    <span style={{ color }}>
      {label} {sign}{Math.round(value)}
    </span>
  )
}
