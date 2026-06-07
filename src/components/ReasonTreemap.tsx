import { useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDashboardStore } from '@/store/dashboardStore'

interface ReasonTreemapProps {
  onDrillDown?: (name: string) => void
  height?: number
}

export default function ReasonTreemap({ onDrillDown, height = 360 }: ReasonTreemapProps) {
  const reasonTree = useDashboardStore((s) => s.reasonTree)

  const getOption = useCallback(() => {
    if (!reasonTree) return {}

    return {
      tooltip: {
        formatter: (info: { name: string; value: number; treePathInfo: { name: string }[] }) => {
          const path = info.treePathInfo.map((p) => p.name).filter(Boolean).join(' > ')
          return `<div style="font-size:12px"><b>${path}</b><br/>数量: ${info.value}<br/>占比: ${((info.value / reasonTree.value) * 100).toFixed(1)}%</div>`
        },
      },
      series: [
        {
          type: 'treemap',
          data: reasonTree.children || [],
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: '100%',
          height: '100%',
          label: {
            show: true,
            formatter: '{b}\n{c}',
            fontSize: 12,
            color: '#fff',
          },
          upperLabel: {
            show: true,
            height: 28,
            color: '#fff',
            fontSize: 13,
            fontWeight: 'bold' as const,
          },
          itemStyle: {
            borderColor: '#1e293b',
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              itemStyle: {
                borderColor: '#1e293b',
                borderWidth: 3,
                gapWidth: 4,
              },
              upperLabel: { show: true },
            },
            {
              colorSaturation: [0.3, 0.7],
              itemStyle: {
                borderColorSaturation: 0.5,
                gapWidth: 1,
                borderWidth: 1,
              },
            },
          ],
          colorMappingBy: 'index',
          color: ['#10b981', '#059669', '#047857', '#065f46'],
        },
      ],
    }
  }, [reasonTree])

  const handleClick = useCallback(
    (params: { name: string; treePathInfo?: { name: string }[] }) => {
      if (onDrillDown && params.name) {
        onDrillDown(params.name)
      }
    },
    [onDrillDown]
  )

  if (!reasonTree) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无数据</div>
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">退货原因分布</h3>
      <ReactECharts option={getOption()} style={{ height }} onEvents={{ click: handleClick }} />
    </div>
  )
}
