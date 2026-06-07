import { useEffect, useState } from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import ReactECharts from 'echarts-for-react'

interface DrillPath {
  name: string
  nodeIndex: number
}

export default function ReasonDrilldown() {
  const { reasonTree, samples, fetchReasonTree, fetchSamples } = useDashboardStore()
  const [drillPath, setDrillPath] = useState<DrillPath[]>([])
  const [selectedReason, setSelectedReason] = useState<string>('')

  useEffect(() => {
    fetchReasonTree()
    fetchSamples()
  }, [])

  const getCurrentNode = () => {
    if (!reasonTree) return null
    let node = reasonTree
    for (const step of drillPath) {
      const child = node.children?.[step.nodeIndex]
      if (!child) break
      node = child
    }
    return node
  }

  const currentNode = getCurrentNode()

  const handleDrillDown = (name: string) => {
    if (!currentNode?.children) return
    const idx = currentNode.children.findIndex((c) => c.name === name)
    if (idx >= 0) {
      setDrillPath([...drillPath, { name, nodeIndex: idx }])
      setSelectedReason(name)
    }
  }

  const navigateTo = (index: number) => {
    setDrillPath(drillPath.slice(0, index))
    if (index === 0) setSelectedReason('')
    else setSelectedReason(drillPath[index - 1]?.name || '')
  }

  const getTreemapOption = () => {
    if (!currentNode?.children?.length) return {}

    return {
      tooltip: {
        formatter: (info: { name: string; value: number }) =>
          `<b>${info.name}</b><br/>数量: ${info.value}`,
      },
      series: [
        {
          type: 'treemap',
          data: currentNode.children.map((c) => ({
            name: c.name,
            value: c.value,
            children: c.children,
            itemStyle: {
              color: c.anomalyRate && c.anomalyRate > 5 ? '#ef4444' : undefined,
            },
          })),
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: '100%',
          height: '100%',
          label: { show: true, formatter: '{b}\n{c}', fontSize: 13, color: '#fff' },
          upperLabel: { show: true, height: 30, color: '#fff', fontSize: 14, fontWeight: 'bold' as const },
          itemStyle: { borderColor: '#1e293b', borderWidth: 2, gapWidth: 3 },
          colorMappingBy: 'index',
          color: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
        },
      ],
    }
  }

  const breadcrumbItems = [{ name: '退货原因', index: 0 }, ...drillPath.map((s, i) => ({ name: s.name, index: i + 1 }))]

  const filteredSamples = selectedReason
    ? samples.filter((s) => s.reason === selectedReason || !selectedReason)
    : samples.filter((s) => s.isAnomaly)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbItems.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
            <button
              onClick={() => navigateTo(item.index)}
              className={`px-1 ${i === breadcrumbItems.length - 1 ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {item.name}
            </button>
          </span>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">原因下钻分析</h3>
        {currentNode?.children?.length ? (
          <ReactECharts option={getTreemapOption()} style={{ height: 420 }} onEvents={{ click: (params: { name: string }) => handleDrillDown(params.name) }} />
        ) : (
          <div className="flex items-center justify-center h-[420px] text-slate-400 text-sm">
            当前层级无子分类
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            异常订单样本
            {selectedReason && <span className="text-slate-400 font-normal">— {selectedReason}</span>}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">订单号</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">商品</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">退货原因</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">申请时间</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">退款周期(天)</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">是否异常</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">客服备注</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((s) => (
                <tr key={s.orderId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-700 font-mono text-xs">{s.orderId}</td>
                  <td className="px-4 py-2 text-slate-700">{s.product}</td>
                  <td className="px-4 py-2 text-slate-700">{s.reason}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{s.applyTime}</td>
                  <td className="px-4 py-2 text-slate-700">{s.refundCycle}</td>
                  <td className="px-4 py-2">
                    {s.isAnomaly ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 border border-red-200">
                        <AlertTriangle size={10} /> 异常
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">正常</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{s.csNote || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
