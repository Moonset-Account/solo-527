import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  type?: 'default' | 'warning' | 'danger';
}

interface UIState {
  notifications: Notification[];
  openModals: ModalConfig[];
  isLoading: boolean;
  loadingText: string;

  pushNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  openModal: (config: Omit<ModalConfig, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  setLoading: (loading: boolean, text?: string) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const useUIStore = create<UIState>((set, get) => ({
  notifications: [],
  openModals: [],
  isLoading: false,
  loadingText: '',

  pushNotification: (notification) => {
    const id = generateId();
    const fullNotification: Notification = {
      id,
      duration: 4000,
      ...notification,
    };
    set((state) => ({
      notifications: [...state.notifications, fullNotification],
    }));
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, fullNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  openModal: (config) => {
    const id = generateId();
    const fullConfig: ModalConfig = {
      id,
      confirmText: '确定',
      cancelText: '取消',
      showCancel: true,
      type: 'default',
      ...config,
    };
    set((state) => ({
      openModals: [...state.openModals, fullConfig],
    }));
    return id;
  },

  closeModal: (id) => {
    set((state) => ({
      openModals: state.openModals.filter((m) => m.id !== id),
    }));
  },

  closeAllModals: () => {
    set({ openModals: [] });
  },

  setLoading: (loading, text = '') => {
    set({ isLoading: loading, loadingText: text });
  },
}));

export default useUIStore;
