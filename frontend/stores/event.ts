import { defineStore } from 'pinia'

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as any[],
    currentEvent: null as any,
    flowLogs: [] as any[],
    total: 0,
    loading: false,
    filters: {
      status: null as string | null,
      keyword: '',
      event_type: null as string | null,
      page: 1,
      page_size: 10
    },
    users: [] as any[]
  }),
  getters: {
    stats(state) {
      return {
        pending: state.events.filter(e => e.status === 'pending').length,
        rectifying: state.events.filter(e => e.status === 'rectifying' || e.status === 'assigned').length,
        reviewing: state.events.filter(e => e.status === 'reviewing').length,
        closed: state.events.filter(e => e.status === 'closed').length
      }
    }
  },
  actions: {
    async fetchEvents() {
      this.loading = true
      try {
        const api = useApi()
        const result = await api.getEvents(this.filters)
        this.events = result.items
        this.total = result.total
      } finally {
        this.loading = false
      }
    },
    async fetchEvent(id: string) {
      const api = useApi()
      this.currentEvent = await api.getEvent(id)
    },
    async createEvent(data: any) {
      const api = useApi()
      return await api.createEvent(data)
    },
    async assignEvent(id: string, assignedTo: string) {
      const api = useApi()
      return await api.assignEvent(id, assignedTo)
    },
    async changeStatus(id: string, status: string, comment?: string) {
      const api = useApi()
      return await api.changeStatus(id, status, comment)
    },
    async fetchFlowLogs(eventId: string) {
      const api = useApi()
      this.flowLogs = await api.getFlowLogs(eventId)
    },
    async fetchUsers() {
      const api = useApi()
      this.users = await api.getUsers()
    },
    setFilter(key: string, value: any) {
      (this.filters as any)[key] = value
      if (key !== 'page') this.filters.page = 1
    }
  }
})
