'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  sync: () => Promise<void>;
  lastSyncTime: Date | null;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  sync: async () => {},
  lastSyncTime: null,
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

interface OfflineSyncProviderProps {
  children: React.ReactNode;
}

export function OfflineSyncProvider({ children }: OfflineSyncProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncOfflinePhotos = useCallback(async () => {
    if (typeof localStorage === 'undefined') return;

    const photoKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith('drama_club_photo_')
    );

    for (const key of photoKeys) {
      try {
        const base64Data = localStorage.getItem(key);
        if (!base64Data) continue;

        const base64Parts = base64Data.split(',');
        const mimeType = base64Parts[0].match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
        const binaryString = atob(base64Parts[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: mimeType });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'receipts');

        const res = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(`${key}_uploaded`, data.url);
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Failed to sync photo:', key, error);
      }
    }
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      await offlineStorage.processQueue();
      await syncOfflinePhotos();
      setLastSyncTime(new Date());
    } finally {
      setPendingCount(
        offlineStorage.getQueueCount() +
          Object.keys(localStorage || {}).filter((k) =>
            k.startsWith('drama_club_photo_')
          ).length
      );
      setIsSyncing(false);
    }
  }, [isSyncing, syncOfflinePhotos]);

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
      setPendingCount(
        offlineStorage.getQueueCount() +
          Object.keys(localStorage || {}).filter((k) =>
            k.startsWith('drama_club_photo_')
          ).length
      );

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [sync]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        setPendingCount(
          offlineStorage.getQueueCount() +
            Object.keys(localStorage || {}).filter((k) =>
              k.startsWith('drama_club_photo_')
            ).length
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <OfflineSyncContext.Provider
      value={{ isOnline, pendingCount, isSyncing, sync, lastSyncTime }}
    >
      {children}
      <OfflineStatusBar />
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
