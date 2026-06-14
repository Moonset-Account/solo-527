import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contractApi } from '~/utils/api'
import type { Contract, PaginatedResponse } from '~/types'

export const useContractsStore = defineStore('contracts', () => {
  const contracts = ref<Contract[]>([])
  const total = ref(0)
  const current = ref<Contract | null>(null)
  const loading = ref(false)

  async function fetchList(params?: { page?: number; size?: number; status?: string }) {
    loading.value = true
    try {
      const res = await contractApi.list(params)
      contracts.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: number) {
    loading.value = true
    try {
      current.value = await contractApi.get(id)
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<Contract>) {
    return contractApi.create(data)
  }

  async function update(id: number, data: Partial<Contract>) {
    return contractApi.update(id, data)
  }

  async function remove(id: number) {
    return contractApi.delete(id)
  }

  return { contracts, total, current, loading, fetchList, fetchById, create, update, remove }
})
