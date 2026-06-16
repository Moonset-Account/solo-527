import { defineStore } from 'pinia'

interface Candidate {
  id: number
  name: string
  email: string
  position: string
  department: string
  currentStage: string
  status: string
  [key: string]: any
}

export const useCandidateStore = defineStore('candidate', {
  state: () => ({
    candidates: [] as Candidate[],
    currentCandidate: null as Candidate | null,
    total: 0,
    loading: false
  }),
  actions: {
    async fetchCandidates(params: Record<string, any> = {}) {
      this.loading = true
      try {
        const res = await $fetch<any>('/api/candidates', { params })
        this.candidates = res.data
        this.total = res.total
      } finally {
        this.loading = false
      }
    },
    async fetchCandidate(id: number) {
      this.loading = true
      try {
        this.currentCandidate = await $fetch<Candidate>(`/api/candidates/${id}`)
      } finally {
        this.loading = false
      }
    },
    async createCandidate(data: Record<string, any>) {
      return $fetch('/api/candidates', { method: 'POST', body: data })
    },
    async updateCandidate(id: number, data: Record<string, any>) {
      return $fetch(`/api/candidates/${id}`, { method: 'PUT', body: data })
    },
    async changeStage(id: number, data: Record<string, any>) {
      return $fetch(`/api/candidates/${id}/stage`, { method: 'POST', body: data })
    }
  }
})
