import { useMemo, useState } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { getFilteredRecords } from '@/api/aggregation'
import { ChevronUp, ChevronDown } from 'lucide-react'

type SortKey = 'partName' | 'quantity' | 'cost' | 'date'
type SortDir = 'asc' | 'desc'

export default function SparePartTable() {
  const filters = useFilterStore()
  const records = useMemo(() => getFilteredRecords(filters), [filters])
  const [sortKey, setSortKey] = useState<SortKey>('cost')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const pageSize = 15

  const flatParts = useMemo(() => {
    const parts: { partName: string; quantity: number; cost: number; date: string; equipment: string; faultType: string; orderId: string }[] = []
    for (const r of records) {
      for (const sp of r.spareParts) {
        parts.push({
          partName: sp.partName,
          quantity: sp.quantity,
          cost: sp.quantity * sp.unitCost,
          date: r.startTime.split('T')[0],
          equipment: r.equipmentName,
          faultType: r.faultType,
          orderId: r.id,
        })
      }
    }
    return parts
  }, [records])

  const sorted = useMemo(() => {
    return [...flatParts].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
  }, [flatParts, sortKey, sortDir])

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(sorted.length / pageSize)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-base-500" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />
  }

  return (
    <div className="bg-base-800 rounded-lg border border-base-600/30 p-4">
      <h3 className="text-sm font-medium text-base-200 mb-3">备件消耗明细</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-base-600/30">
              {([['partName', '备件名称'], ['quantity', '数量'], ['cost', '金额(元)'], ['date', '日期']] as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="text-left py-2 px-2 text-base-400 font-medium cursor-pointer hover:text-accent transition-colors" onClick={() => toggleSort(key)}>
                  <span className="flex items-center gap-1">{label}<SortIcon col={key} /></span>
                </th>
              ))}
              <th className="text-left py-2 px-2 text-base-400 font-medium">设备</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">故障类型</th>
              <th className="text-left py-2 px-2 text-base-400 font-medium">工单号</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={`${row.orderId}-${i}`} className="border-b border-base-600/20 hover:bg-base-700/30">
                <td className="py-1.5 px-2">{row.partName}</td>
                <td className="py-1.5 px-2 font-mono">{row.quantity}</td>
                <td className="py-1.5 px-2 font-mono text-accent">¥{row.cost.toLocaleString()}</td>
                <td className="py-1.5 px-2 text-base-300">{row.date}</td>
                <td className="py-1.5 px-2">{row.equipment}</td>
                <td className="py-1.5 px-2">{row.faultType}</td>
                <td className="py-1.5 px-2 font-mono text-accent/80">{row.orderId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-base-400">
        <span>共 {sorted.length} 条</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 bg-base-700 rounded disabled:opacity-30 hover:bg-base-600">上一页</button>
          <span className="py-1">{page + 1}/{totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2 py-1 bg-base-700 rounded disabled:opacity-30 hover:bg-base-600">下一页</button>
        </div>
      </div>
    </div>
  )
}
