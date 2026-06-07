export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) {
    console.warn('没有数据可导出')
    return
  }
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h]
        if (typeof val === 'string' && (val.includes(',') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val != null ? val : ''
      }).join(',')
    )
  ].join('\n')
  
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportFaultsCSV(faultLogs, repairOrders, stations, filtersDesc) {
  const stationMap = new Map(stations.map(s => [s.id, s.name]))
  
  const data = faultLogs.map(fault => {
    const repair = repairOrders.find(r => r.fault_id === fault.id)
    return {
      '故障ID': fault.id,
      '站点名称': stationMap.get(fault.station_id) || fault.station_id,
      '充电桩ID': fault.charger_id,
      '故障码': fault.fault_code,
      '故障描述': fault.fault_desc,
      '严重程度': fault.severity,
      '发生时间': fault.occur_time,
      '解决时间': fault.resolve_time || '未解决',
      '状态': fault.is_resolved ? '已解决' : '未解决',
      '来源': fault.source,
      '维修人': repair?.person_name || '未分配',
      '维修耗时(小时)': repair?.repair_hours || ''
    }
  })
  
  exportToCSV(data, `故障数据_${new Date().toISOString().slice(0, 10)}.csv`)
}

export function exportRepairsCSV(repairOrders, stations, filtersDesc) {
  const stationMap = new Map(stations.map(s => [s.id, s.name]))
  
  const data = repairOrders.map(order => ({
    '工单ID': order.id,
    '站点名称': stationMap.get(order.station_id) || order.station_id,
    '充电桩ID': order.charger_id,
    '故障码': order.fault_code,
    '维修人': order.person_name,
    '班组': order.team,
    '创建时间': order.create_time,
    '完成时间': order.complete_time || '进行中',
    '维修耗时(小时)': order.repair_hours || '',
    '状态': order.status,
    '备注': order.remark || ''
  }))
  
  exportToCSV(data, `维修工单_${new Date().toISOString().slice(0, 10)}.csv`)
}
