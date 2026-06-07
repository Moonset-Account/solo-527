import { mockData } from './mockData'
import { FUNNEL_STAGES, CANCEL_REASONS, EQUIPMENT_TYPES, SPORTS_PROJECTS, AGE_GROUPS } from './constants'

const applyFilters = (data, filters) => {
  return data.filter(item => {
    if (filters.sessionId && filters.sessionId !== 'all' && item.sessionId !== filters.sessionId) return false
    if (filters.projectId && filters.projectId !== 'all' && item.projectId !== filters.projectId) return false
    if (filters.ageGroupId && filters.ageGroupId !== 'all' && item.ageGroupId !== filters.ageGroupId) return false
    if (filters.coachId && filters.coachId !== 'all' && item.coachId !== filters.coachId) return false
    return true
  })
}

export const getFunnelData = async (filters) => {
  const filtered = applyFilters(mockData.registrations, filters)
  
  const funnelData = FUNNEL_STAGES.map(stage => ({
    stage: stage.name,
    key: stage.id,
    count: filtered.reduce((sum, r) => sum + (r[stage.key] || 0), 0)
  }))
  
  const cancelByReason = CANCEL_REASONS.map(reason => ({
    reason: reason.name,
    reasonId: reason.id,
    count: filtered.filter(r => r.cancelReasonId === reason.id).length
  })).filter(r => r.count > 0)
  
  const totalCancelled = filtered.reduce((sum, r) => sum + r.cancelled, 0)
  const cancelRate = funnelData[0].count > 0 ? (totalCancelled / funnelData[0].count * 100).toFixed(1) : 0
  
  return {
    funnelData,
    cancelByReason,
    totalCancelled,
    cancelRate
  }
}

export const getIncidentTimeline = async (filters) => {
  const filtered = applyFilters(mockData.incidents, filters)
  
  const byLevel = {
    minor: filtered.filter(i => i.level === 'minor'),
    medical: filtered.filter(i => i.level === 'medical'),
    suspend: filtered.filter(i => i.level === 'suspend')
  }
  
  const byDate = {}
  filtered.forEach(incident => {
    if (!byDate[incident.date]) {
      byDate[incident.date] = []
    }
    byDate[incident.date].push(incident)
  })
  
  const timeline = Object.entries(byDate)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, events]) => ({
      date,
      events
    }))
  
  const stats = {
    total: filtered.length,
    minor: byLevel.minor.length,
    medical: byLevel.medical.length,
    suspend: byLevel.suspend.length,
    withPhotos: filtered.filter(i => i.hasPhoto).length,
    minorInvolved: filtered.reduce((sum, i) => sum + i.minorCount, 0),
    adultInvolved: filtered.reduce((sum, i) => sum + i.adultCount, 0)
  }
  
  return {
    timeline,
    byLevel,
    stats
  }
}

export const getEquipmentHeatmap = async (filters) => {
  const filtered = applyFilters(mockData.equipmentUsage, filters)
  
  const aggregated = {}
  filtered.forEach(item => {
    const key = `${item.projectId}-${item.equipmentId}`
    if (!aggregated[key]) {
      aggregated[key] = {
        projectId: item.projectId,
        equipmentId: item.equipmentId,
        useCount: 0,
        damageCount: 0,
        lossCount: 0,
        totalWear: 0
      }
    }
    aggregated[key].useCount += item.useCount
    aggregated[key].damageCount += item.damageCount
    aggregated[key].lossCount += item.lossCount
    aggregated[key].totalWear += item.totalWear
  })
  
  const matrix = Object.values(aggregated).map(item => {
    const project = SPORTS_PROJECTS.find(p => p.id === item.projectId)
    const equipment = EQUIPMENT_TYPES.find(e => e.id === item.equipmentId)
    
    let wearLevel = 'low'
    if (item.totalWear > 100) wearLevel = 'high'
    else if (item.totalWear > 50) wearLevel = 'medium'
    
    return {
      ...item,
      projectName: project?.name || item.projectId,
      equipmentName: equipment?.name || item.equipmentId,
      wearLevel,
      damageRate: item.useCount > 0 ? (item.damageCount / item.useCount * 100).toFixed(1) : 0,
      lossRate: item.useCount > 0 ? (item.lossCount / item.useCount * 100).toFixed(1) : 0
    }
  })
  
  return {
    matrix,
    projects: SPORTS_PROJECTS,
    equipments: EQUIPMENT_TYPES
  }
}

export const getAgeGroupStats = async (filters) => {
  const filtered = applyFilters(mockData.registrations, filters)
  
  const stats = AGE_GROUPS.map(ageGroup => {
    const groupData = filtered.filter(r => r.ageGroupId === ageGroup.id)
    const isMinorGroup = ageGroup.id !== '18+'
    
    return {
      ageGroupId: ageGroup.id,
      ageGroupName: ageGroup.name,
      isMinor: isMinorGroup,
      registerCount: groupData.length,
      confirmCount: groupData.reduce((sum, r) => sum + r.confirmCount, 0),
      checkinCount: groupData.reduce((sum, r) => sum + r.checkinCount, 0),
      completeCount: groupData.reduce((sum, r) => sum + r.completeCount, 0),
      cancelCount: groupData.reduce((sum, r) => sum + r.cancelled, 0)
    }
  })
  
  const minorTotal = stats
    .filter(s => s.isMinor)
    .reduce((acc, s) => ({
      registerCount: acc.registerCount + s.registerCount,
      confirmCount: acc.confirmCount + s.confirmCount,
      checkinCount: acc.checkinCount + s.checkinCount,
      completeCount: acc.completeCount + s.completeCount,
      cancelCount: acc.cancelCount + s.cancelCount
    }), { registerCount: 0, confirmCount: 0, checkinCount: 0, completeCount: 0, cancelCount: 0 })
  
  return {
    byAgeGroup: stats,
    minorAggregated: {
      ...minorTotal,
      groupCount: stats.filter(s => s.isMinor).length
    }
  }
}

export const getExportData = async (filters) => {
  const [funnel, incidents, equipment, ageStats] = await Promise.all([
    getFunnelData(filters),
    getIncidentTimeline(filters),
    getEquipmentHeatmap(filters),
    getAgeGroupStats(filters)
  ])
  
  return {
    funnel,
    incidents,
    equipment,
    ageStats,
    exportTime: new Date().toISOString(),
    filters
  }
}
