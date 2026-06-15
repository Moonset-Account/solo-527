import { defineStore } from 'pinia'

export interface Customer {
  id: string
  name: string
  phone: string
  gender: 'male' | 'female'
  tags: string[]
  level: string
  advisorId: string
  advisorName: string
  advisorAvatar?: string
  totalConsumption: number
  visitCount: number
  leadQuality: 'A' | 'B' | 'C' | 'D'
  sourceChannel: string
  intention: string
  followUpPreference: string
  createdAt: string
  churnReasons?: ChurnReason[]
  quotes?: QuoteVersion[]
  followUpPlans?: FollowUpPlan[]
}

export interface ChurnReason {
  id: string
  reason: string
  detail: string
  relatedQuoteId?: string
  createdAt: string
  createdBy: string
}

export interface QuoteVersion {
  id: string
  version: string
  amount: number
  expireAt: string
  status: 'pending' | 'accepted' | 'expired' | 'rejected'
  statusText: string
  expireReason?: string
  items: QuoteItem[]
  responseNodes: ResponseNode[]
  createdAt: string
}

export interface QuoteItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ResponseNode {
  name: string
  responsible: string
  deadline: string
  completed: boolean
  completedAt?: string
  delayDays?: number
}

export interface FollowUpPlan {
  id: string
  date: string
  type: string
  content: string
  responsible: string
  completed: boolean
  createdAt: string
}

export interface FilterState {
  keyword: string
  selectedTags: string[]
  level: string
  advisorId: string
  leadQuality: string
}

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const filters = reactive<FilterState>({
    keyword: '',
    selectedTags: [],
    level: '',
    advisorId: '',
    leadQuality: '',
  })
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)

  async function fetchCustomers() {
    loading.value = true
    try {
      const data = await $fetch<Customer[]>('/api/customers')
      customers.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomer(id: string) {
    loading.value = true
    try {
      const data = await $fetch<Customer>(`/api/customers/${id}`)
      currentCustomer.value = data
    } finally {
      loading.value = false
    }
  }

  function setFilters(partial: Partial<FilterState>) {
    Object.assign(filters, partial)
  }

  function resetFilters() {
    filters.keyword = ''
    filters.selectedTags = []
    filters.level = ''
    filters.advisorId = ''
    filters.leadQuality = ''
  }

  const filteredCustomers = computed(() => {
    return customers.value.filter((c) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        if (!c.name.toLowerCase().includes(kw) && !c.phone.includes(kw)) {
          return false
        }
      }
      if (filters.selectedTags.length > 0) {
        if (!filters.selectedTags.some((t) => c.tags.includes(t))) return false
      }
      if (filters.level && c.level !== filters.level) return false
      if (filters.advisorId && c.advisorId !== filters.advisorId) return false
      if (filters.leadQuality && c.leadQuality !== filters.leadQuality) return false
      return true
    })
  })

  return {
    customers,
    filters,
    currentCustomer,
    loading,
    fetchCustomers,
    fetchCustomer,
    setFilters,
    resetFilters,
    filteredCustomers,
  }
})
