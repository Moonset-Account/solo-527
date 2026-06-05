'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { offlineStorage, formQueue } from '@/lib/offline-storage';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Bell } from 'lucide-react';

interface SyncedFormNotification {
  id: string;
  formType: string;
  result: any;
  timestamp: Date;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  sync: () => Promise<void>;
  lastSyncTime: Date | null;
  notifications: SyncedFormNotification[];
  dismissNotification: (id: string) => void;
  onFormSynced: (callback: (formType: string, result: any) => void) => () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  sync: async () => {},
  lastSyncTime: null,
  notifications: [],
  dismissNotification: () => {},
  onFormSynced: () => () => {},
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

interface OfflineSyncProviderProps {
  children: React.ReactNode;
}

const syncEventTarget =
  typeof window !== 'undefined'
    ? new (window as any).EventTarget()
    : null;

export function OfflineSyncProvider({ children }: OfflineSyncProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<SyncedFormNotification[]>([]);

  const getTotalPending = useCallback(() => {
    if (typeof localStorage === 'undefined') return 0;
    return (
      offlineStorage.getQueueCount() +
      formQueue.getCount() +
      Object.keys(localStorage).filter((k) =>
        k.startsWith('drama_club_photo_')
      ).length
    );
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      await offlineStorage.processQueue();

      const beforeQueue = formQueue.getQueue().filter((f: any) => f.status === 'pending');
      const result = await formQueue.processAll();
      const afterQueue = formQueue.getQueue();

      for (const submission of beforeQueue) {
        const synced = afterQueue.find(
          (s: any) => s.id === submission.id && s.status === 'synced'
        );
        if (synced) {
          const notification: SyncedFormNotification = {
            id: submission.id,
            formType: submission.formType,
            result: synced.syncResult,
            timestamp: new Date(),
          };
          setNotifications((prev) => [...prev, notification]);

          if (syncEventTarget) {
            syncEventTarget.dispatchEvent(
              new CustomEvent('formSynced', {
                detail: {
                  formType: submission.formType,
                  result: synced.syncResult,
                  submissionId: submission.id,
                },
              })
            );
          }
        }
      }

      setLastSyncTime(new Date());
    } finally {
      setPendingCount(getTotalPending());
      setIsSyncing(false);
    }
  }, [isSyncing, getTotalPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setPendingCount(getTotalPending());

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [sync, getTotalPending]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setPendingCount(getTotalPending());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [getTotalPending]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const onFormSynced = useCallback(
    (callback: (formType: string, result: any) => void) => {
      if (!syncEventTarget) return () => {};

      const handler = (e: any) => {
        callback(e.detail.formType, e.detail.result);
      };

      syncEventTarget.addEventListener('formSynced', handler);
      return () => syncEventTarget.removeEventListener('formSynced', handler);
    },
    []
  );

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        sync,
        lastSyncTime,
        notifications,
        dismissNotification,
        onFormSynced,
      }}
    >
      {children}
      <OfflineStatusBar />
      <SyncNotifications />
    </OfflineSyncContext.Provider>
  );
}

function OfflineStatusBar() {
  const { isOnline, pendingCount, isSyncing, sync } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 ${
        isOnline ? 'bg-blue-600' : 'bg-red-600'
      } text-white`}
    >
      {isOnline ? (
        <>
          {isSyncing ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            {isSyncing
              ? `正在同步 ${pendingCount} 项...`
              : `有 ${pendingCount} 项待同步`}
          </span>
          {!isSyncing && pendingCount > 0 && (
            <button
              onClick={sync}
              className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              立即同步
            </button>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-medium">
            当前离线，数据将在联网后自动同步
          </span>
        </>
      )}
    </div>
  );
}

function SyncNotifications() {
  const { notifications, dismissNotification } = useOfflineSync();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 max-w-sm"
        >
          <Bell className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {notification.formType === 'production' && '剧目创建成功'}
              {notification.formType === 'finance' && '财务记录创建成功'}
              {!['production', 'finance'].includes(notification.formType) &&
                '同步完成'}
            </p>
            <p className="text-xs text-green-100">
              离线数据已同步到服务器
            </p>
          </div>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="text-white/80 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
