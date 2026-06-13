"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  TrendingDown,
  TrendingUp,
  Lock,
  Database,
  FileCheck,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { mockData } from "@/utils/mockData";
import {
  severityConfig,
  statusConfig,
  formatNumber,
  formatPercent,
  formatDateTime,
} from "@/utils/format";
import { useNotificationStore } from "@/store/notificationStore";

const caliberChangeLog = [
  {
    id: "cl-1",
    metricId: "1",
    metricName: "销售额",
    fieldChanged: "计算公式",
    oldValue: "SUM(order_amount) WHERE order_status = 'completed'",
    newValue: "SUM(order_amount) WHERE order_status = 'completed' AND refund_status = 'none'",
    changedBy: "数据运营",
    changedAt: "2024-03-15T14:30:00Z",
    approvalStatus: "approved" as const,
    approver: "销售总监",
  },
  {
    id: "cl-2",
    metricId: "4",
    metricName: "转化率",
    fieldChanged: "数据来源",
    oldValue: "全量访客数据",
    newValue: "排除爬虫流量的访客数据",
    changedBy: "产品经理",
    changedAt: "2024-03-18T10:00:00Z",
    approvalStatus: "approved" as const,
    approver: "销售总监",
  },
  {
    id: "cl-3",
    metricId: "5",
    metricName: "新用户数",
    fieldChanged: "计算公式",
    oldValue: "COUNT(DISTINCT user_id) WHERE first_order_date IN period",
    newValue: "COUNT(DISTINCT user_id) WHERE first_order_date IN period AND order_amount > 0",
    changedBy: "数据运营",
    changedAt: "2024-03-22T09:15:00Z",
    approvalStatus: "pending" as const,
    approver: null,
  },
  {
    id: "cl-4",
    metricId: "6",
    metricName: "复购率",
    fieldChanged: "统计周期",
    oldValue: "30天",
    newValue: "90天",
    changedBy: "数据运营",
    changedAt: "2024-03-25T16:00:00Z",
    approvalStatus: "pending" as const,
    approver: null,
  },
  {
    id: "cl-5",
    metricId: "2",
    metricName: "订单量",
    fieldChanged: "计算公式",
    oldValue: "COUNT(order_id) WHERE order_status = 'completed'",
    newValue: "COUNT(order_id) WHERE order_status IN ('completed', 'shipped')",
    changedBy: "产品经理",
    changedAt: "2024-02-28T11:20:00Z",
    approvalStatus: "approved" as const,
    approver: "销售总监",
  },
];

const complianceItems = [
  { label: "数据访问权限审计", compliant: true },
  { label: "敏感数据脱敏处理", compliant: true },
  { label: "数据保留策略执行", compliant: true },
  { label: "异常访问行为检测", compliant: true },
  { label: "报表导出权限控制", compliant: true },
];

const auditEntries = [
  { user: "销售总监", action: "查看报表", target: "月度销售异常报表", time: "2024-03-25 14:30" },
  { user: "数据运营", action: "导出数据", target: "异常明细表", time: "2024-03-24 10:15" },
  { user: "产品经理", action: "查看报表", target: "转化率分析报表", time: "2024-03-23 16:40" },
  { user: "销售总监", action: "审批口径变更", target: "销售额指标口径", time: "2024-03-22 09:00" },
];

