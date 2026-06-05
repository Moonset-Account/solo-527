const STORAGE_PREFIX = 'drama_club_';
const QUEUE_KEY = `${STORAGE_PREFIX}offline_queue`;

interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  createdAt: number;
  retries: number;
}

interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
}

export const offlineStorage = {
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },

  saveToCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(
        `${STORAGE_PREFIX}cache_${key}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  },

  getFromCache<T = any>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}cache_${key}`);
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      if (Date.now() - cacheData.timestamp > cacheData.ttl) {
        localStorage.removeItem(`${STORAGE_PREFIX}cache_${key}`);
        return null;
      }

      return cacheData.data as T;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  },

  clearCache(key?: string): void {
    if (typeof localStorage === 'undefined') return;
    if (key) {
      localStorage.removeItem(`${STORAGE_PREFIX}cache_${key}`);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${STORAGE_PREFIX}cache_`))
        .forEach((k) => localStorage.removeItem(k));
    }
  },

  addToQueue(url: string, method: string, body?: any): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const queue = this.getQueue();
      const request: OfflineRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        url,
        method,
        body,
        createdAt: Date.now(),
        retries: 0,
      };
      queue.push(request);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  },

  getQueue(): OfflineRequest[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  },

  removeFromQueue(id: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const queue = this.getQueue().filter((req) => req.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  },

  updateQueueItem(id: string, updates: Partial<OfflineRequest>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const queue = this.getQueue().map((req) =>
        req.id === id ? { ...req, ...updates } : req
      );
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to update queue item:', error);
    }
  },

  async processQueue(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline()) {
      return { success: 0, failed: 0 };
    }

    const queue = this.getQueue();
    let success = 0;
    let failed = 0;

    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          this.removeFromQueue(request.id);
          success++;
        } else {
          this.updateQueueItem(request.id, { retries: request.retries + 1 });
          failed++;
        }
      } catch (error) {
        this.updateQueueItem(request.id, { retries: request.retries + 1 });
        failed++;
      }
    }

    return { success, failed };
  },

  getQueueCount(): number {
    return this.getQueue().length;
  },

  saveDraft(key: string, data: any): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}draft_${key}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  },

  getDraft<T = any>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const draft = localStorage.getItem(`${STORAGE_PREFIX}draft_${key}`);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  },

  clearDraft(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`${STORAGE_PREFIX}draft_${key}`);
  },

  savePhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (typeof localStorage !== 'undefined') {
          const key = `${STORAGE_PREFIX}photo_${Date.now()}`;
          localStorage.setItem(key, base64);
          resolve(key);
        } else {
          reject(new Error('LocalStorage not available'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  getPhoto(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },

  clearPhoto(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },

  setupOnlineListener(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      callback();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  },
};

export async function offlineFetch<T = any>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTtl?: number
): Promise<{ data: T | null; fromCache: boolean }> {
  const method = options.method || 'GET';
  const isGetRequest = method === 'GET';

  if (isGetRequest && cacheKey) {
    const cached = offlineStorage.getFromCache<T>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  if (!offlineStorage.isOnline()) {
    if (!isGetRequest && options.body) {
      offlineStorage.addToQueue(
        url,
        method,
        typeof options.body === 'string' ? JSON.parse(options.body) : options.body
      );
    }
    return { data: null, fromCache: false };
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    if (isGetRequest && cacheKey) {
      offlineStorage.saveToCache(cacheKey, data, cacheTtl);
    }

    return { data, fromCache: false };
  } catch (error) {
    console.error('Fetch failed:', error);
    if (!isGetRequest && options.body) {
      offlineStorage.addToQueue(
        url,
        method,
        typeof options.body === 'string' ? JSON.parse(options.body) : options.body
      );
    }
    return { data: null, fromCache: false };
  }
}
