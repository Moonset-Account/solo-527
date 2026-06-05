export interface OfflineQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: number
  status: 'pending' | 'syncing' | 'failed'
  error?: string
  retries: number
}

const DB_NAME = 'studio-offline-db'
const DB_VERSION = 1
const STORE_QUEUE = 'sync_queue'
const STORE_CACHE = 'data_cache'

export class OfflineSyncService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' })
          queueStore.createIndex('status', 'status')
          queueStore.createIndex('timestamp', 'timestamp')
          queueStore.createIndex('entity', 'entity')
        }

        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          const cacheStore = db.createObjectStore(STORE_CACHE, { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp')
        }
      }
    })
  }

  async enqueue(action: OfflineQueueItem['action'], entity: string, data: any): Promise<string> {
    const item: OfflineQueueItem = {
      id: crypto.randomUUID(),
      action,
      entity,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_QUEUE, 'readwrite')
      const store = transaction.objectStore(STORE_QUEUE)
      const request = store.add(item)

      request.onsuccess = () => {
        resolve(item.id)
        this.dispatchQueueUpdated()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingItems(): Promise<OfflineQueueItem[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_QUEUE, 'readonly')
      const store = transaction.objectStore(STORE_QUEUE)
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateItemStatus(id: string, status: OfflineQueueItem['status'], error?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_QUEUE, 'readwrite')
      const store = transaction.objectStore(STORE_QUEUE)
      const request = store.get(id)

      request.onsuccess = () => {
        const item = request.result
        if (item) {
          item.status = status
          item.error = error
          if (status === 'failed') {
            item.retries += 1
          }
          store.put(item)
        }
        resolve()
        this.dispatchQueueUpdated()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async removeItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_QUEUE, 'readwrite')
      const store = transaction.objectStore(STORE_QUEUE)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
        this.dispatchQueueUpdated()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async setCache(key: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_CACHE, 'readwrite')
      const store = transaction.objectStore(STORE_CACHE)
      const request = store.put({ key, data, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_CACHE, 'readonly')
      const store = transaction.objectStore(STORE_CACHE)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }

  async clearCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction(STORE_CACHE, 'readwrite')
      const store = transaction.objectStore(STORE_CACHE)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async processQueue(): Promise<{ synced: number; failed: number }> {
    const items = await this.getPendingItems()
    let synced = 0
    let failed = 0

    for (const item of items) {
      try {
        await this.updateItemStatus(item.id, 'syncing')
        await this.syncItem(item)
        await this.removeItem(item.id)
        synced++
      } catch (error: any) {
        await this.updateItemStatus(item.id, 'failed', error.message)
        failed++
      }
    }

    return { synced, failed }
  }

  private async syncItem(item: OfflineQueueItem): Promise<void> {
    const endpoint = `/api/${item.entity}${item.action !== 'create' ? `/${item.data.id}` : ''}`
    const method = item.action === 'create' ? 'POST' : item.action === 'update' ? 'PATCH' : 'DELETE'

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Sync failed' } }))
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }
  }

  private dispatchQueueUpdated(): void {
    window.dispatchEvent(new CustomEvent('offline-queue-updated'))
  }

  isOnline(): boolean {
    return navigator.onLine
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

export const offlineSync = new OfflineSyncService()
