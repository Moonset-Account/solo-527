import type { Anomaly } from "@/types";
import type { AnomalySeverity, AnomalyStatus, RootCauseCategory, EntityType } from "@prisma/client";
import { mockAnomalies, mockMetrics, mockUsers, getCurrentUser, getMockMetricData } from "./mockData";
import { generateId, detectAnomalyThreeSigma } from "@/lib/utils";
import { auditService } from "./auditService";
import { alertService } from "./alertService";

export const anomalyService = {
  async getAnomalies(
    status?: AnomalyStatus,
    severity?: AnomalySeverity
  ): Promise<Anomaly[]> {
    try {
      let anomalies = [...mockAnomalies];
      if (status) {
        anomalies = anomalies.filter((a) => a.status === status);
      }
      if (severity) {
        anomalies = anomalies.filter((a) => a.severity === severity);
      }
      return anomalies.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
    } catch (err) {
      console.error("getAnomalies error:", err);
      return mockAnomalies;
    }
  },

  async getAnomalyById(id: string): Promise<Anomaly | null> {
    try {
      return mockAnomalies.find((a) => a.id === id) || null;
    } catch (err) {
      console.error("getAnomalyById error:", err);
      return mockAnomalies.find((a) => a.id === id) || null;
    }
  },

  async updateAnomaly(
    id: string,
    data: {
      rootCause?: string;
      rootCauseCategory?: RootCauseCategory;
      impactAssessment?: string;
      resolution?: string;
      status?: AnomalyStatus;
      assignee?: string;
      remark: string;
    }
  ): Promise<Anomaly | null> {
    if (!data.remark) {
      throw new Error("remark is required");
    }
    const anomalyIndex = mockAnomalies.findIndex((a) => a.id === id);
    if (anomalyIndex === -1) {
      return null;
    }
    const oldValue = { ...mockAnomalies[anomalyIndex] };
    if (data.rootCause !== undefined) {
      mockAnomalies[anomalyIndex].rootCause = data.rootCause;
    }
    if (data.rootCauseCategory !== undefined) {
      mockAnomalies[anomalyIndex].rootCauseCategory = data.rootCauseCategory;
    }
    if (data.impactAssessment !== undefined) {
      mockAnomalies[anomalyIndex].impactAssessment = data.impactAssessment;
    }
    if (data.resolution !== undefined) {
      mockAnomalies[anomalyIndex].resolution = data.resolution;
    }
    if (data.status !== undefined) {
      mockAnomalies[anomalyIndex].status = data.status;
      if (data.status === "RESOLVED") {
        mockAnomalies[anomalyIndex].resolvedAt = new Date();
      }
    }
    if (data.assignee !== undefined) {
      mockAnomalies[anomalyIndex].assignee = data.assignee;
      const user = mockUsers.find((u) => u.id === data.assignee);
      mockAnomalies[anomalyIndex].assigneeName = user?.name || null;
    }
    const newValue = { ...mockAnomalies[anomalyIndex] };
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "UPDATE_ANOMALY",
      "ANOMALY" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      data.remark,
      currentUser.id,
      currentUser.name
    );
    return mockAnomalies[anomalyIndex];
  },

  async detectAnomalies(): Promise<Anomaly[]> {
    const detectedAnomalies: Anomaly[] = [];
    for (const metric of mockMetrics) {
      const metricData = getMockMetricData(metric.id);
      if (metricData.length < 2) continue;
      const values = metricData.map((d) => d.value);
      const latestValue = values[values.length - 1];
      const historicalValues = values.slice(0, -1);
      const result = detectAnomalyThreeSigma(latestValue, historicalValues);
      if (result.isAnomaly) {
        const mean = historicalValues.reduce((sum, v) => sum + v, 0) / historicalValues.length;
        const deviation = Math.abs(latestValue - mean);
        const deviationPercent = deviation / mean;
        const severity: AnomalySeverity =
          deviationPercent > 0.2
            ? "CRITICAL"
            : deviationPercent > 0.1
              ? "HIGH"
              : deviationPercent > 0.05
                ? "MEDIUM"
                : "LOW";
        const anomaly: Anomaly = {
          id: generateId(),
          metricId: metric.id,
          metricName: metric.name,
          detectedAt: new Date(),
          severity,
          actualValue: latestValue,
          expectedValue: Math.round(mean),
          deviation: Math.round(deviation),
          deviationPercent: Number(deviationPercent.toFixed(4)),
          status: "OPEN" as AnomalyStatus,
          rootCause: null,
          rootCauseCategory: null,
          impactAssessment: null,
          resolution: null,
          assignee: null,
          assigneeName: null,
          resolvedAt: null,
          relatedAnomalies: null,
          createdAt: new Date(),
        };
        mockAnomalies.unshift(anomaly);
        detectedAnomalies.push(anomaly);
        await notifySalesDirector(anomaly);
        const alertRule = metric.alertRules.find((r) => r.isEnabled);
        if (alertRule) {
          await alertService.createAlert(
            alertRule.id,
            anomaly.id,
            `【${severity}】${metric.name} 异常波动，当前值 ${latestValue}，偏离预期 ${(deviationPercent * 100).toFixed(2)}%`,
            severity
          );
        }
      }
    }
    return detectedAnomalies;
  },
};

async function notifySalesDirector(anomaly: Anomaly): Promise<void> {
  const salesDirectors = mockUsers.filter((u) => u.role === "SALES_DIRECTOR");
  for (const director of salesDirectors) {
    console.log(
      `[Notification] Sending anomaly notification to ${director.name} (${director.email}): ${anomaly.metricName} - ${anomaly.severity}`
    );
  }
}
