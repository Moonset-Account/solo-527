import { defineStore } from 'pinia'
import { generateAllData } from '@/data/mock/generator.js'
import { cleanAllData } from '@/data/processor/cleaner.js'
import { mergeDuplicateRepairs } from '@/data/processor/merger.js'
import { 
  calcAvailability, 
  calcAvgRepairTime, 
  calcDuplicateRate,
  calcFaultsByStation,
  calcFaultsByCode,
  calcFaultsByHour,
  calcTopAnomalies
} from '@/data/processor/calculator.js'
import { applyFilters } from '@/data/query/engine.js'
import chApi from '@/utils/clickhouse.js'

function getDefaultTimeRange() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return [weekAgo.toISOString(), now.toISOString()]
}

const USE_CLICKHOUSE = !!import.meta.env.VITE_CH_ENDPOINT

export const useDataStore = defineStore('data', {
  state: () => ({
    stations: [],
    chargers: [],
    sessions: [],
    powerReadings: [],
    faultLogs: [],
    repairOrders: [],
    repairPersons: [],
    faultCodeMeta: [],
    chargerModels: [],
    
    filters: {
      stationIds: [],
      chargerModels: [],
      faultCodes: [],
      timeRange: getDefaultTimeRange(),
      repairPersonIds: []
    },
    
    drillDown: {
      level: 'overview',
      selectedStationId: null,
      selectedChargerId: null,
      selectedFaultCode: null
    },
    
    lastUpdateTime: null,
    isLoading: true,
    loadError: null,
    dataSource: USE_CLICKHOUSE ? 'clickhouse' : 'mock'
  }),
  
  getters: {
    chargerMap(state) {
      const map = new Map()
      state.chargers.forEach(c => map.set(c.id, c))
      return map
    },
    
    stationMap(state) {
      const map = new Map()
      state.stations.forEach(s => map.set(s.id, s))
      return map
    },
    
    filteredFaults(state) {
      return applyFilters(state.faultLogs, state.filters, {
        chargerMap: this.chargerMap,
        timeField: 'occur_time'
      })
    },
    
    filteredRepairs(state) {
      return applyFilters(state.repairOrders, state.filters, {
        chargerMap: this.chargerMap,
        timeField: 'create_time'
      })
    },
    
    filteredPowerReadings(state) {
      return applyFilters(state.powerReadings, state.filters, {
        chargerMap: this.chargerMap,
        timeField: 'timestamp'
      })
    },
    
    filteredSessions(state) {
      return applyFilters(state.sessions, state.filters, {
        chargerMap: this.chargerMap,
        timeField: 'start_time'
      })
    },
    
    mergedFaults() {
      return mergeDuplicateRepairs(this.filteredFaults)
    },
    
    availabilityStats() {
      if (USE_CLICKHOUSE) {
        return this._chAvailability || calcAvailability(this.chargers, this.filteredFaults, this.filters.timeRange)
      }
      return calcAvailability(this.chargers, this.filteredFaults, this.filters.timeRange)
    },
    
    avgRepairStats() {
      return calcAvgRepairTime(this.filteredRepairs)
    },
    
    duplicateStats() {
      return calcDuplicateRate(this.filteredFaults)
    },
    
    faultsByStation() {
      if (USE_CLICKHOUSE && this._chFaultsByStation) {
        return this._chFaultsByStation
      }
      return calcFaultsByStation(this.stations, this.filteredFaults, this.chargers)
    },
    
    faultsByCode() {
      return calcFaultsByCode(this.filteredFaults)
    },
    
    faultsByHour() {
      if (USE_CLICKHOUSE && this._chFaultsByHour) {
        return this._chFaultsByHour
      }
      return calcFaultsByHour(this.filteredFaults)
    },
    
    topAnomalies() {
      if (USE_CLICKHOUSE && this._chTopAnomalies) {
        return this._chTopAnomalies.map(a => ({
          type: a.anomaly_type,
          level: a.level,
          title: a.title,
          description: a.description,
          station_id: a.anomaly_type === 'station' ? a.entity_id : null,
          fault_code: a.anomaly_type === 'fault_code' ? a.entity_id : null,
          metric: a.metric_value,
          metricLabel: a.metric_label
        }))
      }
      return calcTopAnomalies(this.stations, this.chargers, this.filteredFaults, this.filteredRepairs)
    },
    
    sampleSizes(state) {
      return {
        faultMap: this.filteredFaults.length,
        powerCurve: this.filteredPowerReadings.length,
        repairTime: this.filteredRepairs.filter(r => r.status === 'completed').length,
        stationRank: this.stations.length
      }
    },
    
    activeFiltersDesc(state) {
      const parts = []
      if (state.filters.stationIds.length > 0) {
        parts.push(`${state.filters.stationIds.length}个站点`)
      }
      if (state.filters.faultCodes.length > 0) {
        parts.push(`${state.filters.faultCodes.length}种故障码`)
      }
      if (state.filters.repairPersonIds.length > 0) {
        parts.push(`${state.filters.repairPersonIds.length}位维修人员`)
      }
      return parts.length > 0 ? parts.join(' · ') : '全部数据'
    }
  },
  
  actions: {
    async loadData() {
      this.isLoading = true
      this.loadError = null
      
      try {
        if (USE_CLICKHOUSE) {
          await this._loadFromClickHouse()
        } else {
          await this._loadFromMock()
        }
      } catch (err) {
        this.loadError = err.message
        console.error('数据加载失败:', err)
        if (USE_CLICKHOUSE) {
          console.warn('ClickHouse 加载失败，回退到 Mock 数据')
          this.dataSource = 'mock-fallback'
          await this._loadFromMock()
        }
      } finally {
        this.isLoading = false
      }
    },
    
    async _loadFromClickHouse() {
      console.log('[DataStore] 从 ClickHouse 加载数据...')
      
      const timeRange = this.filters.timeRange
      
      const [
        stations,
        chargers,
        faultCodes,
        repairPersons,
        faults,
        repairs,
        powerReadings,
        sessions,
        availability,
        faultsByStation,
        faultsByHour,
        topAnomalies
      ] = await Promise.all([
        this._chQuery('SELECT station_id as id, station_name as name, region, address, lat, lng, create_time FROM dim_station ORDER BY station_id'),
        this._chQuery('SELECT charger_id as id, station_id, model, brand, rated_power, install_date, status, is_offline FROM dim_charger ORDER BY charger_id'),
        this._chQuery('SELECT fault_code as code, fault_desc as desc, severity, avg_repair_hours as avgRepairHours FROM dim_fault_code ORDER BY fault_code'),
        this._chQuery('SELECT person_id as id, person_name as name, team FROM dim_repair_person ORDER BY person_id'),
        this._chQueryTimeRange('SELECT fault_id as id, charger_id, station_id, fault_code, severity, occur_time, resolve_time, is_resolved, source FROM fact_fault_log ORDER BY occur_time DESC LIMIT 500', timeRange, 'occur_time'),
        this._chQueryTimeRange('SELECT order_id as id, fault_id, charger_id, station_id, fault_code, person_id, person_name, team, create_time, complete_time, repair_hours, status, remark FROM fact_repair_order ORDER BY create_time DESC LIMIT 300', timeRange, 'create_time'),
        this._chQueryTimeRange('SELECT reading_id as id, session_id, charger_id, timestamp, power, voltage, current, temp_c, is_anomaly FROM fact_power_reading ORDER BY timestamp DESC LIMIT 2000', timeRange, 'timestamp'),
        this._chQueryTimeRange('SELECT session_id as id, charger_id, station_id, start_time, end_time, total_kwh, avg_power, car_model, payment_amount FROM fact_charging_session ORDER BY start_time DESC LIMIT 500', timeRange, 'start_time'),
        chApi.getAvailability(timeRange),
        chApi.getFaultsByStation(timeRange),
        chApi.getFaultsByHour(timeRange),
        chApi.getTopAnomalies()
      ])
      
      this.stations = stations
      this.chargers = chargers.map(c => ({ ...c, is_offline: Boolean(c.is_offline) }))
      this.faultCodeMeta = faultCodes
      this.repairPersons = repairPersons
      this.faultLogs = faults.map(f => ({ 
        ...f, 
        is_resolved: Boolean(f.is_resolved),
        fault_desc: this._getFaultDesc(f.fault_code, faultCodes)
      }))
      this.repairOrders = repairs
      this.powerReadings = powerReadings.map(p => ({ ...p, is_anomaly: Boolean(p.is_anomaly) }))
      this.sessions = sessions
      this.lastUpdateTime = new Date().toISOString()
      
      this._chAvailability = availability[0] || calcAvailability(this.chargers, this.faultLogs, timeRange)
      this._chFaultsByStation = faultsByStation
      this._chFaultsByHour = faultsByHour
      this._chTopAnomalies = topAnomalies
      
      this.chargerModels = [...new Set(chargers.map(c => ({ model: c.model, brand: c.brand, power: c.rated_power })))]
      
      console.log('[DataStore] ClickHouse 数据加载完成')
    },
    
    async _chQuery(sql) {
      try {
        const result = await chApi.query(sql)
        return result.data || result || []
      } catch (e) {
        console.warn('ClickHouse 查询失败:', sql.slice(0, 80), '->', e.message)
        return []
      }
    },
    
    async _chQueryTimeRange(sql, timeRange, timeField) {
      if (!timeRange || !timeRange[0] || !timeRange[1]) {
        return this._chQuery(sql)
      }
      const start = timeRange[0].replace('T', ' ').slice(0, 19)
      const end = timeRange[1].replace('T', ' ').slice(0, 19)
      const sqlWithRange = sql.replace(
        'ORDER BY',
        `WHERE ${timeField} >= '${start}' AND ${timeField} <= '${end}' ORDER BY`
      )
      return this._chQuery(sqlWithRange)
    },
    
    _getFaultDesc(code, meta) {
      const found = meta.find(m => m.code === code)
      return found ? found.desc : code
    },
    
    async _loadFromMock() {
      await new Promise(resolve => setTimeout(resolve, 500))
      const rawData = generateAllData()
      const cleaned = cleanAllData(rawData)
      
      this.stations = cleaned.stations
      this.chargers = cleaned.chargers
      this.sessions = cleaned.sessions
      this.powerReadings = cleaned.powerReadings
      this.faultLogs = cleaned.faultLogs
      this.repairOrders = cleaned.repairOrders
      this.repairPersons = cleaned.repairPersons
      this.faultCodeMeta = cleaned.faultCodeMeta
      this.chargerModels = cleaned.chargerModels
      this.lastUpdateTime = cleaned.lastUpdateTime
    },
    
    setFilter(key, value) {
      this.filters[key] = value
      
      if (USE_CLICKHOUSE && (key === 'timeRange' || key === 'stationIds')) {
        this._refreshClickHouseData()
      }
    },
    
    async _refreshClickHouseData() {
      if (!USE_CLICKHOUSE) return
      
      try {
        const timeRange = this.filters.timeRange
        const [
          faults,
          repairs,
          powerReadings,
          availability,
          faultsByStation,
          faultsByHour,
          topAnomalies
        ] = await Promise.all([
          this._chQueryTimeRange('SELECT fault_id as id, charger_id, station_id, fault_code, severity, occur_time, resolve_time, is_resolved, source FROM fact_fault_log ORDER BY occur_time DESC LIMIT 500', timeRange, 'occur_time'),
          this._chQueryTimeRange('SELECT order_id as id, fault_id, charger_id, station_id, fault_code, person_id, person_name, team, create_time, complete_time, repair_hours, status, remark FROM fact_repair_order ORDER BY create_time DESC LIMIT 300', timeRange, 'create_time'),
          this._chQueryTimeRange('SELECT reading_id as id, session_id, charger_id, timestamp, power, voltage, current, temp_c, is_anomaly FROM fact_power_reading ORDER BY timestamp DESC LIMIT 2000', timeRange, 'timestamp'),
          chApi.getAvailability(timeRange),
          chApi.getFaultsByStation(timeRange),
          chApi.getFaultsByHour(timeRange),
          chApi.getTopAnomalies()
        ])
        
        this.faultLogs = faults.map(f => ({ 
          ...f, 
          is_resolved: Boolean(f.is_resolved),
          fault_desc: this._getFaultDesc(f.fault_code, this.faultCodeMeta)
        }))
        this.repairOrders = repairs
        this.powerReadings = powerReadings.map(p => ({ ...p, is_anomaly: Boolean(p.is_anomaly) }))
        this._chAvailability = availability[0] || calcAvailability(this.chargers, this.faultLogs, timeRange)
        this._chFaultsByStation = faultsByStation
        this._chFaultsByHour = faultsByHour
        this._chTopAnomalies = topAnomalies
      } catch (e) {
        console.warn('刷新 ClickHouse 数据失败:', e.message)
      }
    },
    
    resetFilters() {
      this.filters = {
        stationIds: [],
        chargerModels: [],
        faultCodes: [],
        timeRange: getDefaultTimeRange(),
        repairPersonIds: []
      }
      this.drillDown = {
        level: 'overview',
        selectedStationId: null,
        selectedChargerId: null,
        selectedFaultCode: null
      }
      
      if (USE_CLICKHOUSE) {
        this._refreshClickHouseData()
      }
    },
    
    drillToStation(stationId) {
      this.drillDown.level = 'station'
      this.drillDown.selectedStationId = stationId
      if (stationId) {
        this.filters.stationIds = [stationId]
      }
    },
    
    drillToFaultCode(faultCode) {
      this.drillDown.level = 'fault_code'
      this.drillDown.selectedFaultCode = faultCode
      if (faultCode) {
        this.filters.faultCodes = [faultCode]
      }
    },
    
    drillToPerson(personId) {
      if (personId) {
        this.filters.repairPersonIds = [personId]
      }
    },
    
    goBack() {
      if (this.drillDown.level === 'station') {
        this.drillDown.level = 'overview'
        this.drillDown.selectedStationId = null
        this.filters.stationIds = []
      } else if (this.drillDown.level === 'fault_code') {
        this.drillDown.level = 'overview'
        this.drillDown.selectedFaultCode = null
        this.filters.faultCodes = []
      }
    }
  }
})
