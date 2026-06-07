import { clickhouseConfig, buildQueryUrl, TABLES } from './clickhouseConfig'
import { mockData } from './mockData'

class ClickHouseClient {
  constructor() {
    this.config = clickhouseConfig
  }

  async query(sql, params = {}) {
    if (this.config.useMockData) {
      return this.mockQuery(sql, params)
    }

    try {
      const url = buildQueryUrl(`${sql} FORMAT JSON`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-ClickHouse-User': this.config.user,
          'X-ClickHouse-Key': this.config.password,
          'X-ClickHouse-Database': this.config.database
        }
      })

      if (!response.ok) {
        throw new Error(`ClickHouse query failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.warn('ClickHouse connection failed, falling back to mock data:', error.message)
      return this.mockQuery(sql, params)
    }
  }

  mockQuery(sql, params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.executeMockQuery(sql, params))
      }, 100 + Math.random() * 200)
    })
  }

  executeMockQuery(sql, params) {
    const sqlLower = sql.toLowerCase()
    
    if (sqlLower.includes('select') && sqlLower.includes('funnel') || sqlLower.includes('registrations')) {
      return this.getFunnelData(params)
    }
    if (sqlLower.includes('incidents') || sqlLower.includes('timeline')) {
      return this.getIncidentData(params)
    }
    if (sqlLower.includes('equipment') || sqlLower.includes('heatmap')) {
      return this.getEquipmentData(params)
    }
    if (sqlLower.includes('age_group') || sqlLower.includes('age')) {
      return this.getAgeGroupData(params)
    }
    if (sqlLower.includes('unified') || sqlLower.includes('dashboard')) {
      return this.getUnifiedDashboardData(params)
    }
    
    return []
  }

  applyFilters(data, filters) {
    return data.filter(item => {
      if (filters?.sessionId && filters.sessionId !== 'all' && item.sessionId !== filters.sessionId) return false
      if (filters?.projectId && filters.projectId !== 'all' && item.projectId !== filters.projectId) return false
      if (filters?.ageGroupId && filters.ageGroupId !== 'all' && item.ageGroupId !== filters.ageGroupId) return false
      if (filters?.coachId && filters.coachId !== 'all' && item.coachId !== filters.coachId) return false
      return true
    })
  }

  getWeatherMap() {
    const weatherMap = {}
    mockData.weatherRecords.forEach(w => {
      weatherMap[`${w.sessionId}-${w.date}`] = w
    })
    return weatherMap
  }

  getUnifiedDashboardData(filters) {
    const weatherMap = this.getWeatherMap()
    
    const filteredRegs = this.applyFilters(mockData.registrations, filters)
    const filteredIncidents = this.applyFilters(mockData.incidents, filters)
    const filteredEquipment = this.applyFilters(mockData.equipmentUsage, filters)
    
    const funnelStages = ['register', 'confirm', 'checkin', 'complete']
    const stageKeys = ['registerCount', 'confirmCount', 'checkinCount', 'completeCount']
    
    const funnelData = funnelStages.map((stage, i) => ({
      stage: ['报名', '确认参加', '签到', '完成活动'][i],
      key: stage,
      count: filteredRegs.reduce((sum, r) => sum + (r[stageKeys[i]] || 0), 0)
    }))
    
    const cancelByReason = {}
    const cancelByWeather = {}
    
    filteredRegs.filter(r => r.cancelled).forEach(r => {
      const reasonId = r.cancelReasonId || 'other'
      cancelByReason[reasonId] = (cancelByReason[reasonId] || 0) + 1
      
      const weatherKey = `${r.sessionId}-${r.registerDate}`
      const weather = weatherMap[weatherKey]
      if (weather) {
        if (weather.weatherId === 'rainy' || weather.weatherId === 'stormy' || weather.weatherId === 'windy') {
          if (reasonId === 'weather') {
            cancelByWeather[weather.weatherId] = (cancelByWeather[weather.weatherId] || 0) + 1
          }
        }
      }
    })
    
    const incidentsWithWeather = filteredIncidents.map(incident => {
      const weatherKey = `${incident.sessionId}-${incident.date}`
      const weather = weatherMap[weatherKey]
      return {
        ...incident,
        weather: weather || null
      }
    })
    
    const incidentByWeather = {}
    incidentsWithWeather.forEach(inc => {
      if (inc.weather) {
        const wid = inc.weather.weatherId
        incidentByWeather[wid] = incidentByWeather[wid] || { total: 0, minor: 0, medical: 0, suspend: 0 }
        incidentByWeather[wid].total++
        incidentByWeather[wid][inc.level]++
      }
    })
    
    const equipmentMatrix = {}
    filteredEquipment.forEach(item => {
      const key = `${item.projectId}-${item.equipmentId}`
      if (!equipmentMatrix[key]) {
        equipmentMatrix[key] = {
          projectId: item.projectId,
          equipmentId: item.equipmentId,
          useCount: 0,
          damageCount: 0,
          lossCount: 0,
          totalWear: 0
        }
      }
      equipmentMatrix[key].useCount += item.useCount
      equipmentMatrix[key].damageCount += item.damageCount
      equipmentMatrix[key].lossCount += item.lossCount
      equipmentMatrix[key].totalWear += item.totalWear
    })
    
    const ageStats = {}
    const minorAggregate = { registerCount: 0, confirmCount: 0, checkinCount: 0, completeCount: 0, cancelCount: 0, groupCount: 0 }
    
    filteredRegs.forEach(r => {
      const ageId = r.ageGroupId
      if (!ageStats[ageId]) {
        ageStats[ageId] = {
          ageGroupId: ageId,
          registerCount: 0,
          confirmCount: 0,
          checkinCount: 0,
          completeCount: 0,
          cancelCount: 0,
          isMinor: ageId !== '18+'
        }
      }
      ageStats[ageId].registerCount += r.registerCount
      ageStats[ageId].confirmCount += r.confirmCount
      ageStats[ageId].checkinCount += r.checkinCount
      ageStats[ageId].completeCount += r.completeCount
      ageStats[ageId].cancelCount += r.cancelled
    })
    
    Object.values(ageStats).forEach(s => {
      if (s.isMinor) {
        minorAggregate.registerCount += s.registerCount
        minorAggregate.confirmCount += s.confirmCount
        minorAggregate.checkinCount += s.checkinCount
        minorAggregate.completeCount += s.completeCount
        minorAggregate.cancelCount += s.cancelCount
        minorAggregate.groupCount++
      }
    })
    
    const incidentByDate = {}
    incidentsWithWeather.forEach(incident => {
      if (!incidentByDate[incident.date]) {
        incidentByDate[incident.date] = []
      }
      incidentByDate[incident.date].push(incident)
    })
    
    const timeline = Object.entries(incidentByDate)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, events]) => ({ date, events }))
    
    return {
      funnel: {
        funnelData,
        cancelByReason: Object.entries(cancelByReason).map(([reasonId, count]) => ({ reasonId, count })),
        cancelByWeather: Object.entries(cancelByWeather).map(([weatherId, count]) => ({ weatherId, count })),
        totalCancelled: filteredRegs.reduce((s, r) => s + r.cancelled, 0),
        cancelRate: funnelData[0].count > 0 
          ? (filteredRegs.reduce((s, r) => s + r.cancelled, 0) / funnelData[0].count * 100).toFixed(1)
          : '0'
      },
      incidents: {
        timeline,
        byLevel: {
          minor: filteredIncidents.filter(i => i.level === 'minor'),
          medical: filteredIncidents.filter(i => i.level === 'medical'),
          suspend: filteredIncidents.filter(i => i.level === 'suspend')
        },
        stats: {
          total: filteredIncidents.length,
          minor: filteredIncidents.filter(i => i.level === 'minor').length,
          medical: filteredIncidents.filter(i => i.level === 'medical').length,
          suspend: filteredIncidents.filter(i => i.level === 'suspend').length,
          withPhotos: filteredIncidents.filter(i => i.hasPhoto).length,
          minorInvolved: filteredIncidents.reduce((s, i) => s + i.minorCount, 0),
          adultInvolved: filteredIncidents.reduce((s, i) => s + i.adultCount, 0)
        },
        byWeather: incidentByWeather
      },
      equipment: {
        matrix: Object.values(equipmentMatrix),
        projects: Array.from(new Set(filteredEquipment.map(e => e.projectId))),
        equipments: Array.from(new Set(filteredEquipment.map(e => e.equipmentId)))
      },
      ageStats: {
        byAgeGroup: Object.values(ageStats),
        minorAggregated: minorAggregate
      },
      weatherAnalysis: {
        incidentByWeather,
        cancelByWeather: Object.entries(cancelByWeather).map(([weatherId, count]) => ({ weatherId, count }))
      },
      queryTime: new Date().toISOString(),
      filtersApplied: filters
    }
  }

  getFunnelData(filters) {
    const result = this.getUnifiedDashboardData(filters)
    return result.funnel
  }

  getIncidentData(filters) {
    const result = this.getUnifiedDashboardData(filters)
    return result.incidents
  }

  getEquipmentData(filters) {
    const result = this.getUnifiedDashboardData(filters)
    return result.equipment
  }

  getAgeGroupData(filters) {
    const result = this.getUnifiedDashboardData(filters)
    return result.ageStats
  }
}

export const clickhouseClient = new ClickHouseClient()
