import { defineStore } from 'pinia'
import type { SystemStatus } from '@/types'
import { fetchSystemStatus } from '@/api/aggregateApi'

interface SystemState {
  status: SystemStatus | null
  loading: boolean
  lastUpdate: string | null
  pollTimer: ReturnType<typeof setInterval> | null
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    status: null,
    loading: false,
    lastUpdate: null,
    pollTimer: null,
  }),

  getters: {
    isAllOnline: (state) => {
      if (!state.status) return false
      return state.status.onlineStations === state.status.totalStations
    },

    offlineCount: (state) => {
      if (!state.status) return 0
      return state.status.totalStations - state.status.onlineStations
    },

    formattedLastUpdate: (state) => {
      if (!state.status) return '--'
      const date = new Date(state.status.lastUpdate)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
  },

  actions: {
    async loadStatus() {
      this.loading = true
      try {
        this.status = await fetchSystemStatus()
        this.lastUpdate = new Date().toISOString()
      } finally {
        this.loading = false
      }
    },

    startPolling(intervalMs: number = 60000) {
      this.stopPolling()
      this.loadStatus()
      this.pollTimer = setInterval(() => {
        this.loadStatus()
      }, intervalMs)
    },

    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
  },
})
