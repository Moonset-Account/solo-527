import { clickhouseConfig, buildQueryUrl, TABLES } from './clickhouseConfig'
import { mockData } from './mockData'
import { CANCEL_REASONS, WEATHER_TYPES, SPORTS_PROJECTS, EQUIPMENT_TYPES, AGE_GROUPS, COACHES } from './constants'

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
        const errorText = await response.text()
        throw new Error(`ClickHouse query failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('ClickHouse query error:', error.message)
      throw error
    }
  }

  async query(sql, params = {}) {
    if (this.config.useMockData) {
      return this.mockQuery(sql, params)
    }
    return await this.executeRawQuery(sql)
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
    const whereClauseCheckin = this.buildWhereClause(filters, 'c')

    const queries = {
      funnelData: `
        SELECT
            stage,
            count
        FROM (
            SELECT 'register' as stage, sum(r.registerCount) as count
            FROM ${TABLES.REGISTRATIONS} r
            LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
            ${whereClause}
            UNION ALL
            SELECT 'confirm' as stage, sum(r.confirmCount) as count
            FROM ${TABLES.REGISTRATIONS} r
            LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
            ${whereClause}
            UNION ALL
            SELECT 'checkin' as stage, count(DISTINCT c.registrationId) as count
            FROM ${TABLES.CHECKINS} c
            LEFT JOIN ${TABLES.REGISTRATIONS} r ON c.registrationId = r.id
            LEFT JOIN ${TABLES.COACHES} co ON c.coachId = co.id
            ${whereClauseCheckin}
            UNION ALL
            SELECT 'complete' as stage, sum(r.completeCount) as count
            FROM ${TABLES.REGISTRATIONS} r
            LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
            ${whereClause}
        )
      `,

      cancelByReason: `
        SELECT
            r.cancelReasonId,
            count() as count
        FROM ${TABLES.REGISTRATIONS} r
        LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
        ${whereClause ? whereClause + ' AND' : 'WHERE'} r.cancelled = 1 
            AND r.cancelReasonId IS NOT NULL
        GROUP BY r.cancelReasonId
        ORDER BY count DESC
      `,

      cancelByWeather: `
        SELECT
            w.weatherId,
            count() as count,
            groupArray(DISTINCT r.cancelReasonId) as cancelReasonIds
        FROM ${TABLES.REGISTRATIONS} r
        LEFT JOIN ${TABLES.WEATHER} w 
            ON r.sessionId = w.sessionId 
            AND r.registerDate = w.date
        LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
        ${whereClause ? whereClause + ' AND' : 'WHERE'} r.cancelled = 1 
            AND w.weatherId IS NOT NULL
        GROUP BY w.weatherId
        ORDER BY count DESC
      `,

      incidents: `
        SELECT
            i.*,
            w.weatherId,
            wt.name as weatherName,
            w.temperature,
            w.windSpeed,
            w.visibility,
            co.name as coachName
        FROM ${TABLES.INCIDENTS} i
        LEFT JOIN ${TABLES.WEATHER} w 
            ON i.sessionId = w.sessionId 
            AND i.date = w.date
        LEFT JOIN weather_types wt ON w.weatherId = wt.id
        LEFT JOIN ${TABLES.COACHES} co ON i.coachId = co.id
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
        LEFT JOIN ${TABLES.COACHES} co ON i.coachId = co.id
        ${whereClauseIncident ? whereClauseIncident + ' AND' : 'WHERE'} w.weatherId IS NOT NULL
        GROUP BY w.weatherId
        ORDER BY total DESC
      `,

      equipment: `
        SELECT
            e.projectId,
            e.equipmentId,
            sum(e.useCount) as useCount,
            sum(e.damageCount) as damageCount,
            sum(e.lossCount) as lossCount,
            sum(e.totalWear) as totalWear
        FROM ${TABLES.EQUIPMENT_USAGE} e
        ${whereClauseEquip}
        GROUP BY e.projectId, e.equipmentId
        ORDER BY totalWear DESC
      `,

      ageStats: `
        SELECT
            r.ageGroupId,
            sum(r.registerCount) as registerCount,
            sum(r.confirmCount) as confirmCount,
            count(DISTINCT c.registrationId) as checkinCount,
            sum(r.completeCount) as completeCount,
            sum(r.cancelled) as cancelCount
        FROM ${TABLES.REGISTRATIONS} r
        LEFT JOIN ${TABLES.CHECKINS} c 
            ON r.id = c.registrationId 
            AND c.sessionId = r.sessionId
        LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
        ${whereClause}
        GROUP BY r.ageGroupId
      `,

      totalStats: `
        SELECT
            sum(r.registerCount) as totalRegister,
            sum(r.cancelled) as totalCancelled,
            count(DISTINCT c.registrationId) as totalCheckins,
            count(DISTINCT r.coachId) as activeCoaches
        FROM ${TABLES.REGISTRATIONS} r
        LEFT JOIN ${TABLES.CHECKINS} c 
            ON r.id = c.registrationId 
            AND c.sessionId = r.sessionId
        LEFT JOIN ${TABLES.COACHES} co ON r.coachId = co.id
        ${whereClause}
      `,

      coachStats: `
        SELECT
            co.id as coachId,
            co.name as coachName,
            co.specialty,
            count(DISTINCT r.id) as registrationCount,
            count(DISTINCT c.registrationId) as checkinCount,
            count(DISTINCT i.id) as incidentCount
        FROM ${TABLES.COACHES} co
        LEFT JOIN ${TABLES.REGISTRATIONS} r ON co.id = r.coachId
        LEFT JOIN ${TABLES.CHECKINS} c ON co.id = c.coachId
        LEFT JOIN ${TABLES.INCIDENTS} i ON co.id = i.coachId
        WHERE 1=1
          ${filters?.sessionId && filters.sessionId !== 'all' ? `AND (r.sessionId = '${filters.sessionId}' OR c.sessionId = '${filters.sessionId}' OR i.sessionId = '${filters.sessionId}')` : ''}
          ${filters?.projectId && filters.projectId !== 'all' ? `AND (r.projectId = '${filters.projectId}' OR c.projectId = '${filters.projectId}' OR i.projectId = '${filters.projectId}')` : ''}
          ${filters?.coachId && filters.coachId !== 'all' ? `AND co.id = '${filters.coachId}'` : ''}
        GROUP BY co.id, co.name, co.specialty
        ORDER BY registrationCount DESC
      `
    }

    const [
      funnelResult,
      cancelReasonResult,
      cancelWeatherResult,
      incidentsResult,
      incidentWeatherResult,
      equipmentResult,
      ageStatsResult,
      totalStatsResult,
      coachStatsResult
    ] = await Promise.all([
      this.executeRawQuery(queries.funnelData),
      this.executeRawQuery(queries.cancelByReason),
      this.executeRawQuery(queries.cancelByWeather),
      this.executeRawQuery(queries.incidents),
      this.executeRawQuery(queries.incidentByWeather),
      this.executeRawQuery(queries.equipment),
      this.executeRawQuery(queries.ageStats),
      this.executeRawQuery(queries.totalStats),
      this.executeRawQuery(queries.coachStats)
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
      coachStatsResult,
      filters
    })
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
      coachStatsResult,
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
      adultCount: Number(event.adultCount),
      coachName: event.coachName
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

    const coachStats = coachStatsResult.map(item => ({
      coachId: item.coachId,
      coachName: item.coachName,
      specialty: item.specialty,
      registrationCount: Number(item.registrationCount),
      checkinCount: Number(item.checkinCount),
      incidentCount: Number(item.incidentCount)
    }))

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
      coachStats,
      queryTime: new Date().toISOString(),
      filtersApplied: filters,
      dataSource: 'clickhouse'
    }
  }

  getMockUnifiedDashboardData(filters) {
    const weatherMap = this.getWeatherMap()
    
    const filteredRegs = this.applyFilters(mockData.registrations, filters)
    const filteredIncidents = this.applyFilters(mockData.incidents, filters)
    const filteredEquipment = this.applyFilters(mockData.equipmentUsage, filters)
    const filteredCheckins = this.applyFilters(mockData.checkins || [], filters)
    
    const funnelStages = ['register', 'confirm', 'checkin', 'complete']
    const stageKeys = ['registerCount', 'confirmCount', 'checkinCount', 'completeCount']
    
    const funnelData = funnelStages.map((stage, i) => {
      let count = 0
      if (stage === 'checkin') {
        count = filteredCheckins.length > 0 
          ? filteredCheckins.length 
          : filteredRegs.reduce((sum, r) => sum + (r[stageKeys[i]] || 0), 0)
      } else {
        count = filteredRegs.reduce((sum, r) => sum + (r[stageKeys[i]] || 0), 0)
      }
      return {
        stage: ['报名', '确认参加', '签到', '完成活动'][i],
        key: stage,
        count
      }
    })
    
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
      const coach = COACHES.find(c => c.id === incident.coachId)
      return {
        ...incident,
        weather: weather || null,
        coachName: coach?.name || null
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
    
    const checkinRegIds = new Set(filteredCheckins.map(c => c.registrationId))
    
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
      ageStats[ageId].completeCount += r.completeCount
      ageStats[ageId].cancelCount += r.cancelled
      if (checkinRegIds.has(r.id)) {
        ageStats[ageId].checkinCount += 1
      }
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

    const coachStats = COACHES.map(coach => {
      const coachRegs = filteredRegs.filter(r => r.coachId === coach.id)
      const coachIncidents = filteredIncidents.filter(i => i.coachId === coach.id)
      return {
        coachId: coach.id,
        coachName: coach.name,
        specialty: coach.specialty,
        registrationCount: coachRegs.length,
        checkinCount: coachRegs.filter(r => r.checkinCount > 0).length,
        incidentCount: coachIncidents.length
      }
    }).filter(c => c.registrationCount > 0 || c.incidentCount > 0)
    
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
      coachStats,
      queryTime: new Date().toISOString(),
      filtersApplied: filters,
      dataSource: 'mock'
    }
  }

  getWeatherMap() {
    const map = {}
    mockData.weatherRecords.forEach(w => {
      map[`${w.sessionId}-${w.date}`] = w
    })
    return map
  }

  applyFilters(data, filters) {
    if (!filters) return data
    
    return data.filter(item => {
      if (filters.sessionId && filters.sessionId !== 'all' && item.sessionId !== filters.sessionId) {
        return false
      }
      if (filters.projectId && filters.projectId !== 'all' && item.projectId !== filters.projectId) {
        return false
      }
      if (filters.ageGroupId && filters.ageGroupId !== 'all' && item.ageGroupId !== filters.ageGroupId) {
        return false
      }
      if (filters.coachId && filters.coachId !== 'all' && item.coachId !== filters.coachId) {
        return false
      }
      return true
    })
  }

  mockQuery(sql, params) {
    console.log('Mock query:', sql.substring(0, 100) + '...')
    return []
  }

  async getUnifiedDashboardData(filters) {
    if (this.config.useMockData) {
      return this.getMockUnifiedDashboardData(filters)
    }
    
    try {
      return await this.getUnifiedDashboardDataFromClickHouse(filters)
    } catch (error) {
      console.error('ClickHouse unified query failed:', error.message)
      throw error
    }
  }
}

export const clickhouseClient = new ClickHouseClient()
