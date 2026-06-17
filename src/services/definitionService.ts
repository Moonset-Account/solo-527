import type { MetricDefinition } from "@/types";
import type { ApprovalStatus, EntityType } from "@prisma/client";
import { mockMetricDefinitions, mockMetrics, mockUsers, getCurrentUser } from "./mockData";
import { generateId } from "@/lib/utils";
import { auditService } from "./auditService";

export const definitionService = {
  async getDefinitions(metricId?: string): Promise<MetricDefinition[]> {
    try {
      let definitions = [...mockMetricDefinitions];
      if (metricId) {
        definitions = definitions.filter((d) => d.metricId === metricId);
      }
      return definitions.sort((a, b) => b.version - a.version);
    } catch (err) {
      console.error("getDefinitions error:", err);
      return mockMetricDefinitions;
    }
  },

  async getDefinitionById(id: string): Promise<MetricDefinition | null> {
    try {
      return mockMetricDefinitions.find((d) => d.id === id) || null;
    } catch (err) {
      console.error("getDefinitionById error:", err);
      return mockMetricDefinitions.find((d) => d.id === id) || null;
    }
  },

  async getVersionHistory(metricId: string): Promise<MetricDefinition[]> {
    try {
      return mockMetricDefinitions
        .filter((d) => d.metricId === metricId)
        .sort((a, b) => b.version - a.version);
    } catch (err) {
      console.error("getVersionHistory error:", err);
      return mockMetricDefinitions
        .filter((d) => d.metricId === metricId)
        .sort((a, b) => b.version - a.version);
    }
  },

  async compareVersions(
    metricId: string,
    v1: number,
    v2: number
  ): Promise<{
    version1: MetricDefinition | null;
    version2: MetricDefinition | null;
    differences: string[];
  }> {
    const version1 =
      mockMetricDefinitions.find((d) => d.metricId === metricId && d.version === v1) || null;
    const version2 =
      mockMetricDefinitions.find((d) => d.metricId === metricId && d.version === v2) || null;
    const differences: string[] = [];
    if (version1 && version2) {
      const fields: (keyof MetricDefinition)[] = [
        "name",
        "description",
        "calculationLogic",
        "sqlQuery",
        "dataSource",
        "businessOwner",
        "technicalOwner",
      ];
      for (const field of fields) {
        const val1 = version1[field];
        const val2 = version2[field];
        if (val1 !== val2) {
          differences.push(`${field}: "${val1}" -> "${val2}"`);
        }
      }
    }
    return { version1, version2, differences };
  },

  async createDefinition(
    data: {
      metricId: string;
      name: string;
      description?: string | null;
      calculationLogic: string;
      sqlQuery?: string | null;
      dataSource?: string | null;
      businessOwner?: string | null;
      technicalOwner?: string | null;
      changeImpact?: string | null;
      changeReason: string;
    }
  ): Promise<MetricDefinition> {
    if (!data.changeReason) {
      throw new Error("changeReason is required");
    }
    const existingVersions = mockMetricDefinitions.filter((d) => d.metricId === data.metricId);
    const maxVersion =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((d) => d.version))
        : 0;
    for (const def of existingVersions) {
      def.isCurrent = false;
    }
    const metric = mockMetrics.find((m) => m.id === data.metricId);
    const currentUser = getCurrentUser();
    const businessOwnerUser = data.businessOwner
      ? mockUsers.find((u) => u.id === data.businessOwner)
      : null;
    const technicalOwnerUser = data.technicalOwner
      ? mockUsers.find((u) => u.id === data.technicalOwner)
      : null;
    const definition: MetricDefinition = {
      id: generateId(),
      metricId: data.metricId,
      version: maxVersion + 1,
      name: data.name,
      description: data.description ?? metric?.description ?? null,
      calculationLogic: data.calculationLogic,
      sqlQuery: data.sqlQuery ?? null,
      dataSource: data.dataSource ?? null,
      businessOwner: data.businessOwner ?? null,
      businessOwnerName: businessOwnerUser?.name ?? null,
      technicalOwner: data.technicalOwner ?? null,
      technicalOwnerName: technicalOwnerUser?.name ?? null,
      changeReason: data.changeReason,
      changeImpact: data.changeImpact ?? null,
      approvalStatus: "PENDING" as ApprovalStatus,
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date(),
      isCurrent: true,
    };
    mockMetricDefinitions.unshift(definition);
    await auditService.createAuditLog(
      "CREATE_DEFINITION",
      "DEFINITION_CHANGE" as EntityType,
      definition.id,
      null,
      definition as unknown as Record<string, unknown>,
      data.changeReason,
      currentUser.id,
      currentUser.name
    );
    return definition;
  },

  async approveDefinition(
    id: string,
    userId: string
  ): Promise<MetricDefinition | null> {
    const definitionIndex = mockMetricDefinitions.findIndex((d) => d.id === id);
    if (definitionIndex === -1) {
      return null;
    }
    const oldValue = { ...mockMetricDefinitions[definitionIndex] };
    const user = mockUsers.find((u) => u.id === userId);
    mockMetricDefinitions[definitionIndex].approvalStatus = "APPROVED" as ApprovalStatus;
    mockMetricDefinitions[definitionIndex].approvedBy = userId;
    mockMetricDefinitions[definitionIndex].approvedByName = user?.name || null;
    mockMetricDefinitions[definitionIndex].approvedAt = new Date();
    const newValue = { ...mockMetricDefinitions[definitionIndex] };
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "APPROVE_DEFINITION",
      "DEFINITION_CHANGE" as EntityType,
      id,
      oldValue as unknown as Record<string, unknown>,
      newValue as unknown as Record<string, unknown>,
      `口径定义已由 ${user?.name || userId} 审批通过`,
      currentUser.id,
      currentUser.name
    );
    return mockMetricDefinitions[definitionIndex];
  },
};
