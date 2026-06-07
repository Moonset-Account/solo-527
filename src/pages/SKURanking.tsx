import { useStore } from '@/store/useStore'
import { clickhouse } from '@/api/clickhouse'
import { supersetClient } from '@/api/superset'
import { pgMeta } from '@/api/postgresql'
import { X, AlertTriangle } from 'lucide-react'
import EChartsWrapper from '@/components/EChartsWrapper'
import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'

function RateBar({ rate }: { rate: number }) {
  const color = rate > 20 ? 'bg-red-500' : rate > 10 ? 'bg-orange-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-sm font-medium">{rate}%</span>
    </div>
  )
}

export default function SKURanking() {
  const warehouseType = useStore((s) => s.warehouseType)
  const selectedSKU = useStore((s) => s.selectedSKU)
  const setSelectedSKU = useStore((s) => s.setSelectedSKU)

  const skuThreshold = useMemo(
    () => pgMeta.getLowSampleConfig().find((c) => c.dimension === 'sku')?.threshold ?? 30,
    []
  )

  const ranking = useMemo(
    () => supersetClient.query(
      `sku_${warehouseType}`,
      () => clickhouse.getSKURanking(warehouseType, skuThreshold)
    ),
    [warehouseType, skuThreshold]
  )

  const detail = useMemo(
    () => selectedSKU ? clickhouse.getSKUDetail(selectedSKU) : null,
    [selectedSKU]
  )

  const reasonChartOption = useMemo<EChartsOption>(() => {
    if (!detail) return {}
    const reasons = [...detail.topReturnReasons].sort((a, b) => b.count - a.count)
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: 80, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value' as const },
      yAxis: { type: 'category' as const, data: reasons.map((r) => r.reason), inverse: true },
      series: [{
        type: 'bar' as const,
        data: reasons.map((r) => r.count),
        itemStyle: { color: '#5B8FF9' },
        barWidth: 14,
      }],
    }
  }, [detail])

  const pieChartOption = useMemo<EChartsOption>(() => {
    if (!detail) return {}
    return {
      tooltip: { trigger: 'item' as const },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie' as const,
        radius: ['40%', '65%'],
        center: ['50%', '40%'],
        label: { show: false },
        data: detail.qualityConclusions.map((q) => ({
          name: q.conclusionLabel,
          value: q.count,
        })),
        itemStyle: {
          color: (_params: { dataIndex: number }) => {
            const colors = ['#EE6666', '#5B8FF9', '#73C0DE']
            return colors[_params.dataIndex % colors.length]
          },
        },
      }],
    }
  }, [detail])

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">SKU 退货率排名</h1>
          <p className="mt-1 text-sm text-gray-400">
            样本量不足的 SKU 不参与排名（阈值: {skuThreshold} 单） | 数据源: ClickHouse
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-16">排名</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">商品名称</th>
              <th className="px-4 py-3 w-20">订单量</th>
              <th className="px-4 py-3 w-20">退货数</th>
              <th className="px-4 py-3 w-44">退货率</th>
              <th className="px-4 py-3">主要退货原因</th>
              <th className="px-4 py-3 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, idx) => (
              <tr key={item.sku} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.isLowSample ? 'bg-yellow-50/30' : ''}`}>
                <td className="px-4 py-3 text-sm">
                  {item.isLowSample ? (
                    <span className="text-gray-400">--</span>
                  ) : (
                    <span className={`font-semibold ${idx < 3 ? 'text-red-500' : 'text-gray-700'}`}>{idx + 1}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {item.sku}
                  {item.isLowSample && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                      <AlertTriangle size={10} />
                      样本不足
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{item.productName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.totalOrders}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.returnCount}</td>
                <td className="px-4 py-3"><RateBar rate={item.returnRate} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {item.topReturnReasons[0]?.reason ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedSKU(item.sku)}
                    className="rounded px-2 py-1 text-xs font-medium text-[#1B2A4A] hover:bg-[#1B2A4A]/10 transition-colors"
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSKU && detail && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedSKU(null)}
          />
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">{detail.productName}</h2>
                <span className="text-xs text-gray-400 font-mono">{detail.sku}</span>
              </div>
              <button
                onClick={() => setSelectedSKU(null)}
                className="rounded-md p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <div className="text-lg font-bold text-red-600">{detail.returnRate}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">退货率</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{detail.totalOrders}</div>
                  <div className="text-xs text-gray-500 mt-0.5">订单量</div>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{detail.returnCount}</div>
                  <div className="text-xs text-gray-500 mt-0.5">退货数</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">退货原因分布</h3>
                <EChartsWrapper option={reasonChartOption} style={{ height: 160 }} />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">质检结论分布</h3>
                <EChartsWrapper option={pieChartOption} style={{ height: 180 }} />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">近期退货订单</h3>
                <div className="overflow-hidden rounded border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-2 py-1.5 text-left">订单号</th>
                        <th className="px-2 py-1.5 text-left">退货原因</th>
                        <th className="px-2 py-1.5 text-right">退款</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentOrders.map((order) => (
                        <tr key={order.orderId} className="border-t border-gray-100">
                          <td className="px-2 py-1.5 font-mono text-gray-600">{order.orderId.slice(-8)}</td>
                          <td className="px-2 py-1.5 text-gray-600">{order.returnReason}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600">
                            {order.refundCurrency} {order.refundAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
