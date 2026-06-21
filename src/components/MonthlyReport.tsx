"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateTime, formatNumber } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area,
} from "recharts";
import {
  TrendingUp, Users, Calendar, Percent, Clock, Star,
  FileDown, ChevronLeft, ChevronRight, BarChart3, LineChart as LineIcon,
} from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { RenewalTable } from "@/components/RenewalTable";

const MajorMap: Record<string, string> = {
  FINE_ARTS: "美术",
  DESIGN: "设计",
  MEDIA: "传媒",
  MUSIC: "音乐",
  DANCE: "舞蹈",
  OTHER: "其他",
};

export function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState("overview");

  const { data } = trpc.reports.monthlyReport.useQuery({ year, month });

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-5">
      <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-secondary !px-2 !py-1.5">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-baseline gap-2 px-3 py-1 bg-deep-blue-50/60 rounded-lg">
            <Calendar size={16} className="text-ink-gold-500" />
            <span className="text-lg font-semibold text-deep-blue-700 font-serif">{data?.period ?? `${year}年${month}月`}</span>
          </div>
          <button onClick={nextMonth} className="btn-secondary !px-2 !py-1.5">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="inline-flex items-center gap-1 p-1 bg-deep-blue-50/60 rounded-lg">
          {([
            { v: "overview", label: "经营概览", icon: <BarChart3 size={13} /> },
            { v: "renewal", label: "续报风险", icon: <TrendingUp size={13} /> },
            { v: "exports", label: "导出任务", icon: <FileDown size={13} /> },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => setActiveTab(t.v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === t.v
                  ? "bg-white text-deep-blue-700 shadow-sm"
                  : "text-deep-blue-500 hover:text-deep-blue-700",
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <TabsPrimitive.Content value="overview" className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={13} className="text-deep-blue-400" />
                <span className="text-xs text-deep-blue-400">新增线索</span>
              </div>
              <div className="text-2xl font-bold text-deep-blue-700 num">{formatNumber(kpis?.leads ?? 0)}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={13} className="text-deep-blue-400" />
                <span className="text-xs text-deep-blue-400">试听安排</span>
              </div>
              <div className="text-2xl font-bold text-deep-blue-700 num">{formatNumber(kpis?.trials ?? 0)}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Percent size={13} className="text-deep-blue-400" />
                <span className="text-xs text-deep-blue-400">试听出勤率</span>
              </div>
              <div className="text-2xl font-bold text-ink-gold-600 num">{kpis?.trialAttendance ?? 0}<span className="text-sm">%</span></div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={13} className="text-deep-blue-400" />
                <span className="text-xs text-deep-blue-400">转化率</span>
              </div>
              <div className="text-2xl font-bold text-success-green num">{kpis?.conversion ?? 0}<span className="text-sm">%</span></div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={13} className="text-deep-blue-400" />
                <span className="text-xs text-deep-blue-400">消耗课时</span>
              </div>
              <div className="text-2xl font-bold text-deep-blue-700 num">{formatNumber(kpis?.consumptionHours ?? 0)}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Star size={13} className="text-ink-gold-500" />
                <span className="text-xs text-deep-blue-400">平均满意度</span>
              </div>
              <div className="text-2xl font-bold text-ink-gold-600 num">{kpis?.avgSatisfaction ?? 0}<span className="text-sm">/10</span></div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="section-title flex items-center gap-2 text-base">
                <LineIcon size={16} className="text-ink-gold-500" />每日课时消耗趋势
              </h4>
              <span className="text-xs text-deep-blue-400">含上课班级数</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.dailyCons ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e8edf5", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600, color: "#1e3a5f" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="hours" name="消耗课时" fill="#c9a227" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="classes" name="上课班级数" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <h4 className="section-title flex items-center gap-2 text-base mb-4">
                <TrendingUp size={16} className="text-ink-gold-500" />转化漏斗
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.funnel ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12, fill: "#1e3a5f", fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e8edf5", fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: "#1e3a5f" }}
                    />
                    <Bar dataKey="value" name="数量" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h4 className="section-title flex items-center gap-2 text-base mb-4">
                <BarChart3 size={16} className="text-ink-gold-500" />各专业对比
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.byMajor ?? []).map((m: any) => ({ ...m, major: MajorMap[m.major] ?? m.major }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                    <XAxis dataKey="major" tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7a8f" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e8edf5", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="leads" name="线索数" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="consumptionHours" name="消耗课时" fill="#c9a227" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsPrimitive.Content>
      )}

      {activeTab === "renewal" && <RenewalTable />}

      {activeTab === "exports" && <ExportTasksTab />}
    </div>
  );
}

type ET = {
  id: string;
  fileName: string;
  module: string;
  operatorName: string;
  operatorRole: string;
  format: string;
  status: "PROCESSING" | "DONE" | "FAILED";
  createdAt: Date;
  doneAt?: Date;
};

function ExportTasksTab() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const reDownload = trpc.reports.reDownload.useMutation({
    onSuccess: () => utils.reports.exportTaskList.invalidate(),
  });
  const { data } = trpc.reports.exportTaskList.useQuery({ page, pageSize: 10 });
  const items: ET[] = (data?.items ?? []) as ET[];

  return (
    <div className="space-y-4">
      <DataTable<ET>
        columns={[
          { key: "fileName", header: "文件名", render: (r) => (
            <div className="flex items-center gap-2">
              <FileDown size={14} className="text-deep-blue-400" />
              <span className="text-sm text-deep-blue-700">{r.fileName}</span>
            </div>
          )},
          { key: "module", header: "模块", width: "100px", render: (r) => (
            <StatusChip variant="default" size="sm">{r.module}</StatusChip>
          )},
          { key: "operatorName", header: "操作人", width: "100px", render: (r) => (
            <div>
              <div className="text-sm text-deep-blue-700">{r.operatorName}</div>
              <div className="text-[11px] text-deep-blue-400">{r.operatorRole}</div>
            </div>
          )},
          { key: "format", header: "格式", width: "80px" },
          { key: "status", header: "状态", width: "100px", render: (r) => (
            <StatusChip variant={r.status === "DONE" ? "success" : r.status === "PROCESSING" ? "warn" : "danger"} size="sm">
              {r.status === "DONE" ? "完成" : r.status === "PROCESSING" ? "处理中" : "失败"}
            </StatusChip>
          )},
          { key: "createdAt", header: "创建时间", width: "160px", render: (r) => formatDateTime(r.createdAt) },
          { key: "doneAt", header: "完成时间", width: "160px", render: (r) => r.doneAt ? formatDateTime(r.doneAt) : "-" },
          { key: "actions", header: "操作", width: "100px", align: "right", render: (r) => (
            r.status === "DONE" ? (
              <button
                onClick={() => reDownload.mutate(r.id)}
                className="text-xs text-ink-gold-600 hover:text-ink-gold-700 underline underline-offset-2"
              >
                重新下载
              </button>
            ) : null
          )},
        ]}
        data={items}
        rowKey={(r) => r.id}
      />
      {data && <Pagination page={page} pageSize={10} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
