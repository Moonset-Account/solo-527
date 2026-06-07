import { clickhouseClient } from './clickhouseClient'
import { CANCEL_REASONS, WEATHER_TYPES } from './constants'

const buildUnifiedQuery = (filters) => {
  const whereClauses = []
  
  if (filters.sessionId && filters.sessionId !== 'all') {
    whereClauses.push(`sessionId = '${filters.sessionId}'`)
  }
  if (filters.projectId && filters.projectId !== 'all') {
    whereClauses.push(`projectId = '${filters.projectId}'`)
  }
  if (filters.ageGroupId && filters.ageGroupId !== 'all') {
    whereClauses.push(`ageGroupId = '${filters.ageGroupId}'`)
  }
  if (filters.coachId && filters.coachId !== 'all') {
    whereClauses.push(`coachId = '${filters.coachId}'`)
  }
  
  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  
  return `
    -- 统一看板查询
    SELECT 'unified_dashboard' as query_type, now() as query_time
    -- 实际生产环境中这里会组合多个子查询
    -- 通过 ClickHouse 的多语句执行或应用层聚合
  `
}

export const getUnifiedDashboardData = async (filters) => {
  const sql = buildUnifiedQuery(filters)
  return await clickhouseClient.query(sql, filters)
}

export const getFunnelData = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  return unifiedData.funnel
}

export const getIncidentTimeline = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  return unifiedData.incidents
}

export const getEquipmentHeatmap = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  return unifiedData.equipment
}

export const getAgeGroupStats = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  return unifiedData.ageStats
}

export const getWeatherAnalysis = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  return unifiedData.weatherAnalysis || { incidentByWeather: {}, cancelByWeather: [] }
}

export const getExportData = async (filters) => {
  const unifiedData = await getUnifiedDashboardData(filters)
  
  return {
    funnel: unifiedData.funnel,
    incidents: unifiedData.incidents,
    equipment: unifiedData.equipment,
    ageStats: unifiedData.ageStats,
    weatherAnalysis: unifiedData.weatherAnalysis,
    exportTime: unifiedData.queryTime || new Date().toISOString(),
    filters
  }
}

export const getWeatherLabel = (weatherId) => {
  const weather = WEATHER_TYPES.find(w => w.id === weatherId)
  return weather ? `${weather.icon} ${weather.name}` : weatherId
}

export const getCancelReasonLabel = (reasonId) => {
  const reason = CANCEL_REASONS.find(r => r.id === reasonId)
  return reason?.name || reasonId
}