const months = [
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
  "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
];

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("2024-03");
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const { caliberChangeAlerts, approveCaliberChange, rejectCaliberChange } =
    useNotificationStore();

  const pendingCount = caliberChangeAlerts.filter(
    (a) => a.status === "pending"
  ).length;

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-");
    return `${y}年${parseInt(m)}月`;
  })();

  const monthIndex = months.indexOf(selectedMonth);

  const stats = useMemo(() => {
    const anomalies = mockData.anomalies;
    const total = anomalies.length;
    const resolved = anomalies.filter(
      (a) => a.status === "RESOLVED"
    ).length;
    const resolutionRate = total > 0 ? resolved / total : 0;

    const resolvedAnomalies = anomalies.filter(
      (a) => a.status === "RESOLVED" && a.resolvedAt && a.detectedAt
    );
    const avgResolutionMs =
      resolvedAnomalies.length > 0
        ? resolvedAnomalies.reduce((sum, a) => {
            return (
              sum +
              (new Date(a.resolvedAt!).getTime() -
                new Date(a.detectedAt).getTime())
            );
          }, 0) / resolvedAnomalies.length
        : 0;
    const avgResolutionHours = avgResolutionMs / (1000 * 60 * 60);

    const bySeverity = {
      LOW: anomalies.filter((a) => a.severity === "LOW").length,
      MEDIUM: anomalies.filter((a) => a.severity === "MEDIUM").length,
      HIGH: anomalies.filter((a) => a.severity === "HIGH").length,
      CRITICAL: anomalies.filter((a) => a.severity === "CRITICAL").length,
    };

    const byMetric = mockData.metrics.map((m) => ({
      id: m.id,
      name: m.name,
      count: anomalies.filter((a) => a.metricId === m.id).length,
    }));

    const topAnomalies = [...anomalies]
      .sort(
        (a, b) =>
          Math.abs(b.deviationPercentage) - Math.abs(a.deviationPercentage)
      )
      .slice(0, 5);

    return { total, resolved, resolutionRate, avgResolutionHours, bySeverity, byMetric, topAnomalies };
  }, []);

  const maxSeverityCount = Math.max(
    stats.bySeverity.LOW,
    stats.bySeverity.MEDIUM,
    stats.bySeverity.HIGH,
    stats.bySeverity.CRITICAL,
    1
  );

  const mergedCaliberLog = useMemo(() => {
    const storePending = caliberChangeAlerts
      .filter((a) => a.status === "pending")
      .map((a) => ({
        id: a.id,
        metricId: a.metricId,
        metricName: a.metricName,
        fieldChanged: "口径变更",
        oldValue: "-",
        newValue: a.proposedChange,
        changedBy: a.requestedBy,
        changedAt: a.requestedAt,
        approvalStatus: "pending" as const,
        approver: null as string | null,
      }));
    return [...storePending, ...caliberChangeLog.filter((c) => c.approvalStatus !== "pending")]
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [caliberChangeAlerts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">报表复盘</h1>
          <p className="text-sm text-neutral-500 mt-1">
            月度异常报告与口径变更审核
          </p>
        </div>
        <button
          onClick={() => alert("报表导出功能开发中")}
          className="btn btn-primary self-start"
        >
          <Download className="w-4 h-4" />
          导出报表
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            有 {pendingCount} 条口径变更待审批
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => monthIndex > 0 && setSelectedMonth(months[monthIndex - 1])}
          disabled={monthIndex <= 0}
          className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-neutral-800">{monthLabel} 月度报表</h2>
        </div>
        <button
          onClick={() =>
            monthIndex < months.length - 1 &&
            setSelectedMonth(months[monthIndex + 1])
          }
          disabled={monthIndex >= months.length - 1}
          className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="select w-auto text-sm"
        >
          {months.map((m) => {
            const [y, mo] = m.split("-");
            return (
              <option key={m} value={m}>
                {y}年{parseInt(mo)}月
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.total}
              </p>
              <p className="text-xs text-neutral-500">异常总数</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.resolved}
              </p>
              <p className="text-xs text-neutral-500">已解决</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {formatPercent(stats.resolutionRate)}
              </p>
              <p className="text-xs text-neutral-500">解决率</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {stats.avgResolutionHours.toFixed(1)}h
              </p>
              <p className="text-xs text-neutral-500">平均解决时长</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">
            按严重程度分布
          </h3>
          <div className="space-y-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((key) => {
              const config = severityConfig[key];
              const count = stats.bySeverity[key];
              const pct = maxSeverityCount > 0 ? (count / maxSeverityCount) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span
                    className={`badge ${config.bg} ${config.color} w-14 justify-center`}
                  >
                    {config.label}
                  </span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${config.dot} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-neutral-800 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">
            按指标分布
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2 text-xs font-medium text-neutral-500">
                    指标名称
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-neutral-500">
                    异常数
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-neutral-500">
                    占比
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.byMetric.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-neutral-50 last:border-b-0"
                  >
                    <td className="py-2.5 text-neutral-800 font-medium">
                      {m.name}
                    </td>
                    <td className="py-2.5 text-right font-mono text-neutral-800">
                      {m.count}
                    </td>
                    <td className="py-2.5 text-right text-neutral-500">
                      {stats.total > 0
                        ? ((m.count / stats.total) * 100).toFixed(1) + "%"
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">
          Top 5 严重异常
        </h3>
        <div className="space-y-3">
          {stats.topAnomalies.map((anomaly, idx) => {
            const severity =
              severityConfig[anomaly.severity as keyof typeof severityConfig];
            const status =
              statusConfig[anomaly.status as keyof typeof statusConfig];
            const isNegative = anomaly.deviationPercentage < 0;
            return (
              <div
                key={anomaly.id}
                className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg"
              >
                <span className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-neutral-800">
                      {anomaly.metric.name}
                    </span>
                    <span className={`badge ${severity.bg} ${severity.color}`}>
                      {severity.label}
                    </span>
                    <span className={`badge ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    实际值 {formatNumber(anomaly.actualValue)} / 偏离{" "}
                    <span
                      className={
                        isNegative ? "text-red-600" : "text-emerald-600"
                      }
                    >
                      {isNegative ? "" : "+"}
                      {anomaly.deviationPercentage}%
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isNegative ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card overflow-hidden">
        <button
          onClick={() => setSecurityExpanded(!securityExpanded)}
          className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-neutral-800">
                数据安全与合规
              </h3>
              <p className="text-xs text-neutral-500">
                本月数据安全审计状态
              </p>
            </div>
          </div>
          {securityExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </button>

        {securityExpanded && (
          <div className="px-5 pb-5 space-y-5 border-t border-neutral-100 pt-5">
            <div>
              <h4 className="text-sm font-medium text-neutral-800 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-neutral-500" />
                数据访问审计
              </h4>
              <div className="space-y-2">
                {auditEntries.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-800">
                        {entry.user}
                      </span>
                      <span className="text-neutral-500">{entry.action}</span>
                      <span className="text-neutral-600">{entry.target}</span>
                    </div>
                    <span className="text-xs text-neutral-400">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-800 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-neutral-500" />
                数据保留策略
              </h4>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>数据保留策略正常执行，无过期数据泄露风险</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1 ml-6">
                  异常数据保留 90 天 · 审计日志保留 1 年 · 报表数据永久保留
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-800 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-neutral-500" />
                安全合规检查
              </h4>
              <div className="space-y-2">
                {complianceItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg"
                  >
                    <span className="text-sm text-neutral-700">
                      {item.label}
                    </span>
                    <span className="badge badge-success">
                      <CheckCircle className="w-3 h-3" />
                      已合规
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">
                  本报表数据已通过安全审计，可用于月度复盘
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-bold text-neutral-800">口径变更日志</h2>
        </div>

        <div className="space-y-4">
          {mergedCaliberLog.map((entry) => {
            const isPending = entry.approvalStatus === "pending";
            const isApproved = entry.approvalStatus === "approved";

            return (
              <div
                key={entry.id}
                className={`card p-5 ${
                  isPending
                    ? "border-amber-200 bg-amber-50/30"
                    : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isPending
                          ? "bg-amber-100"
                          : isApproved
                          ? "bg-emerald-100"
                          : "bg-red-100"
                      }`}
                    >
                      {isPending ? (
                        <Clock className="w-5 h-5 text-amber-600" />
                      ) : isApproved ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-800">
                        {entry.metricName}
                      </span>
                      <span className="badge badge-info">{entry.fieldChanged}</span>
                      {isPending ? (
                        <span className="badge badge-warning">待审批</span>
                      ) : isApproved ? (
                        <span className="badge badge-success">已审批</span>
                      ) : (
                        <span className="badge badge-danger">已拒绝</span>
                      )}
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-500 flex-shrink-0">旧值：</span>
                        <span className="text-neutral-700 font-mono text-xs bg-neutral-100 px-2 py-0.5 rounded truncate">
                          {entry.oldValue}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-500 flex-shrink-0">新值：</span>
                        <span className="text-neutral-800 font-mono text-xs bg-primary-50 px-2 py-0.5 rounded truncate">
                          {entry.newValue}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.changedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(entry.changedAt)}
                      </span>
                      {isApproved && entry.approver && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3 h-3" />
                          审批人：{entry.approver}
                        </span>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveCaliberChange(entry.id)}
                        className="btn btn-primary text-xs px-3 py-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        批准
                      </button>
                      <button
                        onClick={() => rejectCaliberChange(entry.id)}
                        className="btn btn-danger text-xs px-3 py-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
