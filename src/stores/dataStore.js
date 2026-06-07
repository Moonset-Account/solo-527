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

function getDefaultTimeRange() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return [weekAgo.toISOString(), now.toISOString()]
}

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
    loadError: null
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
      return calcAvailability(this.chargers, this.filteredFaults, this.filters.timeRange)
    },
    
    avgRepairStats() {
      return calcAvgRepairTime(this.filteredRepairs)
    },
    
    duplicateStats() {
      return calcDuplicateRate(this.filteredFaults)
    },
    
    faultsByStation() {
      return calcFaultsByStation(this.stations, this.filteredFaults, this.chargers)
    },
    
    faultsByCode() {
      return calcFaultsByCode(this.filteredFaults)
    },
    
    faultsByHour() {
      return calcFaultsByHour(this.filteredFaults)
    },
    
    topAnomalies() {
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
      } catch (err) {
        this.loadError = err.message
        console.error('数据加载失败:', err)
      } finally {
        this.isLoading = false
      }
    },
    
    setFilter(key, value) {
      this.filters[key] = value
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
