import { defineStore } from 'pinia'
import type { FilterCriteria } from '@/types'
import { POLLUTANT_CONFIG } from '@/types'

interface FilterState {
  criteria: FilterCriteria
  isInitialized: boolean
}

const defaultTimeRange = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export const useFilterStore = defineStore('filter', {
  state: (): FilterState => ({
    criteria: {
      stations: [],
      pollutants: ['pm25', 'ozone', 'aqi'],
      timeRange: defaultTimeRange(),
      districts: [],
      eventTypes: ['construction', 'complaint', 'traffic'],
    },
    isInitialized: false,
  }),

  getters: {
    pollutantLabels: (state) => {
      return state.criteria.pollutants.map(p => {
        const config = (POLLUTANT_CONFIG as any)[p]
        return config ? config.name : p
      })
    },
  },

  actions: {
    initializeFromUrl() {
      if (this.isInitialized) return
      try {
        const params = new URLSearchParams(window.location.search)
        const stations = params.get('stations')
        const pollutants = params.get('pollutants')
        const start = params.get('start')
        const end = params.get('end')
        const districts = params.get('districts')

        if (stations) this.criteria.stations = stations.split(',')
        if (pollutants) this.criteria.pollutants = pollutants.split(',')
        if (start && end) this.criteria.timeRange = { start, end }
        if (districts) this.criteria.districts = districts.split(',')
      } catch (e) {
        console.warn('Failed to parse URL params', e)
      }
      this.isInitialized = true
    },

    syncToUrl() {
      const params = new URLSearchParams()
      if (this.criteria.stations.length > 0) {
        params.set('stations', this.criteria.stations.join(','))
      }
      if (this.criteria.pollutants.length > 0) {
        params.set('pollutants', this.criteria.pollutants.join(','))
      }
      params.set('start', this.criteria.timeRange.start)
      params.set('end', this.criteria.timeRange.end)
      if (this.criteria.districts.length > 0) {
        params.set('districts', this.criteria.districts.join(','))
      }
      const query = params.toString()
      const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    },

    setStations(stations: string[]) {
      this.criteria.stations = stations
      this.syncToUrl()
    },

    setPollutants(pollutants: string[]) {
      this.criteria.pollutants = pollutants
      this.syncToUrl()
    },

    setTimeRange(start: string, end: string) {
      this.criteria.timeRange = { start, end }
      this.syncToUrl()
    },

    setDistricts(districts: string[]) {
      this.criteria.districts = districts
      this.syncToUrl()
    },

    setEventTypes(types: string[]) {
      this.criteria.eventTypes = types
    },

    reset() {
      this.criteria = {
        stations: [],
        pollutants: ['pm25', 'ozone', 'aqi'],
        timeRange: defaultTimeRange(),
        districts: [],
        eventTypes: ['construction', 'complaint', 'traffic'],
      }
      this.syncToUrl()
    },
  },
})
