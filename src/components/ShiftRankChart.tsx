import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react"
import { fetchShiftRank } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import type { ShiftRankData } from "@/types"
import { Users, AlertTriangle } from "lucide-react"

export default function ShiftRankChart() {
  const { dateStart, dateEnd } = useFilterStore()
  const [data, setData] = useState<ShiftRankData | null>(null)

  useEffect(() => {
    fetchShiftRank({ dateStart, dateEnd })
      .then(setData)
  }, [dateStart, dateEnd])

  if (!data) {
    return (
      <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
        <div className="h-72 animate-pulse bg-[#151930] rounded-lg" />
      </div>
    )
  }

  const sorted = [...data.data].sort((a, b) => a.error_rate - b.error_rate)

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "rgba(15, 18, 37, 0.95)",
      borderColor: "#2a3050",
      textStyle: { color: "#e4e4e7", fontSize: 12 },
      formatter: (params: any) => {
        const item = sorted[params.dataIndex]
        return `<strong>${item.shift}</strong><br/>` +
          `分拣量: ${item.total_sorted.toLocaleString()}<br/>` +
          `错分量: ${item.error_count.toLocaleString()}<br/>` +
          `错分率: <span style="color:#f59e0b">${item.error_rate}%</span><br/>` +
          `报警次数: ${item.alarm_count}` +
          (item.alarm_count > 0 ? `<br/><span style="color:#f59e0b;font-size:10px">⚠ 含报警时段，错分率不直接归责班组</span>` : "")
      },
    },
    grid: { top: 20, right: 80, bottom: 20, left: 70 },
    xAxis: {
      type: "value" as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#1e2440" } },
      axisLabel: { color: "#71717a", fontSize: 11, formatter: "{value}%" },
    },
    yAxis: {
      type: "category" as const,
      data: sorted.map((s) => s.shift),
      axisLine: { lineStyle: { color: "#2a3050" } },
      axisLabel: { color: "#a1a1aa", fontSize: 13, fontWeight: 600 },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: sorted.map((item) => ({
          value: item.error_rate,
          itemStyle: {
            color: item.error_rate > 1
              ? {
                  type: "linear" as const,
                  x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: "rgba(239, 68, 68, 0.3)" },
                    { offset: 1, color: "rgba(239, 68, 68, 0.9)" },
                  ],
                }
              : item.error_rate > 0.5
                ? {
                    type: "linear" as const,
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: "rgba(245, 158, 11, 0.3)" },
                      { offset: 1, color: "rgba(245, 158, 11, 0.9)" },
                    ],
                  }
                : {
                    type: "linear" as const,
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: "rgba(16, 185, 129, 0.3)" },
                      { offset: 1, color: "rgba(16, 185, 129, 0.9)" },
                    ],
                  },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barMaxWidth: 28,
        label: {
          show: true,
          position: "right" as const,
          formatter: "{c}%",
          color: "#a1a1aa",
          fontSize: 12,
          fontFamily: "JetBrains Mono",
        },
      },
    ],
  }

  return (
    <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-amber" />
          <h3 className="text-sm font-semibold text-zinc-200">班组排行</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-ok" /> 正常</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber" /> 警告</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-alert" /> 异常</span>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 200 }} />
      {sorted.some((s) => s.alarm_count > 0) && (
        <div className="mt-3 flex items-start gap-2 bg-amber/5 border border-amber/10 rounded-lg p-3 text-[11px] text-amber/80">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>含报警时段的班组已标注，设备报警期间的错分不直接归责班组</span>
        </div>
      )}
    </div>
  )
}
