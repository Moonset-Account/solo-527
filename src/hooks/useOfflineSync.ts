import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { v4 as uuidv4 } from 'uuid';

interface SyncOperation {
  id?: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityData: any;
  synced?: boolean;
  createdAt?: Date;
}

const STORAGE_KEY = 'wedding_planner_offline_queue';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const queue = getOfflineQueue();
    setPendingCount(queue.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getOfflineQueue = useCallback((): SyncOperation[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const saveOfflineQueue = useCallback((queue: SyncOperation[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    setPendingCount(queue.length);
  }, []);

  const addToQueue = useCallback((operation: Omit<SyncOperation, 'id' | 'synced' | 'createdAt'>) => {
    const queue = getOfflineQueue();
    const newOp: SyncOperation = {
      ...operation,
      id: uuidv4(),
      synced: false,
      createdAt: new Date(),
    };
    queue.push(newOp);
    saveOfflineQueue(queue);
    return newOp;
  }, [getOfflineQueue, saveOfflineQueue]);

  const removeFromQueue = useCallback((id: string) => {
    const queue = getOfflineQueue().filter(op => op.id !== id);
    saveOfflineQueue(queue);
  }, [getOfflineQueue, saveOfflineQueue]);

  const syncQueue = useCallback(async () => {
    if (!isOnline) return { success: false, synced: 0 };

    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    try {
      const response = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: queue }),
      });

      if (response.ok) {
        saveOfflineQueue([]);
        return { success: true, synced: queue.length };
      }
      return { success: false, synced: 0 };
    } catch (error) {
      return { success: false, synced: 0, error };
    }
  }, [isOnline, getOfflineQueue, saveOfflineQueue]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncQueue();
    }
  }, [isOnline, pendingCount, syncQueue]);

  return {
    isOnline,
    pendingCount,
    addToQueue,
    queueOfflineOperation: addToQueue,
    removeFromQueue,
    syncQueue,
    getOfflineQueue,
  };
}
