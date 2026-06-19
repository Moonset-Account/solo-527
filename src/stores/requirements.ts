import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Requirement, RequirementFilter, PaginatedResponse } from '@/types'
import { requirementApi } from '@/api'

export const useRequirementsStore = defineStore('requirements', () => {
  const requirements = ref<Requirement[]>([])
  const currentRequirement = ref<Requirement | null>(null)
  const pagination = ref({ total: 0, page: 1, perPage: 20, lastPage: 1 })
  const isLoading = ref(false)
  const filters = ref<RequirementFilter>({})

  async function fetchRequirements(filter?: RequirementFilter) {
    if (filter) filters.value = filter
    isLoading.value = true
    try {
      const { data: resp } = await requirementApi.list(filters.value)
      const raw = resp as any
      requirements.value = raw.data ?? raw
      const p = raw.pagination ?? raw
      pagination.value = {
        total: p.total ?? 0,
        page: p.page ?? 1,
        perPage: p.pageSize ?? p.perPage ?? 20,
        lastPage: p.totalPages ?? p.lastPage ?? 1,
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRequirement(id: number) {
    isLoading.value = true
    try {
      const { data } = await requirementApi.get(id)
      currentRequirement.value = data
    } finally {
      isLoading.value = false
    }
  }

  async function createRequirement(formData: FormData) {
    const { data } = await requirementApi.create(formData)
    return data
  }

  async function updateRequirement(id: number, updateData: Partial<Requirement>) {
    const { data } = await requirementApi.update(id, updateData)
    if (currentRequirement.value?.id === id) {
      currentRequirement.value = data
    }
    return data
  }

  return {
    requirements,
    currentRequirement,
    pagination,
    isLoading,
    filters,
    fetchRequirements,
    fetchRequirement,
    createRequirement,
    updateRequirement,
  }
})
