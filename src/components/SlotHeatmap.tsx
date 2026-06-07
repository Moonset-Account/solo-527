import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react"
import { fetchHeatmap } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import type { HeatmapData } from "@/types"
import { Grid3X3 } from "lucide-react"

export default function SlotHeatmap() {
  const { dateStart, dateEnd, shift, slot, route, device } = useFilterStore()
  const [data, setData] = useState<HeatmapData | null>(null)

  useEffect(() => {
    fetchHeatmap({ dateStart, dateEnd, shift, slot, route, device })
      .then(setData)
  }, [dateStart, dateEnd, shift, slot, route, device])

  if (!data) {
    return (
      <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
        <div className="h-72 animate-pulse bg-[#151930] rounded-lg" />
      </div>
    )
  }

  const maxVal = Math.max(...data.values.flat(), 0.01)
  const sampledPeriods = data.time_periods.length > 24
    ? data.time_periods.filter((_, i) => i % Math.ceil(data.time_periods.length / 24) === 0)
    : data.time_periods

  const periodIndices = sampledPeriods.map((sp) => data.time_periods.indexOf(sp))

  const filteredValues = data.values.map((row) =>
    periodIndices.map((idx) => row[idx] ?? 0)
  )

  const seriesData: number[][] = []
  for (let i = 0; i < data.slots.length; i++) {
    for (let j = 0; j < sampledPeriods.length; j++) {
      seriesData.push([j, i, filteredValues[i][j]])
    }
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "rgba(15, 18, 37, 0.95)",
      borderColor: "#2a3050",
      textStyle: { color: "#e4e4e7", fontSize: 12 },
      formatter: (params: any) => {
        const val = params.value[2]
        return `<strong>格口${data.slots[params.value[1]]}</strong><br/>` +
          `${sampledPeriods[params.value[0]]}<br/>` +
          `错分率: <span style="color:#f59e0b">${val}%</span>`
      },
    },
    grid: { top: 10, right: 60, bottom: 40, left: 80 },
    xAxis: {
      type: "category" as const,
      data: sampledPeriods,
      axisLine: { lineStyle: { color: "#2a3050" } },
      axisLabel: { color: "#71717a", fontSize: 10, rotate: 45 },
      axisTick: { show: false },
    },
    yAxis: {
      type: "category" as const,
      data: data.slots.map(s => `格口${s}`),
      axisLine: { lineStyle: { color: "#2a3050" } },
      axisLabel: { color: "#71717a", fontSize: 10 },
      axisTick: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: "vertical" as const,
      right: 0,
      top: "center",
      inRange: {
        color: ["#0f1225", "#1a3a4a", "#2d6a4f", "#52b788", "#f59e0b", "#ef4444"],
      },
      textStyle: { color: "#71717a", fontSize: 10 },
    },
    series: [
      {
        type: "heatmap",
        data: seriesData,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" },
        },
        itemStyle: { borderColor: "#0f1225", borderWidth: 1, borderRadius: 2 },
      },
    ],
  }

  return (
    <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 size={16} className="text-amber" />
        <h3 className="text-sm font-semibold text-zinc-200">格口热力图</h3>
        <span className="text-[10px] text-zinc-500">错分率分布（颜色越深错分率越高）</span>
      </div>
      <ReactECharts option={option} style={{ height: 340 }} />
    </div>
  )
}
