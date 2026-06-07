import { useEffect, useState, useRef } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Package, Eye } from "lucide-react"
import { fetchSummary } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import type { SummaryData } from "@/types"

function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    const duration = 600
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
    prevRef.current = value
  }, [value])

  return (
    <span className="font-mono font-semibold tabular-nums">
      {display.toFixed(decimals)}{suffix}
    </span>
  )
}

function ChangeIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.01) return <span className="text-zinc-500 text-xs">—</span>
  const isUp = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-red-alert" : "text-emerald-ok"}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? "+" : ""}{value.toFixed(2)}
    </span>
  )
}

export default function SummaryCards() {
  const { dateStart, dateEnd, shift, slot, route, device } = useFilterStore()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchSummary({ dateStart, dateEnd, shift, slot, route, device })
      .then(setData)
      .finally(() => setLoading(false))
  }, [dateStart, dateEnd, shift, slot, route, device])

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-4 border border-[#2a3050] animate-pulse h-28" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "分拣总量",
      value: data.total_sorted,
      decimals: 0,
      icon: Package,
      color: "text-blue-info",
      bgGlow: "from-blue-info/10",
    },
    {
      label: "错分量",
      value: data.total_errors,
      decimals: 0,
      icon: AlertTriangle,
      color: "text-red-alert",
      bgGlow: "from-red-alert/10",
      change: data.error_rate_change,
      changeLabel: "错分率变化",
    },
    {
      label: "错分率",
      value: data.error_rate,
      decimals: 2,
      suffix: "%",
      icon: TrendingUp,
      color: data.error_rate > 1 ? "text-red-alert" : data.error_rate > 0.5 ? "text-amber" : "text-emerald-ok",
      bgGlow: data.error_rate > 1 ? "from-red-alert/10" : data.error_rate > 0.5 ? "from-amber/10" : "from-emerald-ok/10",
      change: data.error_rate_change,
    },
    {
      label: "设备报警",
      value: data.alarm_count,
      decimals: 0,
      icon: AlertTriangle,
      color: "text-amber",
      bgGlow: "from-amber/10",
      change: data.alarm_count_change,
      changeLabel: "报警变化",
      changeDecimals: 0,
    },
    {
      label: "复核未通过",
      value: data.review_failed,
      decimals: 0,
      icon: Eye,
      color: "text-red-alert",
      bgGlow: "from-red-alert/10",
    },
    {
      label: "分拣正常率",
      value: 100 - data.error_rate,
      decimals: 2,
      suffix: "%",
      icon: CheckCircle,
      color: "text-emerald-ok",
      bgGlow: "from-emerald-ok/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`bg-surface rounded-xl p-4 border border-[#2a3050] card-glow transition-all duration-300 animate-fade-up relative overflow-hidden`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} to-transparent opacity-40`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-xs font-medium">{card.label}</span>
              <card.icon size={14} className={card.color} />
            </div>
            <div className={`text-2xl font-bold ${card.color} mb-1`}>
              {loading ? (
                <span className="inline-block w-20 h-7 bg-[#222845] rounded animate-pulse" />
              ) : (
                <AnimatedNumber value={card.value} decimals={card.decimals} suffix={card.suffix} />
              )}
            </div>
            {card.change !== undefined && (
              <ChangeIndicator value={card.change} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
