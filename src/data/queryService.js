import { clickhouseClient } from './clickhouseClient'
import { CANCEL_REASONS, WEATHER_TYPES } from './constants'

export const getUnifiedDashboardData = async (filters) => {
  return await clickhouseClient.getUnifiedDashboardData(filters)
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

export const buildClickHouseFunnelSQL = (filters) => {
  const whereConditions = []
  
  if (filters?.sessionId && filters.sessionId !== 'all') {
    whereConditions.push(`sessionId = '${filters.sessionId}'`)
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    whereConditions.push(`projectId = '${filters.projectId}'`)
  }
  if (filters?.ageGroupId && filters.ageGroupId !== 'all') {
    whereConditions.push(`ageGroupId = '${filters.ageGroupId}'`)
  }
  if (filters?.coachId && filters.coachId !== 'all') {
    whereConditions.push(`coachId = '${filters.coachId}'`)
  }
  
  const whereStr = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
  
  return `
    SELECT
        'register' as stage,
        sum(registerCount) as count
    FROM registrations
    ${whereStr}
    UNION ALL
    SELECT
        'confirm' as stage,
        sum(confirmCount) as count
    FROM registrations
    ${whereStr}
    UNION ALL
    SELECT
        'checkin' as stage,
        sum(checkinCount) as count
    FROM registrations
    ${whereStr}
    UNION ALL
    SELECT
        'complete' as stage,
        sum(completeCount) as count
    FROM registrations
    ${whereStr}
  `
}

export const buildClickHouseIncidentSQL = (filters) => {
  const whereConditions = []
  
  if (filters?.sessionId && filters.sessionId !== 'all') {
    whereConditions.push(`i.sessionId = '${filters.sessionId}'`)
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    whereConditions.push(`i.projectId = '${filters.projectId}'`)
  }
  if (filters?.ageGroupId && filters.ageGroupId !== 'all') {
    whereConditions.push(`i.ageGroupId = '${filters.ageGroupId}'`)
  }
  if (filters?.coachId && filters.coachId !== 'all') {
    whereConditions.push(`i.coachId = '${filters.coachId}'`)
  }
  
  const whereStr = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
  
  return `
    SELECT
        i.*,
        w.weatherId,
        wt.name as weatherName,
        w.temperature,
        w.windSpeed
    FROM incidents i
    LEFT JOIN weather_records w 
        ON i.sessionId = w.sessionId 
        AND i.date = w.date
    LEFT JOIN weather_types wt ON w.weatherId = wt.id
    ${whereStr}
    ORDER BY i.date DESC, i.time DESC
  `
}

export const buildClickHouseEquipmentSQL = (filters) => {
  const whereConditions = []
  
  if (filters?.sessionId && filters.sessionId !== 'all') {
    whereConditions.push(`sessionId = '${filters.sessionId}'`)
  }
  if (filters?.projectId && filters.projectId !== 'all') {
    whereConditions.push(`projectId = '${filters.projectId}'`)
  }
  
  const whereStr = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
  
  return `
    SELECT
        projectId,
        equipmentId,
        sum(useCount) as useCount,
        sum(damageCount) as damageCount,
        sum(lossCount) as lossCount,
        sum(totalWear) as totalWear
    FROM equipment_usage
    ${whereStr}
    GROUP BY projectId, equipmentId
    ORDER BY totalWear DESC
  `
}
