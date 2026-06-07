import { defineStore } from 'pinia'
import type {
  MonitorStation,
  AirQualityReading,
  DistrictHeatmap,
  ConstructionSite,
  ComplaintAggregate,
  TrafficData,
} from '@/types'
import {
  fetchStations,
  fetchTimeSeries,
  fetchHeatmap,
  fetchConstructionSites,
  fetchComplaintsAggregate,
  fetchTrafficData,
  getLinkedFilterOptions,
  type LinkedFilterResult,
} from '@/api/aggregateApi'

interface DataState {
  stations: MonitorStation[]
  timeSeries: AirQualityReading[]
  heatmap: DistrictHeatmap[]
  constructionSites: ConstructionSite[]
  complaints: ComplaintAggregate[]
  trafficData: TrafficData[]
  linkedFilters: LinkedFilterResult | null
  loading: {
    stations: boolean
    timeSeries: boolean
    heatmap: boolean
    construction: boolean
    complaints: boolean
    traffic: boolean
    linkedFilters: boolean
  }
  error: string | null
}

export const useDataStore = defineStore('data', {
  state: (): DataState => ({
    stations: [],
    timeSeries: [],
    heatmap: [],
    constructionSites: [],
    complaints: [],
    trafficData: [],
    linkedFilters: null,
    loading: {
      stations: false,
      timeSeries: false,
      heatmap: false,
      construction: false,
      complaints: false,
      traffic: false,
      linkedFilters: false,
    },
    error: null,
  }),

  getters: {
    stationMap: (state) => {
      return new Map(state.stations.map(s => [s.id, s]))
    },

    stationById: (state) => (id: string) => {
      return state.stations.find(s => s.id === id)
    },

    onlineStations: (state) => {
      return state.stations.filter(s => s.status === 'online' || s.status === 'warning')
    },

    offlineStations: (state) => {
      return state.stations.filter(s => s.status === 'offline')
    },

    latestReadings: (state) => {
      const latest = new Map<string, AirQualityReading>()
      for (const reading of state.timeSeries) {
        const existing = latest.get(reading.stationId)
        if (!existing || new Date(reading.timestamp) > new Date(existing.timestamp)) {
          latest.set(reading.stationId, reading)
        }
      }
      return latest
    },

    availableDistrictsForStations: (state) => {
      return (stationIds: string[]) => {
        if (stationIds.length === 0) return Array.from(new Set(state.stations.map(s => s.district)))
        return Array.from(new Set(
          state.stations.filter(s => stationIds.includes(s.id)).map(s => s.district)
        ))
      }
    },

    availableStationsForDistricts: (state) => {
      return (districts: string[]) => {
        if (districts.length === 0) return state.stations
        return state.stations.filter(s => districts.includes(s.district))
      }
    },
  },

  actions: {
    async loadAll(filterCriteria: {
      stations: string[]
      pollutants: string[]
      timeRange: { start: string; end: string }
      districts: string[]
      eventTypes: string[]
    }) {
      try {
        this.error = null
        await this.loadStations(filterCriteria.districts)
        await Promise.all([
          this.loadLinkedFilters(filterCriteria),
          this.loadTimeSeries(filterCriteria),
          this.loadHeatmap(),
          this.loadConstructionSites({ districts: filterCriteria.districts }),
          this.loadComplaints(filterCriteria.timeRange, filterCriteria.districts),
          this.loadTrafficData(filterCriteria.districts),
        ])
      } catch (e: any) {
        this.error = e.message || '数据加载失败'
      }
    },

    async loadLinkedFilters(criteria: {
      districts?: string[]
      stations?: string[]
      timeRange?: { start: string; end: string }
      eventTypes?: string[]
    }) {
      this.loading.linkedFilters = true
      try {
        this.linkedFilters = await getLinkedFilterOptions(criteria)
      } finally {
        this.loading.linkedFilters = false
      }
    },

    async loadStations(districts: string[] = []) {
      this.loading.stations = true
      try {
        if (districts.length === 1) {
          this.stations = await fetchStations({ district: districts[0] })
        } else {
          this.stations = await fetchStations()
          if (districts.length > 1) {
            this.stations = this.stations.filter(s => districts.includes(s.district))
          }
        }
      } finally {
        this.loading.stations = false
      }
    },

    async loadTimeSeries(criteria: {
      stations: string[]
      pollutants: string[]
      timeRange: { start: string; end: string }
    }) {
      this.loading.timeSeries = true
      try {
        let stationIds = criteria.stations
        if (stationIds.length === 0) {
          if (this.stations.length > 0) {
            stationIds = this.stations.slice(0, 5).map(s => s.id)
          } else {
            stationIds = ['ST001', 'ST002', 'ST003', 'ST004', 'ST005']
          }
        }
        this.timeSeries = await fetchTimeSeries(
          stationIds,
          criteria.timeRange.start,
          criteria.timeRange.end,
          criteria.pollutants
        )
      } finally {
        this.loading.timeSeries = false
      }
    },

    async loadHeatmap() {
      this.loading.heatmap = true
      try {
        const today = new Date().toISOString().split('T')[0]
        this.heatmap = await fetchHeatmap(today)
      } finally {
        this.loading.heatmap = false
      }
    },

    async loadConstructionSites(options?: { districts?: string[]; status?: 'active' | 'completed' }) {
      this.loading.construction = true
      try {
        let sites = await fetchConstructionSites({
          status: options?.status,
        })
        if (options?.districts && options.districts.length > 0) {
          sites = sites.filter(s => options.districts!.includes(s.district))
        }
        this.constructionSites = sites
      } finally {
        this.loading.construction = false
      }
    },

    async loadComplaints(timeRange: { start: string; end: string }, districts?: string[]) {
      this.loading.complaints = true
      try {
        const start = timeRange.start.split('T')[0]
        const end = timeRange.end.split('T')[0]
        const district = districts && districts.length === 1 ? districts[0] : undefined
        let data = await fetchComplaintsAggregate(district, start, end)
        if (districts && districts.length > 1) {
          data = data.filter(c => districts.includes(c.district))
        }
        this.complaints = data
      } finally {
        this.loading.complaints = false
      }
    },

    async loadTrafficData(districts: string[] = []) {
      this.loading.traffic = true
      try {
        const targetDistricts = districts.length > 0 ? districts : ['朝阳区', '海淀区', '东城区']
        this.trafficData = await fetchTrafficData(targetDistricts, 24)
      } finally {
        this.loading.traffic = false
      }
    },
  },
})
