import { create } from 'zustand';

interface AppState {
  currentUser: any;
  setCurrentUser: (u: any) => void;
  toastMsg: { id: number; type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  clearToast: () => void;
  alertUnread: number;
  setAlertUnread: (n: number) => void;
}

export const useApp = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (u) => set({ currentUser: u }),
  toastMsg: null,
  showToast: (type, message) =>
    set({ toastMsg: { id: Date.now() + Math.random(), type, message } }),
  clearToast: () => set({ toastMsg: null }),
  alertUnread: 0,
  setAlertUnread: (n) => set({ alertUnread: n }),
}));

export function toast(type: 'success' | 'error' | 'info', message: string) {
  useApp.getState().showToast(type, message);
}
