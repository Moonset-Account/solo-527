import { useEffect, useState } from "react"
import { fetchMetrics } from "@/api/client"
import type { MetricsConfig, MetricDefinition } from "@/types"
import { HelpCircle, X, Calculator } from "lucide-react"

export default function MetricModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [metrics, setMetrics] = useState<MetricsConfig | null>(null)

  useEffect(() => {
    if (open) {
      fetchMetrics().then(setMetrics)
    }
  }, [open])

  if (!open) return null

  const severityColor = (metric: MetricDefinition) => {
    if (metric.threshold_critical) return "border-red-alert/20"
    if (metric.threshold_warning) return "border-amber/20"
    return "border-blue-info/20"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#151930] border border-[#2a3050] rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto scrollbar-thin shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#151930] border-b border-[#2a3050] px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-blue-info" />
            <h2 className="text-lg font-semibold text-zinc-100">指标口径说明</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1e2440] transition-colors"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {metrics?.metrics?.map((metric) => (
            <div
              key={metric.key}
              className={`bg-[#1a1f36] border ${severityColor(metric)} rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-blue-info" />
                  <h3 className="text-sm font-semibold text-zinc-100">{metric.name}</h3>
                  <code className="text-[10px] bg-[#0f1225] text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                    {metric.key}
                  </code>
                </div>
                <span className="text-xs text-zinc-500">{metric.unit}</span>
              </div>
              <div className="bg-[#0f1225] rounded-lg px-3 py-2 mb-2 font-mono text-xs text-amber">
                {metric.formula}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{metric.description}</p>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
                {metric.threshold_warning > 0 && (
                  <span>警告阈值: <span className="text-amber">{metric.threshold_warning}{metric.unit}</span></span>
                )}
                {metric.threshold_critical > 0 && (
                  <span>严重阈值: <span className="text-red-alert">{metric.threshold_critical}{metric.unit}</span></span>
                )}
              </div>
            </div>
          )) || (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-[#1a1f36] rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
