import { defineStore } from 'pinia'
import type { FilterState } from '@/types'

export const useFilterStore = defineStore('filter', {
  state: (): FilterState => ({
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    selectedSurveys: [],
    selectedChannels: [],
    selectedRegions: [],
    selectedDevices: [],
    selectedQuestionGroups: [],
    anomalyTypes: [],
    qualityMarks: [],
  }),

  actions: {
    setTimeRange(start: string, end: string) {
      this.timeRange = { start, end }
    },

    setSelectedSurveys(ids: string[]) {
      this.selectedSurveys = ids
    },

    setSelectedChannels(ids: string[]) {
      this.selectedChannels = ids
    },

    setSelectedRegions(ids: string[]) {
      this.selectedRegions = ids
    },

    setSelectedDevices(ids: string[]) {
      this.selectedDevices = ids
    },

    setSelectedQuestionGroups(ids: string[]) {
      this.selectedQuestionGroups = ids
    },

    setAnomalyTypes(types: string[]) {
      this.anomalyTypes = types
    },

    setQualityMarks(marks: string[]) {
      this.qualityMarks = marks
    },

    resetFilters() {
      this.selectedSurveys = []
      this.selectedChannels = []
      this.selectedRegions = []
      this.selectedDevices = []
      this.selectedQuestionGroups = []
      this.anomalyTypes = []
      this.qualityMarks = []
    },
  },
})
