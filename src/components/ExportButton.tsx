import { useFilterStore } from '@/store/filterStore'
import { getFilteredRecords } from '@/api/aggregation'
import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'

export default function ExportButton() {
  const filters = useFilterStore()

  const handleExport = () => {
    const records = getFilteredRecords(filters)
    const headers = ['工单号', '设备ID', '设备名称', '产线', '班次', '故障类型', '停机类型', '开始时间', '结束时间', '持续时长(分钟)', '维修人', '维修时长(分钟)']
    const rows = records.map(r => [
      r.id, r.equipmentId, r.equipmentName, r.productionLine, r.shift, r.faultType,
      r.downtimeType === 'planned' ? '计划检修' : '突发停机',
      r.startTime, r.endTime, r.duration, r.maintenancePerson, r.maintenanceDuration,
    ])
    const filterInfo = `\n筛选条件:\n产线: ${filters.productionLines.join(',') || '全部'}\n班次: ${filters.shifts.join(',') || '全部'}\n故障类型: ${filters.faultTypes.join(',') || '全部'}\n停机类型: ${filters.downtimeType === 'all' ? '全部' : filters.downtimeType === 'planned' ? '计划' : '突发'}\n时间范围: ${filters.dateRange[0]} ~ ${filters.dateRange[1]}\n`
    const csv = '\uFEFF' + filterInfo + '\n' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `停机数据_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border border-accent/30 rounded text-xs hover:bg-accent/20 transition-all duration-200"
    >
      <Download className="w-3.5 h-3.5" />
      导出报告
    </button>
  )
}
