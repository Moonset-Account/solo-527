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
  error?: string;
}

const STORAGE_KEY = 'wedding_planner_offline_queue';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
    };
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

  const updateOperationError = useCallback((id: string, error: string) => {
    const queue = getOfflineQueue().map(op => 
      op.id === id ? { ...op, error } : op
    );
    saveOfflineQueue(queue);
  }, [getOfflineQueue, saveOfflineQueue]);

  const executeOperation = useCallback(async (op: SyncOperation): Promise<boolean> => {
    try {
      const { operation, entityType, entityData } = op;
      const data = entityData as any;

      let url = '';
      let method = operation.toUpperCase();
      let body: any = null;

      switch (entityType) {
        case 'task':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/tasks`;
            const { projectId, ...taskData } = data;
            body = taskData;
          } else if (operation === 'update') {
            if (data.status) {
              url = `/api/tasks/${data.taskId}`;
              body = { status: data.status };
            } else {
              url = `/api/tasks/${data.taskId}`;
              const { taskId, ...updateData } = data;
              body = updateData;
            }
          }
          break;

        case 'budget':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/budget`;
            const { projectId, ...budgetData } = data;
            body = budgetData;
          } else if (operation === 'update') {
            url = `/api/budget/${data.budgetId}`;
            const { budgetId, ...updateData } = data;
            body = updateData;
          }
          break;

        case 'comment':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/comments`;
            body = { content: data.content };
          }
          break;

        case 'confirmation':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/confirmations`;
            const { projectId, ...confData } = data;
            body = confData;
          } else if (operation === 'update') {
            url = `/api/confirmations/${data.confirmationId}`;
            body = { status: data.status };
          }
          break;

        default:
          console.log(`未知实体类型: ${entityType}`);
          return false;
      }

      if (!url) return false;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 离线同步成功: ${entityType} ${operation}`);
        return true;
      } else {
        console.error(`❌ 离线同步失败: ${entityType} ${operation}`, result.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ 离线同步异常:`, error);
      return false;
    }
  }, []);

  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false, synced: 0 };

    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    setIsSyncing(true);
    let syncedCount = 0;
    const failedIds: string[] = [];

    try {
      for (const op of queue) {
        const success = await executeOperation(op);
        if (success) {
          syncedCount++;
        } else {
          failedIds.push(op.id!);
          updateOperationError(op.id!, '同步失败');
        }
      }

      const remainingQueue = queue.filter(op => failedIds.includes(op.id!));
      saveOfflineQueue(remainingQueue);

      return { success: failedIds.length === 0, synced: syncedCount, failed: failedIds.length };
    } catch (error) {
      return { success: false, synced: syncedCount, error };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, getOfflineQueue, saveOfflineQueue, executeOperation, updateOperationError]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncQueue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, isSyncing, syncQueue]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addToQueue,
    queueOfflineOperation: addToQueue,
    removeFromQueue,
    syncQueue,
    getOfflineQueue,
  };
}
