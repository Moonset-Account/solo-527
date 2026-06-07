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
  fetchComplaints,
  fetchTrafficData,
} from '@/api/mockApi'

interface DataState {
  stations: MonitorStation[]
  timeSeries: AirQualityReading[]
  heatmap: DistrictHeatmap[]
  constructionSites: ConstructionSite[]
  complaints: ComplaintAggregate[]
  trafficData: TrafficData[]
  loading: {
    stations: boolean
    timeSeries: boolean
    heatmap: boolean
    construction: boolean
    complaints: boolean
    traffic: boolean
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
    loading: {
      stations: false,
      timeSeries: false,
      heatmap: false,
      construction: false,
      complaints: false,
      traffic: false,
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
  },

  actions: {
    async loadAll(filterCriteria: {
      stations: string[]
      pollutants: string[]
      timeRange: { start: string; end: string }
      districts: string[]
    }) {
      try {
        this.error = null
        await Promise.all([
          this.loadStations(filterCriteria.districts),
          this.loadTimeSeries(filterCriteria),
          this.loadHeatmap(),
          this.loadConstructionSites(),
          this.loadComplaints(filterCriteria.timeRange),
          this.loadTrafficData(filterCriteria.districts),
        ])
      } catch (e: any) {
        this.error = e.message || '数据加载失败'
      }
    },

    async loadStations(districts: string[] = []) {
      this.loading.stations = true
      try {
        const district = districts.length === 1 ? districts[0] : undefined
        this.stations = await fetchStations(district)
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
        const stationIds = criteria.stations.length > 0
          ? criteria.stations
          : this.stations.slice(0, 5).map(s => s.id)
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

    async loadConstructionSites() {
      this.loading.construction = true
      try {
        this.constructionSites = await fetchConstructionSites()
      } finally {
        this.loading.construction = false
      }
    },

    async loadComplaints(timeRange: { start: string; end: string }) {
      this.loading.complaints = true
      try {
        const start = timeRange.start.split('T')[0]
        const end = timeRange.end.split('T')[0]
        this.complaints = await fetchComplaints(undefined, start, end)
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
