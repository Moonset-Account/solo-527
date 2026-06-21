"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  CalendarDays,
  FileText,
  Pill,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { getMedicalRecordById } from "@/lib/services";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn, formatCurrency, formatPercent, formatScore } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const tabs = [
  { id: "complaint", label: "主诉记录", icon: FileText },
  { id: "diagnosis", label: "诊断处方", icon: Stethoscope },
  { id: "followup", label: "复诊计划", icon: CalendarDays },
  { id: "charge", label: "收费项目", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

import { useState } from "react";

export default function MedicalRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("complaint");

  const { data: record, isLoading } = useQuery({
    queryKey: ["medical-record", params.id],
    queryFn: () => getMedicalRecordById(params.id),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-10 w-64" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="skeleton h-80" />
          <div className="skeleton h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-xl border border-gold-200/50 bg-white p-12 text-center">
        <p className="text-ink-600">未找到该病历记录</p>
        <button
          onClick={() => router.push("/medical-records")}
          className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          返回病历列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push("/medical-records")}
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回病历列表
      </button>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 border-b border-gold-100/60 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-xl font-semibold text-white">
              {record.patient?.name?.charAt(0)}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {record.patient?.name}
              </h2>
              <p className="text-xs text-ink-600">
                {record.patient?.gender} ·{" "}
                {record.patient?.birth_date
                  ? `${Math.floor(
                      (Date.now() - new Date(record.patient.birth_date).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )}岁`
                  : "--"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 text-teal-600" />
              <div>
                <p className="text-[11px] text-ink-600">病历号</p>
                <p className="font-mono font-medium text-ink-900">
                  {record.patient?.patient_no}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 text-teal-600" />
              <div>
                <p className="text-[11px] text-ink-600">联系电话</p>
                <p className="font-mono font-medium text-ink-900">
                  {record.patient?.phone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 text-teal-600" />
              <div>
                <p className="text-[11px] text-ink-600">就诊日期</p>
                <p className="font-medium text-ink-900">
                  {format(new Date(record.visit_date), "yyyy年MM月dd日 EEEE", {
                    locale: zhCN,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Stethoscope className="mt-0.5 h-4 w-4 text-teal-600" />
              <div>
                <p className="text-[11px] text-ink-600">就诊科室 / 医生</p>
                <p className="font-medium text-ink-900">
                  {record.department} · {record.doctor?.full_name}
                </p>
              </div>
            </div>
          </div>

          <div className="divider-gold my-4" />

          <div className="rounded-lg bg-gradient-to-br from-cream-100 to-cream-50 p-4 ring-1 ring-gold-200/50">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-ink-600">本次诊疗费用</span>
              <StatusBadge
                variant={(record.status as "active" | "exception") || "active"}
              />
            </div>
            <p className="mt-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums">
              {formatCurrency(record.total_fee)}
            </p>
            <p className="mt-1 text-[11px] text-ink-600">
              共 {record.charge_items?.length || 0} 项收费
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-hover rounded-xl border border-gold-200/50 bg-white shadow-card">
            <div className="flex border-b border-gold-100/60 px-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-teal-600 text-teal-700"
                        : "border-transparent text-ink-600 hover:text-ink-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === "complaint" && (
                <div className="space-y-4" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <span className="h-4 w-1 rounded-full bg-teal-600" />
                      主诉
                    </h4>
                    <div className="rounded-lg border-l-4 border-teal-500/50 bg-cream-50 p-4">
                      <p className="leading-relaxed text-ink-800">
                        {record.chief_complaint}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <span className="h-4 w-1 rounded-full bg-ochre-500" />
                      就诊摘要
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                        <p className="text-[11px] text-ink-600">就诊科室</p>
                        <p className="mt-0.5 text-sm font-medium text-ink-900">
                          {record.department}
                        </p>
                      </div>
                      <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                        <p className="text-[11px] text-ink-600">主治医生</p>
                        <p className="mt-0.5 text-sm font-medium text-ink-900">
                          {record.doctor?.full_name}
                        </p>
                      </div>
                      <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                        <p className="text-[11px] text-ink-600">就诊时间</p>
                        <p className="mt-0.5 text-sm font-medium text-ink-900">
                          {format(new Date(record.visit_date), "yyyy-MM-dd", {
                            locale: zhCN,
                          })}
                        </p>
                      </div>
                      <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                        <p className="text-[11px] text-ink-600">病历状态</p>
                        <p className="mt-0.5">
                          <StatusBadge
                            variant={
                              (record.status as "active" | "exception") || "active"
                            }
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "diagnosis" && (
                <div className="space-y-4" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <span className="h-4 w-1 rounded-full bg-teal-600" />
                      中医诊断
                    </h4>
                    <div className="rounded-lg border-l-4 border-teal-500/50 bg-cream-50 p-4">
                      <p className="leading-relaxed text-ink-800">
                        {record.diagnosis || "暂无诊断信息"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
                      <Pill className="h-4 w-4 text-ochre-600" />
                      处方用药
                    </h4>
                    <div className="rounded-lg border border-gold-200/50 bg-gradient-to-br from-ochre-50/50 to-white p-4">
                      <p className="whitespace-pre-wrap leading-relaxed text-ink-800">
                        {record.prescription || "暂无处方信息"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "followup" && (
                <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  {record.follow_up_plans?.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ink-600">
                      暂未安排复诊计划
                    </p>
                  ) : (
                    <div className="relative space-y-4 pl-6">
                      <div className="absolute bottom-0 left-[7px] top-2 w-px bg-gradient-to-b from-teal-400 via-gold-300 to-transparent" />
                      {record.follow_up_plans?.map((plan) => (
                        <div key={plan.id} className="relative">
                          <div className="absolute -left-6 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-teal-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                          </div>
                          <div className="rounded-lg border border-gold-200/50 bg-white p-4 transition-colors hover:bg-cream-50">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-ink-900">
                                  {plan.follow_up_type}随访 ·{" "}
                                  {format(
                                    new Date(plan.planned_follow_up_date),
                                    "yyyy年MM月dd日",
                                    { locale: zhCN }
                                  )}
                                </p>
                                {plan.notes && (
                                  <p className="mt-1 text-sm text-ink-700">
                                    {plan.notes}
                                  </p>
                                )}
                              </div>
                              <StatusBadge
                                variant={
                                  (plan.status as
                                    | "pending"
                                    | "completed"
                                    | "cancelled") || "pending"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "charge" && (
                <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  <div className="overflow-hidden rounded-lg border border-gold-200/50">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-cream-100">
                        <tr>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-700">
                            项目名称
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-700">
                            类别
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                            数量
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                            单价
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                            小计
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-100/60">
                        {record.charge_items?.map((item) => (
                          <tr key={item.id} className="hover:bg-cream-50/60">
                            <td className="px-4 py-3 font-medium text-ink-900">
                              {item.item_name}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700 ring-1 ring-teal-200">
                                {item.item_category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-800">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-800">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gradient-to-r from-cream-100 to-cream-50">
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-right text-sm font-semibold text-ink-700"
                          >
                            合计金额
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xl font-bold tabular-nums text-teal-700">
                            {formatCurrency(record.total_fee)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
