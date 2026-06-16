import { defineStore } from 'pinia'

export const useReminderStore = defineStore('reminder', {
  state: () => ({
    reminders: [] as any[],
    reminderConfigs: [] as any[],
    loading: false
  }),
  actions: {
    async fetchReminders(params: Record<string, any> = {}) {
      this.loading = true
      try {
        this.reminders = await $fetch<any[]>('/api/reminders', { params })
      } finally {
        this.loading = false
      }
    },
    async fetchConfigs() {
      this.reminderConfigs = await $fetch<any[]>('/api/reminder-configs')
    },
    async createConfig(data: Record<string, any>) {
      return $fetch('/api/reminder-configs', { method: 'POST', body: data })
    },
    async updateConfig(id: number, data: Record<string, any>) {
      return $fetch(`/api/reminder-configs/${id}`, { method: 'PUT', body: data })
    },
    async createReminder(data: Record<string, any>) {
      return $fetch('/api/reminders', { method: 'POST', body: data })
    }
  }
})
