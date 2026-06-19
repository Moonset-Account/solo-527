import { create } from 'zustand'
import type { CompletenessStats, DurationStats, ReminderStats, TimeoutRankItem } from '../../shared/types'

interface StatisticsState {
  completeness: CompletenessStats | null
  duration: DurationStats[]
  reminders: ReminderStats[]
  timeoutRank: TimeoutRankItem[]
  fetchCompleteness: () => Promise<void>
  fetchDuration: () => Promise<void>
  fetchReminders: () => Promise<void>
  fetchTimeoutRank: () => Promise<void>
  fetchAll: () => Promise<void>
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  completeness: null,
  duration: [],
  reminders: [],
  timeoutRank: [],

  fetchCompleteness: async () => {
    try {
      const res = await fetch('/api/statistics/completeness')
      const json = await res.json()
      set({ completeness: json.data })
    } catch {}
  },

  fetchDuration: async () => {
    try {
      const res = await fetch('/api/statistics/duration')
      const json = await res.json()
      set({ duration: json.data })
    } catch {}
  },

  fetchReminders: async () => {
    try {
      const res = await fetch('/api/statistics/reminders')
      const json = await res.json()
      set({ reminders: json.data })
    } catch {}
  },

  fetchTimeoutRank: async () => {
    try {
      const res = await fetch('/api/statistics/timeout-rank')
      const json = await res.json()
      set({ timeoutRank: json.data })
    } catch {}
  },

  fetchAll: async () => {
    const { fetchCompleteness, fetchDuration, fetchReminders, fetchTimeoutRank } = get()
    await Promise.all([fetchCompleteness(), fetchDuration(), fetchReminders(), fetchTimeoutRank()])
  },
}))
