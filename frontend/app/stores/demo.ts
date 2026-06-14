import { defineStore } from 'pinia'
import { ref } from 'vue'
import { demoApi } from '~/utils/api'

export const useDemoStore = defineStore('demo', () => {
  const loading = ref(false)
  const lastSeedCount = ref<number | null>(null)
  const lastDeletedCount = ref<number | null>(null)

  async function seed() {
    loading.value = true
    try {
      const res = await demoApi.seed()
      lastSeedCount.value = res.count
      return res
    } finally {
      loading.value = false
    }
  }

  async function clear() {
    loading.value = true
    try {
      const res = await demoApi.clear()
      lastDeletedCount.value = res.deleted
      return res
    } finally {
      loading.value = false
    }
  }

  return { loading, lastSeedCount, lastDeletedCount, seed, clear }
})
