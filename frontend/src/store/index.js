import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getAuth,
  clearAuth as clearAuthStorage,
  setAuth,
  getUser as getStoredUser,
  ROLE,
} from '../utils/auth.js';

const initialUser = getStoredUser();

export const useAppStore = create(
  persist(
    (set, get) => ({
      user: initialUser,
      token: getAuth()?.token || '',
      authReady: !!initialUser,
      unreadAlertCount: 0,
      sidebarCollapsed: false,
      globalFilters: {},
      confirmDialog: null,

      setAuthInfo: ({ user, token }) => {
        setAuth({ user, token });
        set({ user, token, authReady: true });
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        clearAuthStorage();
        set({ user: null, token: '', authReady: false, unreadAlertCount: 0 });
      },

      setUnreadAlertCount: (n) => set({ unreadAlertCount: n }),
      decUnreadAlertCount: (n = 1) =>
        set({ unreadAlertCount: Math.max(0, get().unreadAlertCount - n) }),

      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      openConfirm: (cfg) => set({ confirmDialog: cfg }),
      closeConfirm: () => set({ confirmDialog: null }),

      setGlobalFilter: (key, value) =>
        set({ globalFilters: { ...get().globalFilters, [key]: value } }),
      clearGlobalFilters: () => set({ globalFilters: {} }),
    }),
    {
      name: 'fwc_store_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        globalFilters: s.globalFilters,
      }),
    }
  )
);

export const useIsInternal = (u) => {
  const r = u?.role;
  return [
    ROLE.SUPER_ADMIN,
    ROLE.WAREHOUSE_MANAGER,
    ROLE.PURCHASE_STAFF,
    ROLE.QC_STAFF,
  ].includes(r);
};
export const useCanWrite = (u) => useIsInternal(u);
