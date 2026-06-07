"use client";

import DashboardLayout from "@/components/DashboardLayout";
import {
  RepeatRateTrend,
  ResponseTimeDistribution,
  RepairTypeDistribution,
  MaterialsUsage,
} from "@/components/Charts";
import { MOCK_WORK_ORDERS } from "@/mock/data";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            数据分析
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            多维度分析维修数据，洞察服务质量
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RepeatRateTrend orders={MOCK_WORK_ORDERS} title="复修率趋势分析" />
          <ResponseTimeDistribution orders={MOCK_WORK_ORDERS} title="响应时长分位数统计" />
          <RepairTypeDistribution orders={MOCK_WORK_ORDERS} title="维修类型分布" />
          <MaterialsUsage orders={MOCK_WORK_ORDERS} title="材料消耗排行" />
        </div>
      </div>
    </DashboardLayout>
  );
}
