import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Award } from 'lucide-react'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { formatCurrency, formatPercentSigned, getTrendColor } from '@/utils/formatters'
import type { StorePerformance } from '@/types/data'

type SortField = 'rank' | 'totalSales' | 'avgOrderValue' | 'salesWoW' | 'inventoryLossRate'

export default function StoreRanking() {
  const storePerformance = useDataStore(state => state.storePerformance)
  const anomalies = useDataStore(state => state.anomalies)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  const selectedStoreId = useDataStore(state => state.selectedStoreId)
  const setSelectedStore = useDataStore(state => state.setSelectedStore)
  const setDrillDown = useDataStore(state => state.setDrillDown)
  const setStoreIds = useFilterStore(state => state.setStoreIds)
  
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(field === 'rank' || field === 'inventoryLossRate' ? 'asc' : 'desc')
    }
  }
  
  const sortedData = [...storePerformance].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1
    switch (sortField) {
      case 'rank': return (a.rank - b.rank) * modifier
      case 'totalSales': return (a.totalSales - b.totalSales) * modifier
      case 'avgOrderValue': return (a.avgOrderValue - b.avgOrderValue) * modifier
      case 'salesWoW': return (a.salesWoW - b.salesWoW) * modifier
      case 'inventoryLossRate': return (a.inventoryLossRate - b.inventoryLossRate) * modifier
    }
  })
  
  const getStoreAnomalies = (storeId: string) => {
    return anomalies.filter(a => a.storeId === storeId)
  }
  
  const handleRowClick = (store: StorePerformance) => {
    if (selectedStoreId === store.storeId) {
      setSelectedStore(null)
      setStoreIds([])
    } else {
      setSelectedStore(store.storeId)
      setStoreIds([store.storeId])
      setDrillDown({
        type: 'store',
        value: store.storeId,
        title: `${store.storeName} 销售明细`,
      })
    }
  }
  
  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-coffee-100 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-coffee-400">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )

  return (
    <ChartCard
      title="门店业绩排名"
      subtitle="点击门店可下钻查看详情，支持多指标排序"
      sampleSize={storePerformance.length}
    >
      {isLoading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-coffee-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isEmpty || storePerformance.length === 0 ? (
        <EmptyState title="暂无排名数据" />
      ) : (
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-coffee-50 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-coffee-600 w-16">排名</th>
                <th className="px-3 py-2.5 text-left font-medium text-coffee-600">门店</th>
                <SortHeader field="totalSales" label="销售额" />
                <SortHeader field="avgOrderValue" label="客单价" />
                <SortHeader field="salesWoW" label="环比" />
                <SortHeader field="inventoryLossRate" label="损耗率" />
                <th className="px-3 py-2.5 text-center font-medium text-coffee-600 w-16">异常</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(store => {
                const storeAnomalies = getStoreAnomalies(store.storeId)
                const hasCritical = storeAnomalies.some(a => a.severity === 'critical')
                
                return (
                  <tr
                    key={store.storeId}
                    onClick={() => handleRowClick(store)}
                    className={`border-b border-coffee-50 cursor-pointer transition-colors ${
                      selectedStoreId === store.storeId 
                        ? 'bg-coffee-100/60' 
                        : 'hover:bg-coffee-50/60'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {store.rank <= 3 ? (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            store.rank === 1 ? 'bg-amber-500' :
                            store.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
                          }`}>
                            <Award size={12} />
                          </div>
                        ) : (
                          <span className="text-coffee-500 font-medium w-6 text-center">{store.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-coffee-800">{store.storeName}</div>
                      <div className="text-xs text-coffee-400">{store.district}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-coffee-800">
                      {formatCurrency(store.totalSales)}
                    </td>
                    <td className="px-3 py-3 text-right text-coffee-600">
                      ¥{store.avgOrderValue}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-medium ${getTrendColor(store.salesWoW)}`}>
                        {store.salesWoW > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatPercentSigned(store.salesWoW)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={store.inventoryLossRate > 0.05 ? 'text-red-600 font-medium' : 'text-coffee-600'}>
                        {(store.inventoryLossRate * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {storeAnomalies.length > 0 && (
                        <div 
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                            hasCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}
                          title={`${storeAnomalies.length}个异常`}
                        >
                          <AlertTriangle size={12} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  )
}
