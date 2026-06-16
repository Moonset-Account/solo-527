import { defineStore } from 'pinia'

export const useInterviewStore = defineStore('interview', {
  state: () => ({
    interviews: [] as any[],
    interviewers: [] as any[],
    loading: false
  }),
  actions: {
    async fetchInterviews(params: Record<string, any> = {}) {
      this.loading = true
      try {
        this.interviews = await $fetch<any[]>('/api/interviews', { params })
      } finally {
        this.loading = false
      }
    },
    async fetchInterviewers() {
      this.interviewers = await $fetch<any[]>('/api/interviewers')
    },
    async createInterview(data: Record<string, any>) {
      return $fetch('/api/interviews', { method: 'POST', body: data })
    },
    async updateInterview(id: number, data: Record<string, any>) {
      return $fetch(`/api/interviews/${id}`, { method: 'PUT', body: data })
    },
    async markNoShow(id: number, data: Record<string, any>) {
      return $fetch(`/api/interviews/${id}/no-show`, { method: 'POST', body: data })
    },
    async createInterviewer(data: Record<string, any>) {
      return $fetch('/api/interviewers', { method: 'POST', body: data })
    }
  }
})
