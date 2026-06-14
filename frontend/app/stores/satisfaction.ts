import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { satisfactionApi } from '~/utils/api'
import type { SatisfactionRecord } from '~/types'

export const useSatisfactionStore = defineStore('satisfaction', () => {
  const records = ref<SatisfactionRecord[]>([])
  const loading = ref(false)

  const pending = computed(() => records.value.filter(r => r.level === 'pending'))
  const satisfied = computed(() => records.value.filter(r => r.level === 'satisfied'))
  const neutral = computed(() => records.value.filter(r => r.level === 'neutral'))
  const dissatisfied = computed(() => records.value.filter(r => r.level === 'dissatisfied'))

  async function fetchList(params?: { page?: number; page_size?: number; contract_id?: number; level?: string }) {
    loading.value = true
    try {
      const res = await satisfactionApi.list(params)
      records.value = res.items
    } finally {
      loading.value = false
    }
  }

  async function updateLevel(id: number, level: string) {
    return satisfactionApi.update(id, { level })
  }

  async function remind(id: number) {
    return satisfactionApi.remind(id)
  }

  return { records, loading, pending, satisfied, neutral, dissatisfied, fetchList, updateLevel, remind }
})
