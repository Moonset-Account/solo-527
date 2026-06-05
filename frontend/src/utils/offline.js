import localforage from 'localforage'
import { api } from './request'
import { generateUUID } from './device'

const OFFLINE_QUEUE_KEY = 'offline_queue'
const OFFLINE_DATA_KEY = 'offline_data'

let offlineQueue = []
let offlineData = {}

export const initOfflineQueue = async () => {
  try {
    offlineQueue = await localforage.getItem(OFFLINE_QUEUE_KEY) || []
    offlineData = await localforage.getItem(OFFLINE_DATA_KEY) || {}
  } catch (e) {
    console.error('初始化离线队列失败:', e)
    offlineQueue = []
    offlineData = {}
  }
}

const saveQueue = async () => {
  await localforage.setItem(OFFLINE_QUEUE_KEY, offlineQueue)
}

const saveData = async () => {
  await localforage.setItem(OFFLINE_DATA_KEY, offlineData)
}

export const addToOfflineQueue = async (request) => {
  const item = {
    id: generateUUID(),
    ...request,
    timestamp: Date.now(),
    status: 'pending'
  }
  offlineQueue.push(item)
  await saveQueue()
  return item
}

export const removeFromOfflineQueue = async (id) => {
  offlineQueue = offlineQueue.filter(item => item.id !== id)
  await saveQueue()
}

export const getOfflineQueue = () => {
  return [...offlineQueue]
}

export const getPendingQueue = () => {
  return offlineQueue.filter(item => item.status === 'pending' || item.status === 'failed')
}

export const processOfflineQueue = async () => {
  if (!navigator.onLine) return { success: 0, failed: 0, total: 0 }

  const pending = getPendingQueue()
  let success = 0
  let failed = 0

  for (const item of pending) {
    try {
      item.status = 'processing'
      await saveQueue()

      await api({
        method: item.method,
        url: item.url,
        data: item.data,
        params: item.params
      })

      item.status = 'success'
      item.completed_at = Date.now()
      success++
    } catch (e) {
      item.status = 'failed'
      item.error = e.message
      item.retry_count = (item.retry_count || 0) + 1
      failed++
    }
    await saveQueue()
  }

  return { success, failed, total: pending.length }
}

export const saveOfflineData = async (key, data) => {
  offlineData[key] = {
    data,
    timestamp: Date.now()
  }
  await saveData()
}

export const getOfflineData = async (key) => {
  const cached = offlineData[key]
  if (!cached) return null
  return cached.data
}

export const clearCompletedQueue = async () => {
  offlineQueue = offlineQueue.filter(item => item.status !== 'completed')
  await saveQueue()
}

export const clearAllOfflineData = async () => {
  offlineQueue = []
  offlineData = {}
  await localforage.removeItem(OFFLINE_QUEUE_KEY)
  await localforage.removeItem(OFFLINE_DATA_KEY)
}
