import type { Metric, MetricDataPoint, DimensionConfig } from "@/types";
import type { EntityType } from "@prisma/client";
import { mockMetrics, getMockMetricData, getCurrentUser } from "./mockData";
import { redis } from "@/lib/redis";
import { auditService } from "./auditService";

export const metricService = {
  async getMetrics(): Promise<Metric[]> {
    const cacheKey = "metrics:list";
    try {
      const cached = await redis.getJSON<Metric[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error("Redis getMetrics cache error:", err);
    }
    const metrics = mockMetrics;
    try {
      await redis.setJSON(cacheKey, metrics, 300);
    } catch (err) {
      console.error("Redis setMetrics cache error:", err);
    }
    return metrics;
  },

  async getMetricById(id: string): Promise<Metric | null> {
    const cacheKey = `metric:${id}`;
    try {
      const cached = await redis.getJSON<Metric>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error(`Redis getMetricById cache error for ${id}:`, err);
    }
    const metric = mockMetrics.find((m) => m.id === id) || null;
    if (metric) {
      try {
        await redis.setJSON(cacheKey, metric, 300);
      } catch (err) {
        console.error(`Redis setMetricById cache error for ${id}:`, err);
      }
    }
    return metric;
  },

  async getMetricData(metricId: string, days: number = 30): Promise<MetricDataPoint[]> {
    try {
      return getMockMetricData(metricId).slice(-days);
    } catch (err) {
      console.error("getMetricData error:", err);
      return getMockMetricData(metricId).slice(-days);
    }
  },

  async updateMetricDimensions(
    metricId: string,
    dimensions: DimensionConfig[],
    remark: string
  ): Promise<Metric | null> {
    if (!remark) {
      throw new Error("remark is required");
    }
    const metricIndex = mockMetrics.findIndex((m) => m.id === metricId);
    if (metricIndex === -1) {
      return null;
    }
    const oldValue = { dimensions: mockMetrics[metricIndex].dimensions };
    const newValue = { dimensions };
    mockMetrics[metricIndex].dimensions = dimensions;
    mockMetrics[metricIndex].updatedAt = new Date();
    const currentUser = getCurrentUser();
    await auditService.createAuditLog(
      "UPDATE_DIMENSIONS",
      "METRIC_THRESHOLD" as EntityType,
      metricId,
      oldValue,
      newValue,
      remark,
      currentUser.id,
      currentUser.name
    );
    try {
      await redis.del(`metric:${metricId}`);
      await redis.del("metrics:list");
    } catch (err) {
      console.error("Redis clear cache error:", err);
    }
    return mockMetrics[metricIndex];
  },
};
