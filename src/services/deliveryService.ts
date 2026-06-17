import type { DeliveryProject, ReviewReport, ProgressRemark } from "@/types";
import type { DeliveryStatus, EntityType } from "@prisma/client";
import {
  mockDeliveryProjects,
  mockReviewReports,
  mockMetrics,
  mockAnomalies,
  getCurrentUser,
} from "./mockData";
import { generateId } from "@/lib/utils";
import { auditService } from "./auditService";

export const deliveryService = {
  async getProjects(status?: DeliveryStatus): Promise<DeliveryProject[]> {
    try {
      let projects = [...mockDeliveryProjects];
      if (status) {
        projects = projects.filter((p) => p.status === status);
      }
      return projects.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (err) {
      console.error("getProjects error:", err);
      return mockDeliveryProjects;
    }
  },

  async getProjectById(id: string): Promise<DeliveryProject | null> {
    try {
      return mockDeliveryProjects.find((p) => p.id === id) || null;
    } catch (err) {
      console.error("getProjectById error:", err);
      return mockDeliveryProjects.find((p) => p.id === id) || null;
    }
  },

  async updateProjectProgress(
    id: string,
    progress: number,
    remark: string
  ): Promise<DeliveryProject | null> {
    if (!remark) {
      throw new Error("remark is required");
    }
    const projectIndex = mockDeliveryProjects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      return null;
    }
    const oldValue = { progress: mockDeliveryProjects[projectIndex].progress };
    mockDeliveryProjects[projectIndex].progress = progress;
    mockDeliveryProjects[projectIndex].updatedAt = new Date();
    const currentUser = getCurrentUser();
    const progressRemark: ProgressRemark = {
      id: generateId(),
      content: remark,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date(),
      progressSnapshot: progress,
    };
    mockDeliveryProjects[projectIndex].remarks.push(progressRemark);
    if (progress >= 100) {
      mockDeliveryProjects[projectIndex].status = "COMPLETED" as DeliveryStatus;
    }
    const newValue = {
      progress,
      remarks: mockDeliveryProjects[projectIndex].remarks,
    };
    await auditService.createAuditLog(
      "UPDATE_PROGRESS",
      "DELIVERY_PROJECT" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      remark,
      currentUser.id,
      currentUser.name
    );
    return mockDeliveryProjects[projectIndex];
  },

  async getReviewReports(): Promise<ReviewReport[]> {
    try {
      return [...mockReviewReports].sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      );
    } catch (err) {
      console.error("getReviewReports error:", err);
      return mockReviewReports;
    }
  },

  async generateReviewReport(month: string): Promise<ReviewReport> {
    const currentUser = getCurrentUser();
    const existingReport = mockReviewReports.find((r) => r.month === month);
    if (existingReport) {
      return existingReport;
    }
    const metricsSummary = mockMetrics.map((metric) => ({
      metricId: metric.id,
      metricName: metric.name,
      targetValue: metric.previousValue * 1.1,
      actualValue: metric.currentValue,
      completionRate: metric.currentValue / (metric.previousValue * 1.1),
      anomalyCount: mockAnomalies.filter((a) => a.metricId === metric.id).length,
    }));
    const monthAnomalies = mockAnomalies.filter((a) =>
      a.detectedAt.toISOString().startsWith(month)
    );
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    for (const anomaly of monthAnomalies) {
      bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
      if (anomaly.rootCauseCategory) {
        byCategory[anomaly.rootCauseCategory] =
          (byCategory[anomaly.rootCauseCategory] || 0) + 1;
      }
      if (anomaly.resolvedAt) {
        const resolutionTime =
          (new Date(anomaly.resolvedAt).getTime() -
            new Date(anomaly.detectedAt).getTime()) /
          (1000 * 60 * 60);
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }
    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
    const monthProjects = mockDeliveryProjects.filter(
      (p) =>
        p.startDate.toISOString().startsWith(month) ||
        p.endDate.toISOString().startsWith(month)
    );
    const completedProjects = monthProjects.filter(
      (p) => p.status === "COMPLETED"
    ).length;
    const onTimeProjects = monthProjects.filter(
      (p) =>
        p.status === "COMPLETED" &&
        new Date(p.updatedAt) <= new Date(p.endDate)
    ).length;
    const report: ReviewReport = {
      id: generateId(),
      month,
      metricsSummary,
      anomaliesSummary: {
        total: monthAnomalies.length,
        bySeverity,
        byCategory,
        avgResolutionTime,
      },
      deliverySummary: {
        totalProjects: monthProjects.length,
        completedProjects,
        onTimeRate:
          monthProjects.length > 0 ? onTimeProjects / monthProjects.length : 0,
      },
      generatedBy: currentUser.id,
      generatedByName: currentUser.name,
      generatedAt: new Date(),
    };
    mockReviewReports.unshift(report);
    await auditService.createAuditLog(
      "GENERATE_REPORT",
      "REVIEW_REPORT" as EntityType,
      report.id,
      null,
      report as unknown as Record<string, unknown>,
      `生成 ${month} 月度复盘报表`,
      currentUser.id,
      currentUser.name
    );
    return report;
  },
};
