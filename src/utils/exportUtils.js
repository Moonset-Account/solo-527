import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'
import { INCIDENT_LEVELS, CAMP_SESSIONS, SPORTS_PROJECTS, COACHES, WEATHER_TYPES, CANCEL_REASONS } from '@/data/constants'

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const getLabel = (arr, id) => arr.find(item => item.id === id)?.name || id

export const exportToExcel = async (exportData) => {
  const { funnel, incidents, equipment, ageStats, weatherAnalysis, exportTime, filters } = exportData
  
  const wb = XLSX.utils.book_new()
  
  const infoData = [
    ['导出信息'],
    ['导出时间', formatDate(exportTime) + ' ' + dayjs(exportTime).format('HH:mm:ss')],
    ['筛选条件'],
    ['营期', getLabel(CAMP_SESSIONS, filters.sessionId) || '全部'],
    ['项目', getLabel(SPORTS_PROJECTS, filters.projectId) || '全部'],
    ['教练', getLabel(COACHES, filters.coachId) || '全部'],
    [],
    ['统计摘要'],
    ['总报名人数', funnel.funnelData[0]?.count || 0],
    ['总取消人数', funnel.totalCancelled],
    ['取消率', funnel.cancelRate + '%'],
    ['救援事件总数', incidents.stats.total],
    ['  轻微', incidents.stats.minor],
    ['  医疗介入', incidents.stats.medical],
    ['  停课', incidents.stats.suspend]
  ]
  const infoWs = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(wb, infoWs, '导出信息')
  
  const funnelSheetData = [
    ['阶段', '人数', '转化率']
  ]
  funnel.funnelData.forEach((item, index) => {
    const prevCount = index > 0 ? funnel.funnelData[index - 1].count : item.count
    const rate = index > 0 ? ((item.count / prevCount) * 100).toFixed(1) + '%' : '-'
    funnelSheetData.push([item.stage, item.count, rate])
  })
  funnelSheetData.push([])
  funnelSheetData.push(['取消原因分布'])
  funnelSheetData.push(['原因', '数量'])
  funnel.cancelByReason.forEach(item => {
    funnelSheetData.push([item.reason, item.count])
  })
  const funnelWs = XLSX.utils.aoa_to_sheet(funnelSheetData)
  XLSX.utils.book_append_sheet(wb, funnelWs, '漏斗数据')
  
  const incidentSheetData = [
    ['日期', '时间', '级别', '标题', '描述', '涉及未成年人', '涉及成年人', '是否有照片', '当时天气', '气温', '风力']
  ]
  incidents.timeline.forEach(day => {
    day.events.forEach(event => {
      incidentSheetData.push([
        event.date,
        event.time,
        INCIDENT_LEVELS[event.level]?.label || event.level,
        event.title,
        event.description,
        event.minorCount,
        event.adultCount,
        event.hasPhoto ? '是' : '否',
        event.weather ? getLabel(WEATHER_TYPES, event.weather.weatherId) : '',
        event.weather?.temperature || '',
        event.weather?.windSpeed || ''
      ])
    })
  })
  const incidentWs = XLSX.utils.aoa_to_sheet(incidentSheetData)
  XLSX.utils.book_append_sheet(wb, incidentWs, '救援事件')
  
  const equipSheetData = [
    ['项目', '装备', '使用次数', '损坏次数', '丢失次数', '损坏率', '丢失率', '损耗等级']
  ]
  const wearLevelMap = { low: '低损耗', medium: '中损耗', high: '高损耗' }
  equipment.matrix.forEach(item => {
    equipSheetData.push([
      item.projectName,
      item.equipmentName,
      item.useCount,
      item.damageCount,
      item.lossCount,
      item.damageRate + '%',
      item.lossRate + '%',
      wearLevelMap[item.wearLevel] || item.wearLevel
    ])
  })
  const equipWs = XLSX.utils.aoa_to_sheet(equipSheetData)
  XLSX.utils.book_append_sheet(wb, equipWs, '装备损耗')
  
  const ageSheetData = [
    ['统计类别', '报名', '确认', '签到', '完成', '取消']
  ]
  ageSheetData.push([
    '未成年人（聚合）',
    ageStats.minorAggregated.registerCount,
    ageStats.minorAggregated.confirmCount,
    ageStats.minorAggregated.checkinCount,
    ageStats.minorAggregated.completeCount,
    ageStats.minorAggregated.cancelCount
  ])
  ageStats.byAgeGroup.filter(g => g.ageGroupId === '18+').forEach(g => {
    ageSheetData.push([
      g.ageGroupName,
      g.registerCount,
      g.confirmCount,
      g.checkinCount,
      g.completeCount,
      g.cancelCount
    ])
  })
  const ageWs = XLSX.utils.aoa_to_sheet(ageSheetData)
  XLSX.utils.book_append_sheet(wb, ageWs, '年龄段统计')
  
  if (weatherAnalysis) {
    const weatherSheetData = [
      ['天气与安全分析']
    ]
    weatherSheetData.push([])
    weatherSheetData.push(['天气导致取消分布'])
    weatherSheetData.push(['天气类型', '取消人数'])
    if (weatherAnalysis.cancelByWeather) {
      weatherAnalysis.cancelByWeather.forEach(item => {
        weatherSheetData.push([
          getLabel(WEATHER_TYPES, item.weatherId),
          item.count
        ])
      })
    }
    weatherSheetData.push([])
    weatherSheetData.push(['天气与安全事件关联'])
    weatherSheetData.push(['天气类型', '总事件数', '轻微', '医疗介入', '停课'])
    if (weatherAnalysis.incidentByWeather) {
      Object.entries(weatherAnalysis.incidentByWeather).forEach(([weatherId, data]) => {
        weatherSheetData.push([
          getLabel(WEATHER_TYPES, weatherId),
          data.total,
          data.minor,
          data.medical,
          data.suspend
        ])
      })
    }
    const weatherWs = XLSX.utils.aoa_to_sheet(weatherSheetData)
    XLSX.utils.book_append_sheet(wb, weatherWs, '天气分析')
  }
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' })
  const fileName = `水上运动营数据_${formatDate(exportTime)}.xlsx`
  saveAs(data, fileName)
}

export const exportToCSV = (data, fileName) => {
  const csvContent = data.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${fileName}_${formatDate(new Date())}.csv`)
}
