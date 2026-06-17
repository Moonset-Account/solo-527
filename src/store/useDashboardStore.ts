import { create } from "zustand";
import type { Metric, Anomaly, Alert } from "@/types";

interface DashboardState {
  metrics: Metric[];
  anomalies: Anomaly[];
  alerts: Alert[];
  selectedTimeRange: "7d" | "30d" | "90d";
  isLoading: boolean;
  error: string | null;

  setMetrics: (metrics: Metric[]) => void;
  setAnomalies: (anomalies: Anomaly[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setTimeRange: (range: "7d" | "30d" | "90d") => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchDashboardData: () => Promise<void>;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: [],
  anomalies: [],
  alerts: [],
  selectedTimeRange: "30d",
  isLoading: false,
  error: null,

  setMetrics: (metrics) => set({ metrics }),
  setAnomalies: (anomalies) => set({ anomalies }),
  setAlerts: (alerts) => set({ alerts }),
  setTimeRange: (range) => set({ selectedTimeRange: range }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [metricsRes, anomaliesRes, alertsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/anomalies?status=OPEN&status=INVESTIGATING"),
        fetch("/api/alerts?status=OPEN"),
      ]);

      const [metricsData, anomaliesData, alertsData] = await Promise.all([
        metricsRes.json(),
        anomaliesRes.json(),
        alertsRes.json(),
      ]);

      if (metricsData.success) set({ metrics: metricsData.data });
      if (anomaliesData.success) set({ anomalies: anomaliesData.data.items });
      if (alertsData.success) set({ alerts: alertsData.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "加载失败" });
    } finally {
      set({ isLoading: false });
    }
  },

  acknowledgeAlert: async (alertId: string, userId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acknowledge", userId, remark: "已认领告警" }),
      });
      const data = await res.json();
      if (data.success) {
        const alerts = get().alerts.map((a) =>
          a.id === alertId ? { ...a, status: "INVESTIGATING" as const, acknowledgedBy: userId } : a
        );
        set({ alerts });
      }
    } catch (error) {
      console.error("认领告警失败:", error);
    }
  },
}));
