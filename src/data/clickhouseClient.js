import { clickhouseConfig, buildQueryUrl, TABLES } from './clickhouseConfig'
import { mockData } from './mockData'
import { CANCEL_REASONS, WEATHER_TYPES, SPORTS_PROJECTS, EQUIPMENT_TYPES, AGE_GROUPS } from './constants'

class ClickHouseClient {
  constructor() {
    this.config = clickhouseConfig
  }

  async executeRawQuery(sql) {
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
      console.warn('ClickHouse query failed:', error.message)
      throw error
    }
  }

  async query(sql, params = {}) {
    if (this.config.useMockData) {
      return this.mockQuery(sql, params)
    }

    try {
      return await this.executeRawQuery(sql)
    } catch (error) {
      console.warn('ClickHouse connection failed, falling back to mock data:', error.message)
      return this.mockQuery(sql, params)
    }
  }

  buildWhereClause(filters, tableAlias = '') {
    const conditions = []
    const alias = tableAlias ? `${tableAlias}.` : ''

    if (filters?.sessionId && filters.sessionId !== 'all') {
      conditions.push(`${alias}sessionId = '${filters.sessionId}'`)
    }
    if (filters?.projectId && filters.projectId !== 'all') {
      conditions.push(`${alias}projectId = '${filters.projectId}'`)
    }
    if (filters?.ageGroupId && filters.ageGroupId !== 'all') {
      conditions.push(`${alias}ageGroupId = '${filters.ageGroupId}'`)
    }
    if (filters?.coachId && filters.coachId !== 'all') {
      conditions.push(`${alias}coachId = '${filters.coachId}'`)
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  }

  async getUnifiedDashboardDataFromClickHouse(filters) {
    const whereClause = this.buildWhereClause(filters, 'r')
    const whereClauseIncident = this.buildWhereClause(filters, 'i')
    const whereClauseEquip = this.buildWhereClause(filters, 'e')

    const queries = {
      funnelData: `
        SELECT
            'register' as stage,
            sum(registerCount) as count
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
        UNION ALL
        SELECT
            'confirm' as stage,
            sum(confirmCount) as count
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
        UNION ALL
        SELECT
            'checkin' as stage,
            sum(checkinCount) as count
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
        UNION ALL
        SELECT
            'complete' as stage,
            sum(completeCount) as count
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
      `,

      cancelByReason: `
        SELECT
            cancelReasonId,
            count() as count
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause ? whereClause + ' AND' : 'WHERE'} cancelled = 1 AND cancelReasonId IS NOT NULL
        GROUP BY cancelReasonId
      `,

      cancelByWeather: `
        SELECT
            w.weatherId,
            count() as count
        FROM ${TABLES.REGISTRATIONS} r
        LEFT JOIN ${TABLES.WEATHER} w 
            ON r.sessionId = w.sessionId 
            AND r.registerDate = w.date
        ${whereClause ? whereClause + ' AND' : 'WHERE'} r.cancelled = 1 
            AND r.cancelReasonId = 'weather'
            AND w.weatherId IS NOT NULL
        GROUP BY w.weatherId
      `,

      incidents: `
        SELECT
            i.*,
            w.weatherId,
            wt.name as weatherName,
            w.temperature,
            w.windSpeed,
            w.visibility
        FROM ${TABLES.INCIDENTS} i
        LEFT JOIN ${TABLES.WEATHER} w 
            ON i.sessionId = w.sessionId 
            AND i.date = w.date
        LEFT JOIN weather_types wt ON w.weatherId = wt.id
        ${whereClauseIncident}
        ORDER BY i.date DESC, i.time DESC
      `,

      incidentByWeather: `
        SELECT
            w.weatherId,
            count() as total,
            sum(if(i.level = 'minor', 1, 0)) as minor,
            sum(if(i.level = 'medical', 1, 0)) as medical,
            sum(if(i.level = 'suspend', 1, 0)) as suspend
        FROM ${TABLES.INCIDENTS} i
        LEFT JOIN ${TABLES.WEATHER} w 
            ON i.sessionId = w.sessionId 
            AND i.date = w.date
        ${whereClauseIncident ? whereClauseIncident + ' AND' : 'WHERE'} w.weatherId IS NOT NULL
        GROUP BY w.weatherId
        ORDER BY total DESC
      `,

      equipment: `
        SELECT
            projectId,
            equipmentId,
            sum(useCount) as useCount,
            sum(damageCount) as damageCount,
            sum(lossCount) as lossCount,
            sum(totalWear) as totalWear
        FROM ${TABLES.EQUIPMENT_USAGE} e
        ${whereClauseEquip}
        GROUP BY projectId, equipmentId
        ORDER BY totalWear DESC
      `,

      ageStats: `
        SELECT
            ageGroupId,
            sum(registerCount) as registerCount,
            sum(confirmCount) as confirmCount,
            sum(checkinCount) as checkinCount,
            sum(completeCount) as completeCount,
            sum(cancelled) as cancelCount
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
        GROUP BY ageGroupId
      `,

      totalStats: `
        SELECT
            sum(registerCount) as totalRegister,
            sum(cancelled) as totalCancelled
        FROM ${TABLES.REGISTRATIONS} r
        ${whereClause}
      `
    }

    try {
      const [
        funnelResult,
        cancelReasonResult,
        cancelWeatherResult,
        incidentsResult,
        incidentWeatherResult,
        equipmentResult,
        ageStatsResult,
        totalStatsResult
      ] = await Promise.all([
        this.executeRawQuery(queries.funnelData),
        this.executeRawQuery(queries.cancelByReason),
        this.executeRawQuery(queries.cancelByWeather),
        this.executeRawQuery(queries.incidents),
        this.executeRawQuery(queries.incidentByWeather),
        this.executeRawQuery(queries.equipment),
        this.executeRawQuery(queries.ageStats),
        this.executeRawQuery(queries.totalStats)
      ])

      return this.transformClickHouseResults({
        funnelResult,
        cancelReasonResult,
        cancelWeatherResult,
        incidentsResult,
        incidentWeatherResult,
        equipmentResult,
        ageStatsResult,
        totalStatsResult,
        filters
      })
    } catch (error) {
      console.warn('ClickHouse unified query failed, using mock data:', error.message)
      return this.getMockUnifiedDashboardData(filters)
    }
  }

  transformClickHouseResults(results) {
    const {
      funnelResult,
      cancelReasonResult,
      cancelWeatherResult,
      incidentsResult,
      incidentWeatherResult,
      equipmentResult,
      ageStatsResult,
      totalStatsResult,
      filters
    } = results

    const stageNames = {
      'register': '报名',
      'confirm': '确认参加',
      'checkin': '签到',
      'complete': '完成活动'
    }

    const funnelData = funnelResult.map(item => ({
      stage: stageNames[item.stage] || item.stage,
      key: item.stage,
      count: Number(item.count)
    }))

    const totalRegister = funnelData.find(f => f.key === 'register')?.count || 0
    const totalCancelled = Number(totalStatsResult[0]?.totalCancelled || 0)

    const cancelByReason = cancelReasonResult.map(item => ({
      reasonId: item.cancelReasonId,
      count: Number(item.count)
    }))

    const cancelByWeather = cancelWeatherResult.map(item => ({
      weatherId: item.weatherId,
      count: Number(item.count)
    }))

    const cancelRate = totalRegister > 0
      ? (totalCancelled / totalRegister * 100).toFixed(1)
      : '0'

    const incidentsWithWeather = incidentsResult.map(event => ({
      ...event,
      weather: event.weatherId ? {
        weatherId: event.weatherId,
        name: event.weatherName,
        temperature: event.temperature,
        windSpeed: event.windSpeed,
        visibility: event.visibility
      } : null,
      hasPhoto: Boolean(event.hasPhoto),
      minorCount: Number(event.minorCount),
      adultCount: Number(event.adultCount)
    }))

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

    const incidentByWeather = {}
    incidentWeatherResult.forEach(item => {
      incidentByWeather[item.weatherId] = {
        total: Number(item.total),
        minor: Number(item.minor),
        medical: Number(item.medical),
        suspend: Number(item.suspend)
      }
    })

    const equipmentMatrix = equipmentResult.map(item => {
      const project = SPORTS_PROJECTS.find(p => p.id === item.projectId)
      const equipment = EQUIPMENT_TYPES.find(e => e.id === item.equipmentId)
      
      let wearLevel = 'low'
      const totalWear = Number(item.totalWear)
      if (totalWear > 100) wearLevel = 'high'
      else if (totalWear > 50) wearLevel = 'medium'

      const useCount = Number(item.useCount)
      return {
        projectId: item.projectId,
        equipmentId: item.equipmentId,
        projectName: project?.name || item.projectId,
        equipmentName: equipment?.name || item.equipmentId,
        useCount,
        damageCount: Number(item.damageCount),
        lossCount: Number(item.lossCount),
        totalWear,
        wearLevel,
        damageRate: useCount > 0 ? (Number(item.damageCount) / useCount * 100).toFixed(1) : '0',
        lossRate: useCount > 0 ? (Number(item.lossCount) / useCount * 100).toFixed(1) : '0'
      }
    })

    const byAgeGroup = ageStatsResult.map(item => {
      const ageGroup = AGE_GROUPS.find(a => a.id === item.ageGroupId)
      return {
        ageGroupId: item.ageGroupId,
        ageGroupName: ageGroup?.name || item.ageGroupId,
        isMinor: item.ageGroupId !== '18+',
        registerCount: Number(item.registerCount),
        confirmCount: Number(item.confirmCount),
        checkinCount: Number(item.checkinCount),
        completeCount: Number(item.completeCount),
        cancelCount: Number(item.cancelCount)
      }
    })

    const minorAggregated = byAgeGroup
      .filter(s => s.isMinor)
      .reduce((acc, s) => ({
        registerCount: acc.registerCount + s.registerCount,
        confirmCount: acc.confirmCount + s.confirmCount,
        checkinCount: acc.checkinCount + s.checkinCount,
        completeCount: acc.completeCount + s.completeCount,
        cancelCount: acc.cancelCount + s.cancelCount,
        groupCount: acc.groupCount + 1
      }), { registerCount: 0, confirmCount: 0, checkinCount: 0, completeCount: 0, cancelCount: 0, groupCount: 0 })

    return {
      funnel: {
        funnelData,
        cancelByReason,
        cancelByWeather,
        totalCancelled,
        cancelRate
      },
      incidents: {
        timeline,
        byLevel: {
          minor: incidentsWithWeather.filter(i => i.level === 'minor'),
          medical: incidentsWithWeather.filter(i => i.level === 'medical'),
          suspend: incidentsWithWeather.filter(i => i.level === 'suspend')
        },
        stats: {
          total: incidentsWithWeather.length,
          minor: incidentsWithWeather.filter(i => i.level === 'minor').length,
          medical: incidentsWithWeather.filter(i => i.level === 'medical').length,
          suspend: incidentsWithWeather.filter(i => i.level === 'suspend').length,
          withPhotos: incidentsWithWeather.filter(i => i.hasPhoto).length,
          minorInvolved: incidentsWithWeather.reduce((s, i) => s + i.minorCount, 0),
          adultInvolved: incidentsWithWeather.reduce((s, i) => s + i.adultCount, 0)
        },
        byWeather: incidentByWeather
      },
      equipment: {
        matrix: equipmentMatrix,
        projects: Array.from(new Set(equipmentMatrix.map(e => e.projectId))),
        equipments: Array.from(new Set(equipmentMatrix.map(e => e.equipmentId)))
      },
      ageStats: {
        byAgeGroup,
        minorAggregated
      },
      weatherAnalysis: {
        incidentByWeather,
        cancelByWeather
      },
      queryTime: new Date().toISOString(),
      filtersApplied: filters
    }
  }

  getMockUnifiedDashboardData(filters) {
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
      
      if (r.weatherId) {
        cancelByWeather[r.weatherId] = (cancelByWeather[r.weatherId] || 0) + 1
      } else {
        const weatherKey = `${r.sessionId}-${r.registerDate}`
        const weather = weatherMap[weatherKey]
        if (weather) {
          cancelByWeather[weather.weatherId] = (cancelByWeather[weather.weatherId] || 0) + 1
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

    const equipmentMatrixWithNames = Object.values(equipmentMatrix).map(item => {
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
        damageRate: item.useCount > 0 ? (item.damageCount / item.useCount * 100).toFixed(1) : '0',
        lossRate: item.useCount > 0 ? (item.lossCount / item.useCount * 100).toFixed(1) : '0'
      }
    })
    
    const ageStats = {}
    const minorAggregate = { registerCount: 0, confirmCount: 0, checkinCount: 0, completeCount: 0, cancelCount: 0, groupCount: 0 }
    
    filteredRegs.forEach(r => {
      const ageId = r.ageGroupId
      const ageGroup = AGE_GROUPS.find(a => a.id === ageId)
      if (!ageStats[ageId]) {
        ageStats[ageId] = {
          ageGroupId: ageId,
          ageGroupName: ageGroup?.name || ageId,
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
        matrix: equipmentMatrixWithNames,
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

  mockQuery(sql, params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sqlLower = sql.toLowerCase()
        
        if (sqlLower.includes('unified') || sqlLower.includes('dashboard')) {
          resolve(this.getMockUnifiedDashboardData(params))
        } else if (sqlLower.includes('funnel') || sqlLower.includes('registrations')) {
          resolve(this.getMockUnifiedDashboardData(params).funnel)
        } else if (sqlLower.includes('incidents') || sqlLower.includes('timeline')) {
          resolve(this.getMockUnifiedDashboardData(params).incidents)
        } else if (sqlLower.includes('equipment') || sqlLower.includes('heatmap')) {
          resolve(this.getMockUnifiedDashboardData(params).equipment)
        } else if (sqlLower.includes('age_group') || sqlLower.includes('age')) {
          resolve(this.getMockUnifiedDashboardData(params).ageStats)
        } else {
          resolve(this.getMockUnifiedDashboardData(params))
        }
      }, 100 + Math.random() * 200)
    })
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

  async getUnifiedDashboardData(filters) {
    if (this.config.useMockData) {
      return this.getMockUnifiedDashboardData(filters)
    }
    
    try {
      return await this.getUnifiedDashboardDataFromClickHouse(filters)
    } catch (error) {
      console.warn('Falling back to mock data:', error.message)
      return this.getMockUnifiedDashboardData(filters)
    }
  }

  async getFunnelData(filters) {
    const result = await this.getUnifiedDashboardData(filters)
    return result.funnel
  }

  async getIncidentData(filters) {
    const result = await this.getUnifiedDashboardData(filters)
    return result.incidents
  }

  async getEquipmentData(filters) {
    const result = await this.getUnifiedDashboardData(filters)
    return result.equipment
  }

  async getAgeGroupData(filters) {
    const result = await this.getUnifiedDashboardData(filters)
    return result.ageStats
  }
}

export const clickhouseClient = new ClickHouseClient()
