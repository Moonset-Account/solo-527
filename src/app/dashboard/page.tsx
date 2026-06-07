"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/common/MetricCard";
import { WorkloadHeatmap } from "@/components/charts/WorkloadHeatmap";
import { TimeoutTrendChart } from "@/components/charts/TimeoutTrendChart";
import { TagDistributionChart } from "@/components/charts/TagDistributionChart";
import { StaffRankingTable } from "@/components/charts/StaffRankingTable";
import { trpc } from "@/lib/trpc/client";
import { useFilterStore } from "@/store/filterStore";
import {
  MessageSquare,
  Clock,
  Star,
  AlertTriangle,
  ArrowRightLeft,
  Smile,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { teamIds, dateRange } = useFilterStore();

  const { data: metrics } = trpc.dashboard.getMetrics.useQuery({
    dateRange,
  });

  const { data: workload = [] } = trpc.dashboard.getTeamWorkload.useQuery({
    teamIds: teamIds.length > 0 ? teamIds : undefined,
  });

  const { data: timeoutTrend = [] } = trpc.dashboard.getTimeoutTrend.useQuery({
    days: 7,
    teamIds: teamIds.length > 0 ? teamIds : undefined,
  });

  const { data: tagDistribution = [] } = trpc.dashboard.getTagDistribution.useQuery({
    dateRange,
  });

  const { data: staffRanking = [] } = trpc.dashboard.getStaffRanking.useQuery({
    teamIds: teamIds.length > 0 ? teamIds : undefined,
    includeProbation: true,
  });

  return (
    <DashboardLayout title="看板总览" subtitle="实时监控客服运营数据">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="会话总量"
            value={metrics?.totalSessions.toLocaleString() || 0}
            unit="次"
            trend={metrics?.trends.sessions}
            trendLabel="较上周"
            color="primary"
            icon={<MessageSquare className="w-5 h-5 text-primary-500" />}
          />
          <MetricCard
            title="平均等待时长"
            value={metrics?.avgWaitTime || 0}
            unit="秒"
            trend={metrics?.trends.waitTime}
            trendLabel="较上周"
            color="warning"
            icon={<Clock className="w-5 h-5 text-warning-500" />}
          />
          <MetricCard
            title="质检平均分"
            value={metrics?.avgQualityScore.toFixed(1) || 0}
            unit="分"
            trend={metrics?.trends.quality}
            trendLabel="较上周"
            color="success"
            icon={<Star className="w-5 h-5 text-success-500" />}
          />
          <MetricCard
            title="超时率"
            value={(metrics ? metrics.timeoutRate * 100 : 0).toFixed(1)}
            unit="%"
            trend={metrics?.trends.timeout}
            trendLabel="较上周"
            color="danger"
            icon={<AlertTriangle className="w-5 h-5 text-danger-500" />}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="转接率"
            value={(metrics ? metrics.transferRate * 100 : 0).toFixed(1)}
            unit="%"
            color="primary"
            icon={<ArrowRightLeft className="w-5 h-5 text-primary-500" />}
          />
          <MetricCard
            title="平均满意度"
            value={metrics?.avgSatisfaction.toFixed(1) || 0}
            unit="星"
            color="success"
            icon={<Smile className="w-5 h-5 text-success-500" />}
          />
          <MetricCard
            title="在岗人数"
            value={`${metrics?.staffOnDuty || 0}/${metrics?.totalStaff || 0}`}
            unit="人"
            color="warning"
            icon={<Users className="w-5 h-5 text-warning-500" />}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">班组负载热力图</h3>
            <WorkloadHeatmap data={workload} />
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-neutral-800 mb-4">超时趋势分析</h3>
            <TimeoutTrendChart data={timeoutTrend} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="card">
            <TagDistributionChart data={tagDistribution} />
          </div>
          <div className="col-span-2 card">
            <StaffRankingTable data={staffRanking} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
