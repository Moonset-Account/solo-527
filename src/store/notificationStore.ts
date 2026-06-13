import { create } from "zustand";

interface CaliberChangeAlert {
  id: string;
  metricId: string;
  metricName: string;
  proposedChange: string;
  requestedBy: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface NotificationStore {
  unreadCount: number;
  selectedMetricId: string | null;
  caliberChangeAlerts: CaliberChangeAlert[];

  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
  setSelectedMetricId: (id: string | null) => void;
  addCaliberChangeAlert: (alert: CaliberChangeAlert) => void;
  removeCaliberChangeAlert: (id: string) => void;
  approveCaliberChange: (id: string) => void;
  rejectCaliberChange: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 3,
  selectedMetricId: null,
  caliberChangeAlerts: [
    {
      id: "caliber-1",
      metricId: "1",
      metricName: "销售额",
      proposedChange: "调整退款订单剔除逻辑，新增7天无理由退货数据",
      requestedBy: "数据运营",
      requestedAt: "2024-03-20T10:00:00Z",
      status: "pending",
    },
    {
      id: "caliber-2",
      metricId: "4",
      metricName: "转化率",
      proposedChange: "修改访客定义，排除爬虫流量",
      requestedBy: "产品经理",
      requestedAt: "2024-03-18T14:30:00Z",
      status: "pending",
    },
  ],

  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  resetUnread: () => set({ unreadCount: 0 }),
  setSelectedMetricId: (id) => set({ selectedMetricId: id }),
  addCaliberChangeAlert: (alert) =>
    set((state) => ({
      caliberChangeAlerts: [...state.caliberChangeAlerts, alert],
      unreadCount: state.unreadCount + 1,
    })),
  removeCaliberChangeAlert: (id) =>
    set((state) => ({
      caliberChangeAlerts: state.caliberChangeAlerts.filter((a) => a.id !== id),
    })),
  approveCaliberChange: (id) =>
    set((state) => ({
      caliberChangeAlerts: state.caliberChangeAlerts.map((a) =>
        a.id === id ? { ...a, status: "approved" as const } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  rejectCaliberChange: (id) =>
    set((state) => ({
      caliberChangeAlerts: state.caliberChangeAlerts.map((a) =>
        a.id === id ? { ...a, status: "rejected" as const } : a
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
