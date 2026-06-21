"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  PhoneCall,
  UsersRound,
  UserX,
  FileSearch,
  AlertTriangle,
  CalendarCheck,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import TrendLineChart from "@/components/charts/TrendLineChart";
import DonutChart from "@/components/charts/DonutChart";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  getDashboardStats,
  getTrendData,
  getFollowUpCompletion,
  getFollowUpTasks,
  getPermissionExceptions,
} from "@/lib/services";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn, formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });
  const { data: trend } = useQuery({
    queryKey: ["trend-data"],
    queryFn: getTrendData,
  });
  const { data: completion } = useQuery({
    queryKey: ["followup-completion"],
    queryFn: getFollowUpCompletion,
  });
  const { data: tasks } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: () => getFollowUpTasks(),
  });
  const { data: exceptions } = useQuery({
    queryKey: ["recent-exceptions"],
    queryFn: () => getPermissionExceptions(),
  });

  const quickActions = [
    {
      href: "/medical-records",
      label: "病历管理",
      desc: "查看主诉与复诊计划",
      icon: FileSearch,
      color: "text-teal-600 bg-teal-50 ring-teal-200",
    },
    {
      href: "/follow-up-tasks",
      label: "随访任务",
      desc: "管理与分配随访工作",
      icon: PhoneCall,
      color: "text-ochre-600 bg-ochre-50 ring-ochre-200",
    },
    {
      href: "/patient-statistics",
      label: "患者统计",
      desc: "复诊率与流失分析",
      icon: BarChart3,
      color: "text-gold-700 bg-gold-50 ring-gold-200",
    },
    {
      href: "/permission-exceptions",
      label: "权限异常",
      desc: "病例异常处理流程",
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50 ring-red-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="今日新增病历"
          value={stats?.todayRecords ?? "--"}
          delta={stats?.todayRecordsDelta}
          deltaType={stats && stats.todayRecordsDelta >= 0 ? "increase" : "decrease"}
          deltaGood
          icon={FileText}
          color="teal"
          suffix="例"
        />
        <StatCard
          title="待随访任务"
          value={stats?.pendingFollowUps ?? "--"}
          delta={stats?.pendingFollowUpsDelta}
          deltaType={stats && stats.pendingFollowUpsDelta >= 0 ? "increase" : "decrease"}
          deltaGood={false}
          icon={PhoneCall}
          color="ochre"
          suffix="项"
        />
        <StatCard
          title="30日复诊率"
          value={stats ? formatPercent(stats.revisitRate, 1) : "--"}
          delta={stats?.revisitRateDelta}
          deltaType={stats && stats.revisitRateDelta >= 0 ? "increase" : "decrease"}
          deltaGood
          icon={UsersRound}
          color="green"
        />
        <StatCard
          title="30日流失率"
          value={stats ? formatPercent(stats.churnRate, 1) : "--"}
          delta={stats?.churnRateDelta}
          deltaType={stats && stats.churnRateDelta >= 0 ? "increase" : "decrease"}
          deltaGood={false}
          icon={UserX}
          color="red"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">
                复诊率与流失率趋势
              </h3>
              <p className="text-xs text-ink-600">近30天数据追踪</p>
            </div>
            <Link
              href="/patient-statistics"
              className="flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              详细分析 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divider-gold my-3" />
          {trend ? (
            <TrendLineChart revisit={trend.revisit} churn={trend.churn} />
          ) : (
            <div className="skeleton h-[280px] w-full" />
          )}
        </div>

        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="mb-2">
            <h3 className="font-display text-base font-semibold text-ink-900">
              随访任务完成分布
            </h3>
            <p className="text-xs text-ink-600">本月累计任务进度</p>
          </div>
          <div className="divider-gold my-3" />
          {completion ? (
            <DonutChart
              completed={completion.completed}
              pending={completion.pending}
              inProgress={completion.inProgress}
              overdue={completion.overdue}
            />
          ) : (
            <div className="skeleton h-[280px] w-full" />
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <h3 className="font-display text-base font-semibold text-ink-900">
            快捷入口
          </h3>
          <div className="divider-gold my-3" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a, idx) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex flex-col gap-2 rounded-lg border border-gold-200/40 bg-cream-50 p-3 transition-all hover:-translate-y-0.5 hover:border-teal-300/60 hover:bg-white hover:shadow-card"
                  style={{ animation: `fadeInUp 0.4s ease-out ${idx * 60}ms both` }}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md ring-1",
                      a.color
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900 group-hover:text-teal-700">
                      {a.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-600">{a.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">
              近期随访任务
            </h3>
            <Link
              href="/follow-up-tasks"
              className="flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              查看全部 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divider-gold my-3" />
          <div className="space-y-2.5">
            {tasks?.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold-100/60 bg-cream-50/60 px-3 py-2 transition-colors hover:bg-cream-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {t.patient?.name}
                  </p>
                  <p className="truncate text-[11px] text-ink-600">
                    {format(new Date(t.planned_date), "MM月dd日 EEEE", {
                      locale: zhCN,
                    })}
                    {t.assignee && ` · ${t.assignee.full_name}`}
                  </p>
                </div>
                <StatusBadge
                  variant={
                    (t.status as "pending" | "inProgress" | "completed" | "overdue") ||
                    "pending"
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">
              待处理异常
            </h3>
            <Link
              href="/permission-exceptions"
              className="flex items-center gap-0.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              处理中心 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divider-gold my-3" />
          <div className="space-y-2.5">
            {exceptions
              ?.filter((e) => e.status !== "resolved" && e.status !== "closed")
              .slice(0, 5)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gold-100/60 bg-cream-50/60 px-3 py-2 transition-colors hover:bg-cream-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {e.exception_type}
                    </p>
                    <p className="truncate text-[11px] text-ink-600">
                      {e.record?.patient && `${e.record.patient.name} · `}
                      {e.record?.department}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge
                      variant={(e.severity as "low" | "medium" | "high" | "critical")}
                      dot
                    />
                    <span className="text-[10px] text-ink-600">
                      {format(new Date(e.created_at), "MM-dd")}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
