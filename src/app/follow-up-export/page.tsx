"use client";

import { useQuery, useState } from "react";
import { Download, FileSpreadsheet, Filter, CheckCircle2, Star } from "lucide-react";
import * as XLSX from "xlsx";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { getFollowUpTasks, getUsers } from "@/lib/services";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn, formatScore } from "@/lib/utils";

const METHOD_OPTIONS = ["电话", "微信", "到店", "短信"];

export default function FollowUpExportPage() {
  const [minScore, setMinScore] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [method, setMethod] = useState("");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [onlyCompleted, setOnlyCompleted] = useState(true);

  const { data: users } = useQuery({ queryKey: ["users-export"], queryFn: () => getUsers() });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["followup-export", minScore, maxScore, method, assignee, startDate, endDate, onlyCompleted],
    queryFn: () =>
      getFollowUpTasks({
        status: onlyCompleted ? ["completed"] : undefined,
        method: method || undefined,
        assignee: assignee || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minScore: minScore === "" ? undefined : Number(minScore),
        maxScore: maxScore === "" ? undefined : Number(maxScore),
      }),
  });

  const avgScore = tasks && tasks.length > 0
    ? (tasks.reduce((s, t) => s + (t.quality_score ?? 0), 0) / tasks.length).toFixed(1)
    : "0";

  const highQuality = tasks?.filter((t) => (t.quality_score ?? 0) >= 80).length ?? 0;

  const handleExport = (type: "excel" | "csv") => {
    if (!tasks || tasks.length === 0) return;
    const rows = tasks.map((t) => ({
      患者姓名: t.patient?.name ?? "",
      联系电话: t.patient?.phone ?? "",
      病历号: t.patient?.patient_no ?? "",
      计划日期: t.planned_date,
      实际完成: t.actual_date ?? "",
      负责人员: t.assignee?.full_name ?? "",
      随访方式: t.follow_up_method ?? "",
      质量评分: t.quality_score ?? "",
      状态: {
        pending: "待随访",
        in_progress: "进行中",
        completed: "已完成",
        overdue: "已逾期",
        cancelled: "已取消",
      }[t.status] ?? "",
      随访备注: t.result_notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "随访质量明细");
    const filename = `随访质量导出_${format(new Date(), "yyyyMMdd_HHmmss")}.${type === "excel" ? "xlsx" : "csv"}`;
    if (type === "excel") {
      XLSX.writeFile(wb, filename);
    } else {
      XLSX.writeFile(wb, filename, { bookType: "csv" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            随访质量导出
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            按随访质量、方式、人员等维度筛选并导出明细数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => handleExport("csv")}
            disabled={!tasks || tasks.length === 0}
          >
            导出 CSV
          </Button>
          <Button
            variant="primary"
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => handleExport("excel")}
            disabled={!tasks || tasks.length === 0}
          >
            导出 Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">
            筛选结果
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900 tabular-nums">
            {tasks?.length ?? 0}
            <span className="ml-1 text-sm font-normal text-ink-600">条</span>
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">
            平均质量评分
          </p>
          <p className="mt-1 flex items-baseline gap-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums">
            {avgScore}
            <span className="text-sm font-normal text-ink-600">分</span>
            <Star className="h-4 w-4 text-gold-500" fill="currentColor" />
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">
            高质量随访
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ochre-600 tabular-nums">
            {highQuality}
            <span className="ml-1 text-sm font-normal text-ink-600">条</span>
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">
            高质量占比
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-gold-700 tabular-nums">
            {tasks && tasks.length > 0 ? ((highQuality / tasks.length) * 100).toFixed(1) : 0}
            <span className="text-sm font-normal text-ink-600">%</span>
          </p>
        </div>
      </div>

      <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-teal-600" />
          <h3 className="font-display text-base font-semibold text-ink-900">
            筛选条件
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              完成日期（起）
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              完成日期（止）
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              负责人员
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            >
              <option value="">全部人员</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              随访方式
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            >
              <option value="">全部方式</option>
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              最低评分
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) =>
                setMinScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="0 - 100"
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-700">
              最高评分
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={maxScore}
              onChange={(e) =>
                setMaxScore(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="0 - 100"
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="lg:col-span-2 flex items-end">
            <label className="inline-flex items-center gap-2 rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={onlyCompleted}
                onChange={(e) => setOnlyCompleted(e.target.checked)}
                className="h-4 w-4 rounded border-gold-300 text-teal-600 focus:ring-teal-500/30"
              />
              仅显示已完成的随访
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gold-200/50 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-cream-200/70 to-cream-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">患者</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">计划/完成日期</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">负责人</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">方式</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">质量评分</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">状态</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">随访备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-100/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-6">
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : tasks?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-600">
                    暂无匹配的随访数据，请调整筛选条件
                  </td>
                </tr>
              ) : (
                tasks?.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-teal-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">{t.patient?.name}</div>
                      <div className="text-[11px] text-ink-600">{t.patient?.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink-800">
                      计划：{format(new Date(t.planned_date), "yyyy-MM-dd")}
                      {t.actual_date && (
                        <><br />完成：{format(new Date(t.actual_date), "yyyy-MM-dd")}</>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-800">{t.assignee?.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs text-ink-700 ring-1 ring-gold-200/60">
                        {t.follow_up_method || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums">
                      <span className={cn(
                        "flex items-center gap-1 font-semibold",
                        (t.quality_score ?? 0) >= 80 && "text-teal-700",
                        (t.quality_score ?? 0) >= 60 && (t.quality_score ?? 0) < 80 && "text-gold-700",
                        (t.quality_score ?? 0) < 60 && t.quality_score !== null && "text-red-600"
                      )}>
                        {(t.quality_score ?? 0) >= 80 && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {formatScore(t.quality_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={(t.status as "pending" | "inProgress" | "completed" | "overdue") || "pending"} />
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="line-clamp-2 text-xs text-ink-700">
                        {t.result_notes || "—"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
