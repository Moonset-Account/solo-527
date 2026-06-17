import type { Alert } from "@/types";
import type { AnomalySeverity, AnomalyStatus, EntityType } from "@prisma/client";
import { mockAlerts, mockUsers, getCurrentUser } from "./mockData";
import { generateId } from "@/lib/utils";
import { auditService } from "./auditService";

export const alertService = {
  async getAlerts(status?: AnomalyStatus): Promise<Alert[]> {
    try {
      let alerts = [...mockAlerts];
      if (status) {
        alerts = alerts.filter((a) => a.status === status);
      }
      return alerts.sort(
        (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
      );
    } catch (err) {
      console.error("getAlerts error:", err);
      return mockAlerts;
    }
  },

  async acknowledgeAlert(id: string, userId: string): Promise<Alert | null> {
    const alertIndex = mockAlerts.findIndex((a) => a.id === id);
    if (alertIndex === -1) {
      return null;
    }
    const oldValue = { ...mockAlerts[alertIndex] };
    mockAlerts[alertIndex].status = "ACKNOWLEDGED" as AnomalyStatus;
    mockAlerts[alertIndex].acknowledgedAt = new Date();
    mockAlerts[alertIndex].acknowledgedBy = userId;
    const newValue = { ...mockAlerts[alertIndex] };
    const user = mockUsers.find((u) => u.id === userId);
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "ACKNOWLEDGE_ALERT",
      "ALERT" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      `告警已由 ${user?.name || userId} 确认`,
      currentUser.id,
      currentUser.name
    );
    return mockAlerts[alertIndex];
  },

  async resolveAlert(id: string): Promise<Alert | null> {
    const alertIndex = mockAlerts.findIndex((a) => a.id === id);
    if (alertIndex === -1) {
      return null;
    }
    const oldValue = { ...mockAlerts[alertIndex] };
    mockAlerts[alertIndex].status = "RESOLVED" as AnomalyStatus;
    mockAlerts[alertIndex].resolvedAt = new Date();
    const newValue = { ...mockAlerts[alertIndex] };
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "RESOLVE_ALERT",
      "ALERT" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      "告警已解决",
      currentUser.id,
      currentUser.name
    );
    return mockAlerts[alertIndex];
  },

  async createAlert(
    ruleId: string,
    anomalyId: string,
    message: string,
    severity: AnomalySeverity
  ): Promise<Alert> {
    const alert: Alert = {
      id: generateId(),
      alertRuleId: ruleId,
      anomalyId,
      message,
      severity,
      status: "OPEN" as AnomalyStatus,
      triggeredAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
    };
    mockAlerts.unshift(alert);
    await sendAlertNotifications(alert);
    return alert;
  },
};

async function sendAlertNotifications(alert: Alert): Promise<void> {
  const salesDirectors = mockUsers.filter((u) => u.role === "SALES_DIRECTOR");
  for (const director of salesDirectors) {
    console.log(
      `[Alert Notification] Sending to ${director.name} (${director.email}): ${alert.message}`
    );
  }
}
