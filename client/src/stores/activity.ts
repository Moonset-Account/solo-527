import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  registerActivity,
  cancelRegistration,
  type Activity,
  type ActivityListParams
} from '../api/activity'

export const useActivityStore = defineStore('activity', () => {
  const list = ref<Activity[]>([])
  const current = ref<Activity | null>(null)
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: ActivityListParams) => {
    loading.value = true
    try {
      const res: any = await getActivities(params)
      list.value = res.data?.items || res.items || []
      total.value = res.data?.total || res.total || 0
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: string) => {
    loading.value = true
    try {
      const res: any = await getActivity(id)
      current.value = res.data || res
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<Activity>) => {
    const res: any = await createActivity(data)
    return res.data || res
  }

  const update = async (id: string, data: Partial<Activity>) => {
    const res: any = await updateActivity(id, data)
    return res.data || res
  }

  const register = async (id: string) => {
    const res: any = await registerActivity(id)
    return res.data || res
  }

  const cancelRegister = async (id: string) => {
    const res: any = await cancelRegistration(id)
    return res.data || res
  }

  return {
    list,
    current,
    total,
    loading,
    fetchList,
    fetchDetail,
    create,
    update,
    register,
    cancelRegister
  }
})
