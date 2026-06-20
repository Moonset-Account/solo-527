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
  type ActivityListParams,
  type CreateActivityData,
  type UpdateActivityData,
  type RegisterData,
  type CancelRegistrationData
} from '../api/activity'

export const useActivityStore = defineStore('activity', () => {
  const list = ref<Activity[]>([])
  const current = ref<Activity | null>(null)
  const total = ref(0)
  const loading = ref(false)

  const currentUserId = 'demo-user-001'
  const currentUserName = '演示用户'

  const fetchList = async (params?: ActivityListParams) => {
    loading.value = true
    try {
      const res: any = await getActivities({
        userId: currentUserId,
        ...params
      })
      list.value = res.data || []
      total.value = res.total || 0
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: string) => {
    loading.value = true
    try {
      const res: any = await getActivity(id, currentUserId)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const create = async (data: CreateActivityData) => {
    const res: any = await createActivity(data)
    return res
  }

  const update = async (id: string, data: UpdateActivityData) => {
    const res: any = await updateActivity(id, data)
    return res
  }

  const register = async (id: string) => {
    const data: RegisterData = {
      userId: currentUserId,
      userName: currentUserName
    }
    const res: any = await registerActivity(id, data)
    return res
  }

  const cancelRegister = async (id: string) => {
    const data: CancelRegistrationData = {
      userId: currentUserId
    }
    const res: any = await cancelRegistration(id, data)
    return res
  }

  return {
    list,
    current,
    total,
    loading,
    currentUserId,
    currentUserName,
    fetchList,
    fetchDetail,
    create,
    update,
    register,
    cancelRegister
  }
})
