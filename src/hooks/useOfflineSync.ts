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
      let method: 'POST' | 'PATCH' | 'DELETE' = 'POST';
      let body: any = null;

      switch (entityType) {
        case 'task':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/tasks`;
            method = 'POST';
            const { projectId, ...taskData } = data;
            body = taskData;
          } else if (operation === 'update') {
            if (data.status) {
              url = `/api/tasks/${data.taskId}`;
              method = 'PATCH';
              body = { status: data.status };
            } else {
              url = `/api/tasks/${data.taskId}`;
              method = 'PATCH';
              const { taskId, ...updateData } = data;
              body = updateData;
            }
          }
          break;

        case 'budget':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/budget`;
            method = 'POST';
            const { projectId, ...budgetData } = data;
            body = budgetData;
          } else if (operation === 'update') {
            url = `/api/budget/${data.budgetId}`;
            method = 'PATCH';
            const { budgetId, ...updateData } = data;
            body = updateData;
          }
          break;

        case 'comment':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/comments`;
            method = 'POST';
            body = { content: data.content };
          }
          break;

        case 'confirmation':
          if (operation === 'create') {
            url = `/api/projects/${data.projectId}/confirmations`;
            method = 'POST';
            const { projectId, ...confData } = data;
            body = confData;
          } else if (operation === 'update') {
            url = `/api/confirmations/${data.confirmationId}`;
            method = 'PATCH';
            body = { status: data.status };
          }
          break;

        default:
          console.log(`未知实体类型: ${entityType}`);
          return false;
      }

      if (!url) return false;

      console.log(`🔄 离线同步执行: ${method} ${url}`, body);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 离线同步成功: ${entityType} ${operation} → ${method} ${url}`);
        return true;
      } else {
        console.error(`❌ 离线同步失败: ${entityType} ${operation} → ${method} ${url}`, result.message);
        throw new Error(result.message || 'API 返回失败');
      }
    } catch (error: any) {
      console.error(`❌ 离线同步异常:`, error.message);
      throw error;
    }
  }, []);

  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return { success: false, synced: 0 };

    const queue = getOfflineQueue();
    if (queue.length === 0) return { success: true, synced: 0 };

    setIsSyncing(true);
    let syncedCount = 0;
    const remainingQueue: SyncOperation[] = [];
    const projectIdsToRefresh = new Set<string>();

    try {
      for (const op of queue) {
        try {
          const success = await executeOperation(op);
          if (success) {
            syncedCount++;
            if (op.entityData.projectId) {
              projectIdsToRefresh.add(op.entityData.projectId);
            }
          } else {
            remainingQueue.push({ ...op, error: '同步失败' });
          }
        } catch (error: any) {
          console.error(`操作 ${op.id} 同步失败:`, error);
          remainingQueue.push({ ...op, error: error.message || '同步失败' });
        }
      }

      saveOfflineQueue(remainingQueue);

      projectIdsToRefresh.forEach((projectId) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offline-synced', { detail: { projectId } }));
        }
      });

      console.log(`📊 同步完成: 成功 ${syncedCount} 项, 失败 ${remainingQueue.length} 项`);
      return { success: remainingQueue.length === 0, synced: syncedCount, failed: remainingQueue.length };
    } catch (error) {
      saveOfflineQueue([...queue, ...remainingQueue].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
      return { success: false, synced: syncedCount, error };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, getOfflineQueue, saveOfflineQueue, executeOperation]);

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
