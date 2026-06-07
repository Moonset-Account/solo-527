import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'
import { AlertTriangle, MapPin } from 'lucide-react'

export default function AlertList() {
  const alerts = useDataStore((s) => s.alerts)
  const setStationIds = useFilterStore((s) => s.setStationIds)

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-white/40 text-sm">
        <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
        暂无告警
      </div>
    )
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 }
  const sorted = [...alerts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  const severityStyle = {
    critical: {
      border: 'border-l-red-500',
      bg: 'bg-red-500/5',
      icon: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400',
      label: '严重',
    },
    warning: {
      border: 'border-l-[#ff9f43]',
      bg: 'bg-[#ff9f43]/5',
      icon: 'text-[#ff9f43]',
      badge: 'bg-[#ff9f43]/20 text-[#ff9f43]',
      label: '警告',
    },
    info: {
      border: 'border-l-[#4a6fa5]',
      bg: 'bg-[#4a6fa5]/5',
      icon: 'text-[#4a6fa5]',
      badge: 'bg-[#4a6fa5]/20 text-[#4a6fa5]',
      label: '提示',
    },
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-white/70">站点告警</h3>
        <span className="text-xs text-white/40">{alerts.filter((a) => a.severity === 'critical').length} 严重 / {alerts.length} 总计</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {sorted.map((alert, i) => {
          const style = severityStyle[alert.severity]
          return (
            <div
              key={`${alert.stationId}-${alert.type}-${i}`}
              className={`flex items-start gap-2 p-2.5 rounded-lg border-l-2 ${style.border} ${style.bg} ${alert.severity === 'critical' ? 'animate-pulse-critical' : ''} transition-colors cursor-pointer hover:brightness-110`}
              onClick={() => setStationIds([alert.stationId])}
            >
              <AlertTriangle
                size={14}
                className={`${style.icon} mt-0.5 flex-shrink-0`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 font-medium text-sm truncate">{alert.stationName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <div className="text-white/50 text-xs mt-0.5">{alert.message}</div>
              </div>
              <button
                className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setStationIds([alert.stationId])
                }}
                title="在地图上定位"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
