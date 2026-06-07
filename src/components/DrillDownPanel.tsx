import { useFilterStore } from '@/store/filterStore'
import { getFilteredRecords } from '@/api/aggregation'
import { X } from 'lucide-react'

export default function DrillDownPanel() {
  const { drillDown, clearDrillDown, ...filters } = useFilterStore()

  if (!drillDown.faultType && !drillDown.equipmentId && !drillDown.productionLine) return null

  const enhancedFilters = { ...filters, faultTypes: drillDown.faultType ? [drillDown.faultType] : filters.faultTypes, equipmentIds: drillDown.equipmentId ? [drillDown.equipmentId] : filters.equipmentIds, productionLines: drillDown.productionLine ? [drillDown.productionLine] : filters.productionLines }
  const records = getFilteredRecords(enhancedFilters)

  const titleParts: string[] = []
  if (drillDown.faultType) titleParts.push(drillDown.faultType)
  if (drillDown.productionLine) titleParts.push(drillDown.productionLine)
  if (drillDown.equipmentId) titleParts.push(drillDown.equipmentId)

  return (
    <div className="bg-base-800 rounded-lg border border-accent/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-accent">下钻: {titleParts.join(' / ')}</h3>
        <button onClick={clearDrillDown} className="text-base-400 hover:text-alert transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-base-600/30">
              <th className="text-left py-2 px-2 text-base-400 font-medium">工单号</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">设备</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">故障类型</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">类型</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">时长</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">维修人</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">开始时间</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 20).map(r => (
              <tr key={r.id} className="border-b border-base-600/20 hover:bg-base-700/30">
                <td className="py-1.5 px-2 font-mono text-accent/80">{r.id}</td>
                <td className="py-1.5 px-2">{r.equipmentName}</td>
                <td className="py-1.5 px-2">{r.faultType}</td>
                <td className="py-1.5 px-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.downtimeType === 'planned' ? 'bg-planned/20 text-planned' : 'bg-unplanned/20 text-unplanned'}`}>
                    {r.downtimeType === 'planned' ? '计划' : '突发'}
                  </span>
                </td>
                <td className="py-1.5 px-2 font-mono">{r.duration}分</td>
                <td className="py-1.5 px-2">{r.maintenancePerson}</td>
                <td className="py-1.5 px-2 text-base-300">{new Date(r.startTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length > 20 && <p className="text-xs text-base-400 mt-2">显示前 20 条，共 {records.length} 条记录</p>}
    </div>
  )
}
