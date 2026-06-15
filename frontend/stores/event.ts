import { defineStore } from 'pinia'

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as any[],
    currentEvent: null as any,
    flowLogs: [] as any[],
    total: 0,
    loading: false,
    stats: {
      pending: 0,
      assigned: 0,
      rectifying: 0,
      reviewing: 0,
      closed: 0,
      rejected: 0,
    } as Record<string, number>,
    filters: {
      status: null as string | null,
      keyword: '',
      event_type: null as string | null,
      page: 1,
      page_size: 10,
    },
    users: [] as any[],
  }),
  getters: {
    displayStats(state) {
      return {
        pending: state.stats.pending || 0,
        rectifying: (state.stats.assigned || 0) + (state.stats.rectifying || 0) + (state.stats.reviewing || 0),
        reviewing: 0,
        closed: state.stats.closed || 0,
      }
    },
  },
  actions: {
    async fetchEvents() {
      this.loading = true
      try {
        const api = useApi()
        const params: any = {
          page: this.filters.page,
          page_size: this.filters.page_size,
        }
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.keyword) params.keyword = this.filters.keyword
        if (this.filters.event_type) params.event_type = this.filters.event_type
        const result = await api.getEvents(params)
        this.events = result.items || []
        this.total = result.total || 0
      } finally {
        this.loading = false
      }
    },
    async fetchStats() {
      try {
        const api = useApi()
        const s = await api.getEventStats()
        if (s) {
          this.stats = {
            pending: s.pending || 0,
            assigned: s.assigned || 0,
            rectifying: s.rectifying || 0,
            reviewing: s.reviewing || 0,
            closed: s.closed || 0,
            rejected: s.rejected || 0,
          }
        }
      } catch (e) {
        console.error('fetch stats failed', e)
      }
    },
    async fetchEvent(id: string | number) {
      const api = useApi()
      this.currentEvent = await api.getEvent(id)
      return this.currentEvent
    },
    async createEvent(data: any) {
      const api = useApi()
      const r = await api.createEvent(data)
      await this.fetchEvents()
      return r
    },
    async assignEvent(id: string | number, assignedTo: number | string) {
      const api = useApi()
      const r = await api.assignEvent(id, assignedTo as number)
      await this.fetchEvents()
      return r
    },
    async changeStatus(id: string | number, status: string, comment?: string) {
      const api = useApi()
      const r = await api.changeStatus(id, status, comment)
      await this.fetchEvents()
      return r
    },
    async fetchFlowLogs(eventId: string | number) {
      const api = useApi()
      this.flowLogs = await api.getFlowLogs(eventId)
      return this.flowLogs
    },
    async fetchUsers() {
      const api = useApi()
      this.users = await api.getUsers()
      return this.users
    },
    setFilter(key: string, value: any) {
      (this.filters as any)[key] = value
    },
  },
})
