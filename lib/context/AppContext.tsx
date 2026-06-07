'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Channel, ReviewQueueItem, Sample } from '@/lib/mockData';

interface AppState {
  channels: Channel[];
  pendingCount: number;
  reviewItems: ReviewQueueItem[];
  lastUpdated: string | null;
}

interface AppContextType extends AppState {
  refreshChannels: () => Promise<void>;
  refreshReviewQueue: () => Promise<void>;
  batchReview: (ids: string[], action: 'approved' | 'rejected') => Promise<{
    success: boolean;
    processedCount: number;
    updatedChannels: Channel[];
  }>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    channels: [],
    pendingCount: 0,
    reviewItems: [],
    lastUpdated: null,
  });

  const refreshChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      if (data.success) {
        setState(prev => ({
          ...prev,
          channels: data.data.channels,
          pendingCount: data.data.pendingCount,
          lastUpdated: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('刷新渠道数据失败:', error);
    }
  }, []);

  const refreshReviewQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/review-queue');
      const data = await res.json();
      if (data.success) {
        setState(prev => ({
          ...prev,
          reviewItems: data.data.items,
          pendingCount: data.data.pendingCount,
          lastUpdated: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('刷新复核队列失败:', error);
    }
  }, []);

  const batchReview = useCallback(async (ids: string[], action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/review-queue/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, reviewer: '调研经理' }),
      });
      const data = await res.json();
      
      if (data.success) {
        await refreshChannels();
        await refreshReviewQueue();
        
        return {
          success: true,
          processedCount: data.data.processedCount,
          updatedChannels: data.data.updatedChannels || [],
        };
      }
      
      return { success: false, processedCount: 0, updatedChannels: [] };
    } catch (error) {
      console.error('批量审核失败:', error);
      return { success: false, processedCount: 0, updatedChannels: [] };
    }
  }, [refreshChannels, refreshReviewQueue]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshChannels(), refreshReviewQueue()]);
  }, [refreshChannels, refreshReviewQueue]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        refreshChannels,
        refreshReviewQueue,
        batchReview,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
