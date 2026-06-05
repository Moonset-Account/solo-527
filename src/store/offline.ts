'use client';

import { create } from 'zustand';
import Dexie, { type Table } from 'dexie';
import type { OfflineAction } from '@/lib/types';

class OfflineDB extends Dexie {
  actions!: Table<OfflineAction>;

  constructor() {
    super('league-offline-db');
    this.version(1).stores({
      actions: 'id, type, status, createdAt'
    });
  }
}

const db = new OfflineDB();

interface OfflineState {
  pendingActions: OfflineAction[];
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  syncProgress: number;
  error: string | null;
  init: () => void;
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'createdAt' | 'retryCount' | 'status'>) => Promise<void>;
  loadPendingActions: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
  clearSyncedActions: () => Promise<void>;
  getPendingCount: () => number;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  pendingActions: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncStatus: 'idle',
  syncProgress: 0,
  error: null,

  init: () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        set({ isOnline: true });
        get().syncPendingActions();
      });
      
      window.addEventListener('offline', () => {
        set({ isOnline: false });
      });

      get().loadPendingActions();
    }
  },

  addOfflineAction: async (action) => {
    const newAction: OfflineAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
      ...action,
    };

    await db.actions.add(newAction);
    await get().loadPendingActions();
  },

  loadPendingActions: async () => {
    const actions = await db.actions.toArray();
    set({ pendingActions: actions });
  },

  syncPendingActions: async () => {
    const { isOnline, pendingActions } = get();
    
    if (!isOnline || pendingActions.length === 0) return;

    set({ syncStatus: 'syncing', syncProgress: 0, error: null });

    try {
      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];
        
        try {
          await executeAction(action);
          await db.actions.update(action.id, { status: 'synced' });
        } catch (error) {
          const retryCount = action.retryCount + 1;
          
          if (retryCount >= 5) {
            await db.actions.update(action.id, { 
              status: 'failed', 
              errorMessage: error instanceof Error ? error.message : 'Sync failed' 
            });
          } else {
            await db.actions.update(action.id, { retryCount });
          }
        }

        set({ syncProgress: Math.round(((i + 1) / pendingActions.length) * 100) });
      }

      await get().loadPendingActions();
      set({ syncStatus: 'idle' });
    } catch (error) {
      set({ 
        syncStatus: 'error', 
        error: error instanceof Error ? error.message : '同步失败' 
      });
    }
  },

  clearSyncedActions: async () => {
    await db.actions.where('status').equals('synced').delete();
    await get().loadPendingActions();
  },

  getPendingCount: () => {
    return get().pendingActions.filter(a => a.status === 'pending').length;
  },
}));

async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return response.blob();
}

async function executeAction(action: OfflineAction): Promise<void> {
  let response: Response;
  
  switch (action.type) {
    case 'SCORE_UPDATE':
      response = await fetch(`/api/matches/${action.payload.matchId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload.score),
      });
      break;
    case 'CHECKIN':
      response = await fetch('/api/mobile/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      });
      break;
    case 'PHOTO_UPLOAD':
      const { matchId, type, photoData } = action.payload;
      const blob = await base64ToBlob(photoData);
      const formData = new FormData();
      formData.append('file', blob, `photo_${Date.now()}.jpg`);
      formData.append('matchId', matchId);
      formData.append('type', type);
      response = await fetch('/api/mobile/upload', {
        method: 'POST',
        body: formData,
      });
      break;
    case 'PLAYER_STAT':
      response = await fetch(`/api/matches/${action.payload.matchId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload.stats),
      });
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {}
    throw new Error(errorMessage);
  }
}
