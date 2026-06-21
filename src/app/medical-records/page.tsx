"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Filter, ChevronRight, ChevronDown } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { getMedicalRecords } from "@/lib/services";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

export default function MedicalRecordsPage() {
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ["medical-records", keyword, department],
    queryFn: () => getMedicalRecords({ keyword, department }),
  });

  const deptOptions = useMemo(() => {
    const set = new Set(records?.map((r) => r.department) || []);
    return Array.from(set);
  }, [records]);

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
            高级筛选
          </Button>
        </div>
      </div>

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
          <div className="mt-4 grid gap-3 border-t border-gold-100/60 pt-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">
                就诊日期（起）
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">
                就诊日期（止）
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">
                接诊医生
              </label>
              <select className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm">
                <option value="">全部医生</option>
                <option>陈大夫</option>
                <option>刘大夫</option>
                <option>王大夫</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">
                病历状态
              </label>
              <select className="w-full rounded-lg border border-gold-200/60 bg-cream-50 px-3 py-2 text-sm">
                <option value="">全部状态</option>
                <option value="active">正常</option>
                <option value="exception">异常</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        )}
      </div>

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
                records?.map((r) => (
                  <>
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-teal-50/40"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpanded(expanded === r.id ? null : r.id)
                          }
                          className="text-ink-600"
                        >
                          {expanded === r.id ? (
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
                    {expanded === r.id && (
                      <tr className="bg-cream-50/60">
                        <td></td>
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
                                诊断
                              </p>
                              <p className="text-sm text-ink-800">
                                {r.diagnosis || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
                                复诊计划
                              </p>
                              <p className="text-sm text-ink-800">
                                {r.follow_up_plans?.length
                                  ? `${r.follow_up_plans.length} 项计划，最近：${r.follow_up_plans[0].planned_follow_up_date}`
                                  : "暂未安排"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-600">
                                收费项目
                              </p>
                              <p className="text-sm text-ink-800">
                                {r.charge_items?.length || 0} 项
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
