"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Bookmark,
  X,
  Save,
  RotateCcw,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import {
  getMedicalRecords,
  getUsers,
  getFilterRules,
  saveFilterRule,
  deleteFilterRule,
} from "@/lib/services";
import type { RecordsFilter } from "@/lib/services";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

export default function MedicalRecordsPage() {
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveRule, setShowSaveRule] = useState(false);
  const [ruleName, setRuleName] = useState("");

  const queryClient = useQueryClient();

  const filter: RecordsFilter = useMemo(
    () => ({
      keyword: keyword || undefined,
      department: department || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      doctorId: doctorId || undefined,
      status: status || undefined,
    }),
    [keyword, department, startDate, endDate, doctorId, status]
  );

  const { data: records, isLoading } = useQuery({
    queryKey: ["medical-records", filter],
    queryFn: () => getMedicalRecords(filter),
  });

  const { data: users } = useQuery({
    queryKey: ["users-medical-records"],
    queryFn: () => getUsers(),
  });

  const { data: rules } = useQuery({
    queryKey: ["filter-rules", "medical_records"],
    queryFn: () => getFilterRules("medical_records"),
  });

  const doctorOptions = useMemo(() => {
    return (users || []).filter((u) => u.id.startsWith("doc-"));
  }, [users]);

  const deptOptions = useMemo(() => {
    return ["内科", "针灸科", "推拿科"];
  }, []);

  const hasActiveFilters = startDate || endDate || doctorId || status;

  const saveRuleMutation = useMutation({
    mutationFn: () =>
      saveFilterRule({
        user_id: "u-001",
        name: ruleName,
        module: "medical_records",
        filter_conditions: { ...filter },
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

  const applyRule = (conditions: Record<string, unknown>) => {
    setKeyword((conditions.keyword as string) || "");
    setDepartment((conditions.department as string) || "");
    setStartDate((conditions.startDate as string) || "");
    setEndDate((conditions.endDate as string) || "");
    setDoctorId((conditions.doctorId as string) || "");
    setStatus((conditions.status as string) || "");
    setShowFilters(true);
  };

  const resetFilter = () => {
    setKeyword("");
    setDepartment("");
    setStartDate("");
    setEndDate("");
    setDoctorId("");
    setStatus("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            病历管理
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            查看主诉记录、复诊计划与收费项目明细
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
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

      <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索患者姓名、病历号、主诉关键词..."
              className="w-full rounded-lg border border-gold-200/60 bg-cream-50 py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2.5 text-sm text-ink-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">全部科室</option>
            {deptOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        {showFilters && (
          <div className="mt-4 border-t border-gold-100/60 pt-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">
                  就诊日期（起）
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">
                  就诊日期（止）
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">
                  接诊医生
                </label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
                >
                  <option value="">全部医生</option>
                  {doctorOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-700">
                  病历状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="active">正常</option>
                  <option value="exception">异常</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilter}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                重置
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveRule(true)}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                >
                  保存为规则
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {showSaveRule && (
        <div className="card-hover flex items-center gap-3 rounded-xl border border-gold-200/50 bg-white p-4 shadow-card">
          <Bookmark className="h-4 w-4 text-gold-600" />
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="输入规则名称，如：本月内科病历"
            className="flex-1 rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => saveRuleMutation.mutate()}
            disabled={!ruleName.trim()}
          >
            保存
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSaveRule(false);
              setRuleName("");
            }}
          >
            取消
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gold-200/50 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-cream-200/70 to-cream-100">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  就诊日期
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  患者信息
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  科室/医生
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  主诉
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  金额
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                  状态
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-100/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-6">
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : records?.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-ink-600"
                  >
                    暂无匹配的病历记录
                  </td>
                </tr>
              ) : (
                records?.map((r) => {
                  const isExpanded = expanded === r.id;
                  return (
                    <tr key={r.id}>
                      <td className="w-10 px-4 py-3">
                        <button
                          onClick={() =>
                            setExpanded(isExpanded ? null : r.id)
                          }
                          className="text-ink-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-medium text-ink-900 tabular-nums">
                          {format(new Date(r.visit_date), "yyyy-MM-dd", {
                            locale: zhCN,
                          })}
                        </div>
                        <div className="text-[11px] text-ink-600">
                          {format(new Date(r.visit_date), "EEEE", {
                            locale: zhCN,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">
                          {r.patient?.name}
                        </div>
                        <div className="text-[11px] text-ink-600">
                          {r.patient?.patient_no} · {r.patient?.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-ink-900">{r.department}</div>
                        <div className="text-[11px] text-ink-600">
                          {r.doctor?.full_name}
                        </div>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p
                          className={cn(
                            "line-clamp-2 text-sm leading-relaxed text-ink-800"
                          )}
                          title={r.chief_complaint}
                        >
                          {r.chief_complaint}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums text-ink-900">
                        {formatCurrency(r.total_fee)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          variant={
                            (r.status as "active" | "archived" | "exception") ||
                            "active"
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/medical-records/${r.id}`}
                          className="text-xs font-medium text-teal-600 hover:text-teal-700"
                        >
                          查看详情 →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {expanded && records && (() => {
        const r = records.find((rec) => rec.id === expanded);
        if (!r) return null;
        const plans = r.follow_up_plans || [];
        const charges = r.charge_items || [];
        return (
          <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink-900">
                {r.patient?.name} — 病历明细
              </h3>
              <button
                onClick={() => setExpanded(null)}
                className="text-ink-600 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divider-gold mb-4" />

            <div className="mb-4">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
                诊断
              </p>
              <p className="text-sm text-ink-800">{r.diagnosis || "—"}</p>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
                处方
              </p>
              <p className="text-sm leading-relaxed text-ink-800">
                {r.prescription || "—"}
              </p>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-600">
                  复诊计划（{plans.length} 项）
                </p>
              </div>
              {plans.length > 0 ? (
                <div className="space-y-2">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border border-teal-100/60 bg-teal-50/30 px-3 py-2"
                    >
                      <StatusBadge
                        variant={
                          p.status === "completed"
                            ? "completed"
                            : p.status === "cancelled"
                            ? "cancelled"
                            : "pending"
                        }
                        dot
                      />
                      <span className="font-mono text-xs tabular-nums text-ink-800">
                        {format(new Date(p.planned_follow_up_date), "yyyy-MM-dd", { locale: zhCN })}
                      </span>
                      <span className="text-xs text-ink-600">
                        {p.follow_up_type}
                      </span>
                      {p.notes && (
                        <span className="flex-1 text-xs text-ink-700">
                          {p.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-600">暂未安排复诊计划</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-600">
                  收费项目（{charges.length} 项）
                </p>
                {charges.length > 0 && (
                  <span className="font-mono text-xs font-medium tabular-nums text-ink-800">
                    合计 {formatCurrency(r.total_fee)}
                  </span>
                )}
              </div>
              {charges.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gold-100/60">
                      <th className="pb-2 text-xs font-medium text-ink-600">项目</th>
                      <th className="pb-2 text-xs font-medium text-ink-600">类别</th>
                      <th className="pb-2 text-right text-xs font-medium text-ink-600">数量</th>
                      <th className="pb-2 text-right text-xs font-medium text-ink-600">单价</th>
                      <th className="pb-2 text-right text-xs font-medium text-ink-600">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c) => (
                      <tr key={c.id} className="border-b border-gold-50/60">
                        <td className="py-2 text-ink-800">{c.item_name}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-700 ring-1 ring-inset ring-ink-200">
                            {c.item_category}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-ink-800">
                          {c.quantity}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-ink-800">
                          {formatCurrency(c.unit_price)}
                        </td>
                        <td className="py-2 text-right font-mono font-medium tabular-nums text-ink-900">
                          {formatCurrency(c.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-ink-600">暂无收费项目</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
