import type { Subscription } from "@/types";
import type { NotificationChannel, EntityType } from "@prisma/client";
import { mockMetrics, getCurrentUser } from "./mockData";
import { generateId } from "@/lib/utils";
import { auditService } from "./auditService";

export const subscriptionService = {
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const subscriptions: Subscription[] = [];
      for (const metric of mockMetrics) {
        subscriptions.push(...metric.subscriptions);
      }
      return subscriptions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error("getSubscriptions error:", err);
      const subscriptions: Subscription[] = [];
      for (const metric of mockMetrics) {
        subscriptions.push(...metric.subscriptions);
      }
      return subscriptions;
    }
  },

  async createSubscription(
    data: {
      metricId: string;
      name: string;
      dimensions?: Record<string, string[]> | null;
      channels: NotificationChannel[];
      subscribers: string[];
      schedule: {
        hour: number;
        minute: number;
        timezone: string;
      };
      templateId?: string | null;
      isEnabled?: boolean;
      remark: string;
    }
  ): Promise<Subscription | null> {
    if (!data.remark) {
      throw new Error("remark is required");
    }
    const metricIndex = mockMetrics.findIndex((m) => m.id === data.metricId);
    if (metricIndex === -1) {
      return null;
    }
    const currentUser = getCurrentUser();
    const subscription: Subscription = {
      id: generateId(),
      metricId: data.metricId,
      name: data.name,
      dimensions: data.dimensions ?? null,
      channels: data.channels,
      subscribers: data.subscribers,
      schedule: data.schedule,
      templateId: data.templateId ?? null,
      isEnabled: data.isEnabled ?? true,
      createdBy: currentUser.id,
      createdAt: new Date(),
    };
    mockMetrics[metricIndex].subscriptions.push(subscription);
    await auditService.createAuditLog(
      "CREATE_SUBSCRIPTION",
      "SUBSCRIPTION" as EntityType,
      subscription.id,
      null,
      subscription as unknown as Record<string, unknown>,
      data.remark,
      currentUser.id,
      currentUser.name
    );
    return subscription;
  },

  async updateSubscription(
    id: string,
    data: {
      name?: string;
      dimensions?: Record<string, string[]> | null;
      channels?: NotificationChannel[];
      subscribers?: string[];
      schedule?: {
        hour: number;
        minute: number;
        timezone: string;
      };
      templateId?: string | null;
      isEnabled?: boolean;
      remark: string;
    }
  ): Promise<Subscription | null> {
    if (!data.remark) {
      throw new Error("remark is required");
    }
    let subscriptionIndex = -1;
    let metricIndex = -1;
    for (let mi = 0; mi < mockMetrics.length; mi++) {
      const si = mockMetrics[mi].subscriptions.findIndex((s) => s.id === id);
      if (si !== -1) {
        subscriptionIndex = si;
        metricIndex = mi;
        break;
      }
    }
    if (subscriptionIndex === -1 || metricIndex === -1) {
      return null;
    }
    const oldValue = { ...mockMetrics[metricIndex].subscriptions[subscriptionIndex] };
    if (data.name !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].name = data.name;
    }
    if (data.dimensions !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].dimensions = data.dimensions;
    }
    if (data.channels !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].channels = data.channels;
    }
    if (data.subscribers !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].subscribers = data.subscribers;
    }
    if (data.schedule !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].schedule = data.schedule;
    }
    if (data.templateId !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].templateId = data.templateId;
    }
    if (data.isEnabled !== undefined) {
      mockMetrics[metricIndex].subscriptions[subscriptionIndex].isEnabled = data.isEnabled;
    }
    const newValue = { ...mockMetrics[metricIndex].subscriptions[subscriptionIndex] };
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "UPDATE_SUBSCRIPTION",
      "SUBSCRIPTION" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      data.remark,
      currentUser.id,
      currentUser.name
    );
    return mockMetrics[metricIndex].subscriptions[subscriptionIndex];
  },

  async deleteSubscription(id: string): Promise<boolean> {
    let subscriptionIndex = -1;
    let metricIndex = -1;
    for (let mi = 0; mi < mockMetrics.length; mi++) {
      const si = mockMetrics[mi].subscriptions.findIndex((s) => s.id === id);
      if (si !== -1) {
        subscriptionIndex = si;
        metricIndex = mi;
        break;
      }
    }
    if (subscriptionIndex === -1 || metricIndex === -1) {
      return false;
    }
    const deleted = mockMetrics[metricIndex].subscriptions.splice(subscriptionIndex, 1)[0];
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "DELETE_SUBSCRIPTION",
      "SUBSCRIPTION" as EntityType,
      id,
      deleted as unknown as Record<string, unknown>,
      null,
      "删除订阅",
      currentUser.id,
      currentUser.name
    );
    return true;
  },
};
