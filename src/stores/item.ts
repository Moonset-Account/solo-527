import { defineStore } from 'pinia'
import { ref } from 'vue'
import { items as itemsApi } from '@/lib/api'
import type { Item, Progress, Attachment, ItemStatus, ItemPriority } from '@/types'

export const useItemStore = defineStore('item', () => {
  const items = ref<Item[]>([])
  const total = ref(0)
  const currentItem = ref<(Item & { progressList: Progress[]; attachments: Attachment[] }) | null>(null)
  const loading = ref(false)

  const fetchItems = async (params?: {
    page?: number
    pageSize?: number
    status?: ItemStatus
    department?: string
    assignee?: string
    keyword?: string
  }) => {
    loading.value = true
    try {
      const response = await itemsApi.getList(params)
      items.value = response.list
      total.value = response.total
      return response
    } finally {
      loading.value = false
    }
  }

  const fetchItem = async (id: string) => {
    loading.value = true
    try {
      const response = await itemsApi.getDetail(id)
      currentItem.value = response
      return response
    } finally {
      loading.value = false
    }
  }

  const createItem = async (data: {
    title: string
    description: string
    priority: ItemPriority
    department: string
    assignee: string
    deadline: string
  }) => {
    loading.value = true
    try {
      const response = await itemsApi.create(data)
      return response
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (
    id: string,
    data: {
      title?: string
      description?: string
      status?: ItemStatus
      priority?: ItemPriority
      department?: string
      assignee?: string
      deadline?: string
    },
  ) => {
    loading.value = true
    try {
      const response = await itemsApi.update(id, data)
      if (currentItem.value && currentItem.value._id === id) {
        currentItem.value = { ...currentItem.value, ...response }
      }
      return response
    } finally {
      loading.value = false
    }
  }

  const claimItem = async (id: string) => {
    loading.value = true
    try {
      const response = await itemsApi.claim(id)
      const index = items.value.findIndex((item) => item._id === id)
      if (index !== -1) {
        items.value[index] = response
      }
      if (currentItem.value && currentItem.value._id === id) {
        currentItem.value = { ...currentItem.value, ...response }
      }
      return response
    } finally {
      loading.value = false
    }
  }

  const addProgress = async (id: string, content: string, attachments?: string[]) => {
    loading.value = true
    try {
      const response = await itemsApi.addProgress(id, content, attachments)
      if (currentItem.value && currentItem.value._id === id) {
        currentItem.value.progressList.push(response)
      }
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    total,
    currentItem,
    loading,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    claimItem,
    addProgress,
  }
})
