"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ClipboardList,
  RotateCcw,
  Server,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { api } from "@/lib/trpc/client";
import {
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_LABELS,
} from "@/lib/label-maps";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const statsQuery = api.alert.stats.useQuery();
  const assetListQuery = api.asset.list.useQuery(
    { page: 1, pageSize: 5 },
    { refetchOnMount: false }
  );
  const alertListQuery = api.alert.list.useQuery(
    { page: 1, pageSize: 8 },
    { refetchOnMount: false }
  );

  const stats = statsQuery.data;
  const trend = stats?.trend ?? [];
  const severityData = stats?.severityCounts.map((s) => ({
    name: ALERT_SEVERITY_LABELS[s.severity].label,
    value: s._count.id,
    fill: severityColor(s.severity),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">仪表盘</h1>
        <p className="mt-1 text-sm text-slate-500">
          值班工程师一览：告警状态、资产与处理趋势
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={AlertCircle}
          label="待处理告警"
          value={stats?.open ?? 0}
          tone="danger"
        />
        <StatCard
          icon={AlertTriangle}
          label="处理中"
          value={stats?.inProgress ?? 0}
          tone="warning"
        />
        <StatCard
          icon={CheckCircle}
          label="已解决"
          value={stats?.resolved ?? 0}
          tone="success"
        />
        <StatCard
          icon={Server}
          label="资产管理总数"
          value={assetListQuery.data?.total ?? 0}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="section-title mb-0 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              近 30 天告警趋势
            </div>
            <Link
              href="/alerts"
              className="text-sm text-primary-600 hover:underline"
            >
              查看全部 →
            </Link>
          </div>
          <div className="h-64 w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="告警数"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyHint text="暂无告警数据" />
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-title">告警严重度分布</div>
          <div className="h-64">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={severityData}
                  layout="vertical"
                  margin={{ left: 0, right: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={56}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" name="数量" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyHint text="暂无告警数据" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="section-title mb-0 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              最新告警
            </div>
            <Link
              href="/alerts"
              className="text-sm text-primary-600 hover:underline"
            >
              全部 →
            </Link>
          </div>
          <div className="space-y-2">
            {(alertListQuery.data?.items ?? []).map((a) => (
              <Link
                key={a.id}
                href={`/alerts/${a.id}`}
                className="flex items-start gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full p-1",
                    a.severity === "CRITICAL"
                      ? "bg-danger-100 text-danger-600"
                      : a.severity === "WARNING"
                      ? "bg-warning-100 text-warning-600"
                      : a.severity === "INFO"
                      ? "bg-primary-100 text-primary-600"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {a.title}
                    </span>
                    <span className={ALERT_STATUS_LABELS[a.status].cls}>
                      {ALERT_STATUS_LABELS[a.status].label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {a.asset?.name ?? "未关联资产"}
                    {a.assignee?.name ? ` · 处理人：${a.assignee.name}` : ""}
                    {a.businessConfirmed ? (
                      <span className="ml-1 text-success-600">
                        · 业务已确认
                      </span>
                    ) : (
                      <span className="ml-1 text-slate-400">
                        · 待业务确认
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {!alertListQuery.isLoading &&
              (alertListQuery.data?.items?.length ?? 0) === 0 && (
                <EmptyHint text="暂无告警" />
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <QuickLink
            icon={ShieldAlert}
            href="/vulnerabilities"
            title="漏洞修复"
            desc="按负责人分组核对修复进度"
            tone="warning"
          />
          <QuickLink
            icon={ClipboardList}
            href="/inspections"
            title="设备巡检"
            desc="巡检计划与执行结果"
            tone="primary"
          />
          <QuickLink
            icon={RotateCcw}
            href="/rollbacks"
            title="回滚方案"
            desc="变更回滚预案与审批"
            tone="success"
          />
          <QuickLink
            icon={Server}
            href="/assets"
            title="资产配置"
            desc="资产登记与配置项管理"
            tone="neutral"
          />
        </div>
      </div>
    </div>
  );
}

function severityColor(s: string) {
  switch (s) {
    case "CRITICAL":
      return "#dc2626";
    case "WARNING":
      return "#d97706";
    case "INFO":
      return "#2563eb";
    default:
      return "#64748b";
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertCircle;
  label: string;
  value: number;
  tone: "danger" | "warning" | "success" | "primary";
}) {
  const palette = {
    danger: "bg-danger-50 text-danger-600",
    warning: "bg-warning-50 text-warning-600",
    success: "bg-success-50 text-success-600",
    primary: "bg-primary-50 text-primary-600",
  }[tone];
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={cn("rounded-xl p-3", palette)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-0.5 text-2xl font-semibold text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  href,
  title,
  desc,
  tone,
}: {
  icon: typeof ShieldAlert;
  href: string;
  title: string;
  desc: string;
  tone: "warning" | "primary" | "success" | "neutral";
}) {
  const palette = {
    warning: "bg-warning-50 text-warning-600",
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    neutral: "bg-slate-100 text-slate-600",
  }[tone];
  return (
    <Link
      href={href}
      className="card flex flex-col justify-between p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30"
    >
      <div className={cn("w-fit rounded-xl p-2", palette)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
      </div>
    </Link>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  );
}
