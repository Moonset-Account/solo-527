import { useEffect, useRef, useState } from "react"
import ReactECharts from "echarts-for-react"
import { fetchTrend } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import type { TrendData } from "@/types"
import { TrendingUp } from "lucide-react"

export default function TrendChart() {
  const filter = useFilterStore()
  const [data, setData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    setLoading(true)
    fetchTrend(filter)
      .then(setData)
      .finally(() => setLoading(false))
  }, [filter.dateStart, filter.dateEnd, filter.shift, filter.slot, filter.route, filter.device, filter.granularity])

  if (!data) {
    return (
      <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
        <div className="h-80 animate-pulse bg-[#151930] rounded-lg" />
      </div>
    )
  }

  const alarmMarkAreas: any[] = []
  for (let i = 0; i < data.alarm_periods.length; i++) {
    alarmMarkAreas.push([
      {
        name: `${data.alarm_periods[i].device}·${data.alarm_periods[i].alarm_type}`,
        xAxis: data.alarm_periods[i].start_time,
        itemStyle: { color: "rgba(245, 158, 11, 0.07)" },
      },
      {
        xAxis: data.alarm_periods[i].end_time,
      },
    ])
  }

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "rgba(15, 18, 37, 0.95)",
      borderColor: "#2a3050",
      textStyle: { color: "#e4e4e7", fontSize: 12 },
      axisPointer: { type: "cross" as const, crossStyle: { color: "#999" } },
    },
    legend: {
      data: ["错分量", "错分率", "分拣总量"],
      top: 0,
      textStyle: { color: "#a1a1aa", fontSize: 12 },
      itemWidth: 16,
      itemHeight: 8,
    },
    grid: { top: 40, right: 60, bottom: 30, left: 60 },
    xAxis: {
      type: "category" as const,
      data: data.timestamps,
      axisLine: { lineStyle: { color: "#2a3050" } },
      axisLabel: {
        color: "#71717a",
        fontSize: 11,
        formatter: (val: string) => {
          if (filter.granularity === "day") return val.slice(5, 10)
          return val.slice(5, 16)
        },
        rotate: data.timestamps.length > 30 ? 45 : 0,
      },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value" as const,
        name: "错分量",
        nameTextStyle: { color: "#71717a", fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#1e2440" } },
        axisLabel: { color: "#71717a", fontSize: 11 },
      },
      {
        type: "value" as const,
        name: "错分率(%)",
        nameTextStyle: { color: "#71717a", fontSize: 11 },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: "#71717a", fontSize: 11, formatter: "{value}%" },
      },
    ],
    series: [
      {
        name: "错分量",
        type: "bar",
        data: data.error_counts,
        itemStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(239, 68, 68, 0.8)" },
              { offset: 1, color: "rgba(239, 68, 68, 0.2)" },
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
        barMaxWidth: 20,
        markArea: {
          silent: true,
          data: alarmMarkAreas,
          label: {
            show: true,
            position: "insideTop" as const,
            fontSize: 9,
            color: "rgba(245, 158, 11, 0.6)",
            formatter: (params: any) => params.name || "",
          },
        },
      },
      {
        name: "错分率",
        type: "line",
        yAxisIndex: 1,
        data: data.error_rates,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#f59e0b", width: 2 },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(245, 158, 11, 0.15)" },
              { offset: 1, color: "rgba(245, 158, 11, 0)" },
            ],
          },
        },
      },
      {
        name: "分拣总量",
        type: "line",
        data: data.total_counts,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#38bdf8", width: 1, type: "dashed" as const },
        yAxisIndex: 0,
      },
    ],
    dataZoom: data.timestamps.length > 30 ? [
      {
        type: "inside" as const,
        start: 70,
        end: 100,
      },
    ] : undefined,
  }

  return (
    <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-amber" />
          <h3 className="text-sm font-semibold text-zinc-200">错分趋势</h3>
          {data.alarm_periods.length > 0 && (
            <span className="text-[10px] bg-amber/10 text-amber px-2 py-0.5 rounded-full">
              含 {data.alarm_periods.length} 段报警
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="inline-block w-3 h-2 rounded-sm bg-amber/20 border border-amber/30" />
          报警时段
        </div>
      </div>
      {loading ? (
        <div className="h-80 animate-pulse bg-[#151930] rounded-lg" />
      ) : (
        <ReactECharts ref={chartRef} option={option} style={{ height: 320 }} />
      )}
    </div>
  )
}
