import { ref, onMounted, onUnmounted } from 'vue'

interface OfflineQueueItem {
  id: string
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  data: any
  timestamp: number
  retryCount: number
}

const STORAGE_KEY = 'offline_request_queue'

export function useOfflineQueue() {
  const queue = ref<OfflineQueueItem[]>([])
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)

  const loadQueue = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        queue.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载离线队列失败', e)
    }
  }

  const saveQueue = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value))
    } catch (e) {
      console.error('保存离线队列失败', e)
    }
  }

  const addToQueue = (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', data: any) => {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0
    }
    queue.value.push(item)
    saveQueue()
    return item
  }

  const removeFromQueue = (id: string) => {
    const index = queue.value.findIndex(item => item.id === id)
    if (index > -1) {
      queue.value.splice(index, 1)
      saveQueue()
    }
  }

  const updateQueueItem = (id: string, updates: Partial<OfflineQueueItem>) => {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      Object.assign(item, updates)
      saveQueue()
    }
  }

  const processQueue = async () => {
    if (isSyncing.value || !isOnline.value || queue.value.length === 0) {
      return
    }

    isSyncing.value = true
    const items = [...queue.value].sort((a, b) => a.timestamp - b.timestamp)

    for (const item of items) {
      try {
        const { default: api } = await import('../utils/request')
        await api.request({
          url: item.endpoint,
          method: item.method,
          data: item.data
        })
        removeFromQueue(item.id)
      } catch (error) {
        console.error('同步离线请求失败', item.id, error)
        updateQueueItem(item.id, { retryCount: item.retryCount + 1 })
        if (item.retryCount >= 3) {
          console.warn('重试次数过多，保留在队列中', item.id)
        }
      }
    }

    isSyncing.value = false
  }

  const handleOnline = () => {
    isOnline.value = true
    processQueue()
  }

  const handleOffline = () => {
    isOnline.value = false
  }

  onMounted(() => {
    loadQueue()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    queue,
    isOnline,
    isSyncing,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueCount: queue.value.length
  }
}
