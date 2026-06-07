import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react"
import { fetchAlarmCorrelation } from "@/api/client"
import { useFilterStore } from "@/stores/filterStore"
import type { AlarmCorrelationData } from "@/types"
import { GitBranch, AlertTriangle } from "lucide-react"

export default function AlarmCorrelationChart() {
  const { dateStart, dateEnd, shift, slot, route, device } = useFilterStore()
  const [data, setData] = useState<AlarmCorrelationData | null>(null)

  useEffect(() => {
    fetchAlarmCorrelation({ dateStart, dateEnd, shift, slot, route, device })
      .then(setData)
  }, [dateStart, dateEnd, shift, slot, route, device])

  if (!data) {
    return (
      <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
        <div className="h-72 animate-pulse bg-[#151930] rounded-lg" />
      </div>
    )
  }

  const categoryColors: Record<string, string> = {
    "触发源": "#f59e0b",
    "设备": "#38bdf8",
    "线路": "#a78bfa",
    "班次": "#6ee7b7",
    "结果": "#ef4444",
  }

  const nodeCategories = ["触发源", "设备", "线路", "班次", "结果"]

  const links = data.links.map((link) => {
    const sourceNode = data.nodes.find((n) => n.name === link.source)
    const cat = sourceNode?.category || "设备"
    return {
      ...link,
      lineStyle: {
        color: categoryColors[cat] || "#38bdf8",
        opacity: 0.5,
      },
    }
  })

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item" as const,
      backgroundColor: "rgba(15, 18, 37, 0.95)",
      borderColor: "#2a3050",
      textStyle: { color: "#e4e4e7", fontSize: 12 },
      formatter: (params: any) => {
        if (params.dataType === "edge") {
          return `${params.data.source} → ${params.data.target}<br/>影响量: ${params.data.value}`
        }
        return `${params.data.name}<br/>类别: ${params.data.category}`
      },
    },
    series: [
      {
        type: "sankey",
        layoutIterations: 32,
        nodeWidth: 20,
        nodeGap: 12,
        layoutOrientation: "horizontal",
        data: data.nodes.map((node) => ({
          name: node.name,
          itemStyle: {
            color: categoryColors[node.category] || "#38bdf8",
          },
        })),
        links: links,
        label: {
          color: "#a1a1aa",
          fontSize: 11,
        },
        lineStyle: {
          color: "gradient" as const,
          opacity: 0.3,
          curveness: 0.5,
        },
        emphasis: {
          focus: "adjacency" as const,
          lineStyle: { opacity: 0.6 },
        },
      },
    ],
  }

  return (
    <div className="bg-surface rounded-xl border border-[#2a3050] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-amber" />
          <h3 className="text-sm font-semibold text-zinc-200">报警关联分析</h3>
          <span className="text-[10px] text-zinc-500">设备报警→线路→差错传导路径</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          {nodeCategories.map((cat) => (
            <span key={cat} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[cat] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 340 }} />
      <div className="mt-3 flex items-start gap-2 bg-amber/5 border border-amber/10 rounded-lg p-3 text-[11px] text-amber/80">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>报警时段内错分已独立标注为"触发源→设备"路径，不直接归因班次操作</span>
      </div>
    </div>
  )
}
