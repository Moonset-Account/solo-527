import { useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDashboardStore } from '@/store/dashboardStore'

interface ProductRankingProps {
  onBarClick?: (productId: string) => void
  height?: number
}

type Dimension = 'returnRate' | 'returnCount' | 'refundAmount'

const dimensionLabels: Record<Dimension, string> = {
  returnRate: '退货率',
  returnCount: '退货量',
  refundAmount: '退款金额',
}

export default function ProductRanking({ onBarClick, height = 360 }: ProductRankingProps) {
  const productRanking = useDashboardStore((s) => s.productRanking)
  const [dimension, setDimension] = useState<Dimension>('returnRate')

  const top20 = productRanking.slice(0, 20)

  const getOption = useCallback(() => {
    if (top20.length === 0) return {}

    const reversed = [...top20].reverse()

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: { name: string; value: number; seriesName: string }[]) => {
          if (!params || params.length === 0) return ''
          const p = params[0]
          let unit = ''
          if (dimension === 'returnRate') unit = '%'
          else if (dimension === 'refundAmount') unit = '元'
          return `<b>${p.name}</b><br/>${dimensionLabels[dimension]}: ${p.value}${unit}`
        },
      },
      grid: { left: 130, right: 40, top: 10, bottom: 30 },
      xAxis: {
        type: 'value' as const,
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          formatter: dimension === 'returnRate' ? '{value}%' : dimension === 'refundAmount' ? '{value}元' : '{value}',
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'category' as const,
        data: reversed.map((p) => p.name),
        axisLabel: { fontSize: 11, color: '#475569', width: 120, overflow: 'truncate' as const },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [
        {
          type: 'bar',
          data: reversed.map((p) => p[dimension]),
          itemStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: '60%',
          label: {
            show: true,
            position: 'right' as const,
            fontSize: 10,
            color: '#64748b',
            formatter: (p: { value: number }) => {
              if (dimension === 'returnRate') return `${p.value}%`
              if (dimension === 'refundAmount') return `¥${p.value.toLocaleString()}`
              return String(p.value)
            },
          },
        },
      ],
    }
  }, [top20, dimension])

  const handleClick = useCallback(
    (params: { name: string; dataIndex: number }) => {
      if (onBarClick) {
        const actualIndex = top20.length - 1 - params.dataIndex
        onBarClick(top20[actualIndex]?.id)
      }
    },
    [onBarClick, top20]
  )

  if (top20.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无数据</div>
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">商品退货排行 Top20</h3>
        <div className="flex rounded-md border border-slate-200 overflow-hidden">
          {(Object.keys(dimensionLabels) as Dimension[]).map((dim) => (
            <button
              key={dim}
              onClick={() => setDimension(dim)}
              className={`px-3 py-1 text-xs transition-colors ${
                dimension === dim ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {dimensionLabels[dim]}
            </button>
          ))}
        </div>
      </div>
      <ReactECharts option={getOption()} style={{ height }} onEvents={{ click: handleClick }} />
    </div>
  )
}
