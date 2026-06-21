"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  Filter,
  Save,
  Trash2,
  Bookmark,
  X,
  Download,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import {
  getFollowUpTasks,
  getFilterRules,
  saveFilterRule,
  deleteFilterRule,
  getUsers,
  type TasksFilter,
} from "@/lib/services";
import { cn, formatScore } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "pending", label: "待随访" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "overdue", label: "已逾期" },
  { value: "cancelled", label: "已取消" },
];

const METHOD_OPTIONS = ["电话", "微信", "到店", "短信"];

export default function FollowUpTasksPage() {
  const [keyword, setKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveRule, setShowSaveRule] = useState(false);
  const [ruleName, setRuleName] = useState("");

  const [filter, setFilter] = useState<TasksFilter>({
    status: [],
    assignee: "",
    startDate: "",
    endDate: "",
    method: "",
  });

  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["followup-tasks", filter, keyword],
    queryFn: () =>
      getFollowUpTasks({ ...filter, patientKeyword: keyword || undefined }),
  });

  const { data: rules } = useQuery({
    queryKey: ["filter-rules", "follow_up_tasks"],
    queryFn: () => getFilterRules("follow_up_tasks"),
  });

  const { data: users } = useQuery({
    queryKey: ["users-followup"],
    queryFn: () => getUsers(),
  });

  const saveRuleMutation = useMutation({
    mutationFn: () =>
      saveFilterRule({
        user_id: "u-001",
        name: ruleName,
        module: "follow_up_tasks",
        filter_conditions: { ...filter, keyword },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filter-rules"] });
      setShowSaveRule(false);
      setRuleName("");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteFilterRule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["filter-rules"] }),
  });

  const toggleStatus = (val: string) => {
    const current = filter.status || [];
    setFilter({
      ...filter,
      status: current.includes(val)
        ? current.filter((s) => s !== val)
        : [...current, val],
    });
  };

  const applyRule = (conditions: Record<string, unknown>) => {
    setFilter({
      status: (conditions.status as string[]) || [],
      assignee: (conditions.assignee as string) || "",
      startDate: (conditions.startDate as string) || "",
      endDate: (conditions.endDate as string) || "",
      method: (conditions.method as string) || "",
    });
    if (conditions.keyword) setKeyword(conditions.keyword as string);
  };

  const resetFilter = () => {
    setFilter({ status: [], assignee: "", startDate: "", endDate: "", method: "" });
    setKeyword("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            随访任务管理
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            多条件筛选、规则保存与批量随访任务管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
            导出当前
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-3.5 w-3.5" />}
          >
            {showFilters ? "收起筛选" : "高级筛选"}
          </Button>
        </div>
      </div>

      {rules && rules.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-600">
            <Bookmark className="mr-1 inline h-3.5 w-3.5 text-gold-600" />
            保存的规则：
          </span>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="group inline-flex items-center gap-1 rounded-full border border-gold-200/60 bg-white px-3 py-1 text-xs shadow-sm"
            >
              <button
                onClick={() => applyRule(rule.filter_conditions as Record<string, unknown>)}
                className="font-medium text-teal-700 hover:text-teal-800"
              >
                {rule.name}
              </button>
              <button
                onClick={() => deleteRuleMutation.mutate(rule.id)}
                className="text-ink-600 opacity-40 transition-opacity hover:text-red-600 hover:opacity-100"
                title="删除规则"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showFilters && (
        <div
          className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card"
          style={{ animation: "fadeInUp 0.3s ease-out" }}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-700">
                关键词搜索（患者姓名/电话）
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="输入患者姓名或手机号"
                  className="w-full rounded-lg border border-gold-200/60 bg-cream-50 py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">
                计划开始日期
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) =>
                  setFilter({ ...filter, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">
                计划结束日期
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) =>
                  setFilter({ ...filter, endDate: e.target.value })
                }
                className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-700">
                任务状态
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = (filter.status || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        active
                          ? "border-teal-500 bg-teal-500 text-white shadow-sm"
                          : "border-gold-200/60 bg-cream-50 text-ink-700 hover:bg-cream-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-700">
                负责人员
              </label>
              <select
                value={filter.assignee}
                onChange={(e) =>
                  setFilter({ ...filter, assignee: e.target.value })
                }
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
                value={filter.method}
                onChange={(e) =>
                  setFilter({ ...filter, method: e.target.value })
                }
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
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gold-100/60 pt-4">
            <Button variant="ghost" size="sm" onClick={resetFilter}>
              重置筛选
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
              onClick={() => setShowSaveRule(true)}
            >
              保存筛选规则
            </Button>
          </div>

          {showSaveRule && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg border border-gold-300/60 bg-gold-50/50 p-3"
              style={{ animation: "fadeInUp 0.2s ease-out" }}
            >
              <Bookmark className="h-4 w-4 text-gold-700" />
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="输入规则名称，如：本月逾期任务"
                className="flex-1 rounded-md border border-gold-300/60 bg-white px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => saveRuleMutation.mutate()}
                disabled={!ruleName.trim()}
              >
                保存
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSaveRule(false)}
              >
                取消
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gold-200/50 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-cream-200/70 to-cream-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  患者
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  计划日期
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  负责人
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  随访方式
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  质量评分
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  状态
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  随访备注
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-100/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-6">
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : tasks?.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-ink-600"
                  >
                    暂无匹配的随访任务
                  </td>
                </tr>
              ) : (
                tasks?.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-teal-50/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink-900">
                        {t.patient?.name}
                      </div>
                      <div className="text-[11px] text-ink-600">
                        {t.patient?.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm tabular-nums text-ink-900">
                        {format(new Date(t.planned_date), "yyyy-MM-dd", {
                          locale: zhCN,
                        })}
                      </div>
                      {t.actual_date && (
                        <div className="text-[11px] text-teal-700">
                          实际：
                          {format(new Date(t.actual_date), "MM-dd", {
                            locale: zhCN,
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-800">
                      {t.assignee?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.follow_up_method ? (
                        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs text-ink-700 ring-1 ring-gold-200/60">
                          {t.follow_up_method}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums">
                      <span
                        className={cn(
                          "font-semibold",
                          (t.quality_score ?? 0) >= 80 && "text-teal-700",
                          (t.quality_score ?? 0) >= 60 &&
                            (t.quality_score ?? 0) < 80 &&
                            "text-gold-700",
                          (t.quality_score ?? 0) < 60 &&
                            t.quality_score !== null &&
                            "text-red-600"
                        )}
                      >
                        {formatScore(t.quality_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          (t.status as
                            | "pending"
                            | "inProgress"
                            | "completed"
                            | "overdue"
                            | "cancelled") || "pending"
                        }
                      />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-1 text-xs text-ink-700">
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
