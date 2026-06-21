"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare, Send } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { getPermissionExceptions, handlePermissionException } from "@/lib/services";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const severityConfig = {
  low: { label: "低", color: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  medium: { label: "中", color: "text-gold-700", bg: "bg-gold-50", ring: "ring-gold-200", dot: "bg-gold-500" },
  high: { label: "高", color: "text-ochre-700", bg: "bg-ochre-50", ring: "ring-ochre-200", dot: "bg-ochre-500" },
  critical: { label: "紧急", color: "text-red-700", bg: "bg-red-50", ring: "ring-red-300", dot: "bg-red-500" },
};

export default function PermissionExceptionsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState("");
  const [nextStatus, setNextStatus] = useState<"processing" | "resolved" | "closed">("processing");
  const queryClient = useQueryClient();

  const { data: exceptions, isLoading } = useQuery({
    queryKey: ["permission-exceptions"],
    queryFn: () => getPermissionExceptions(),
  });

  const selected = exceptions?.find((e) => e.id === selectedId) || null;

  const handleMutation = useMutation({
    mutationFn: () =>
      handlePermissionException(selectedId!, nextStatus, conclusion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-reports"] });
      setSelectedId(null);
      setConclusion("");
    },
  });

  const pendingCount = exceptions?.filter((e) => e.status === "pending").length ?? 0;
  const processingCount = exceptions?.filter((e) => e.status === "processing").length ?? 0;
  const resolvedCount = exceptions?.filter((e) => e.status === "resolved").length ?? 0;

  const submitHandle = () => {
    if (!selectedId || !conclusion.trim()) return;
    handleMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            病例权限异常处理
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            处理结论将自动同步至号源利用报表
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-hover rounded-xl border border-red-200/60 bg-gradient-to-br from-red-50 to-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-xs font-medium uppercase tracking-wider text-red-700">
              待处理
            </p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold text-red-700 tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gold-200/60 bg-gradient-to-br from-gold-50 to-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold-700" />
            <p className="text-xs font-medium uppercase tracking-wider text-gold-700">
              处理中
            </p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold text-gold-700 tabular-nums">
            {processingCount}
          </p>
        </div>
        <div className="card-hover rounded-xl border border-teal-200/60 bg-gradient-to-br from-teal-50 to-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            <p className="text-xs font-medium uppercase tracking-wider text-teal-700">
              已解决
            </p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold text-teal-700 tabular-nums">
            {resolvedCount}
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gold-200/50 bg-gradient-to-br from-cream-100 to-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-ink-600" />
            <p className="text-xs font-medium uppercase tracking-wider text-ink-700">
              历史累计
            </p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900 tabular-nums">
            {exceptions?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-gold-200/50 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-cream-200/70 to-cream-100">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">严重程度</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">异常类型</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">关联病历</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">创建时间</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">状态</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100/60">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-6">
                        <div className="skeleton h-8 w-full" />
                      </td>
                    </tr>
                  ))
                ) : (
                  exceptions?.map((e) => {
                    const sev = severityConfig[e.severity as keyof typeof severityConfig];
                    const isSelected = selectedId === e.id;
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected ? "bg-teal-50/60" : "hover:bg-cream-50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", sev.bg, sev.color, sev.ring)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
                            {sev.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-900">{e.exception_type}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-ink-800">{e.record?.patient?.name || "—"}</div>
                          <div className="text-[11px] text-ink-600">{e.record?.department}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink-700">
                          {format(new Date(e.created_at), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={(e.status as "pending" | "processing" | "resolved" | "closed")} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-xs font-medium text-teal-600 hover:text-teal-700">
                            处理 →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card-hover sticky top-24 rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
            {!selected ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream-100">
                  <MessageSquare className="h-6 w-6 text-ink-600" />
                </div>
                <p className="text-sm font-medium text-ink-800">选择左侧异常记录</p>
                <p className="mt-1 text-xs text-ink-600">查看详情并填写处理结论</p>
              </div>
            ) : (
              <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
                <div className="flex items-start justify-between border-b border-gold-100/60 pb-4">
                  <div>
                    <div className="mb-2">
                      <StatusBadge variant={(selected.status as "pending" | "processing" | "resolved" | "closed")} />
                      <span className="ml-2">
                        <StatusBadge variant={(selected.severity as "low" | "medium" | "high" | "critical")} />
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-ink-900">
                      {selected.exception_type}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-600">
                      创建于 {format(new Date(selected.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                    <p className="text-[11px] text-ink-600">关联患者</p>
                    <p className="text-sm font-medium text-ink-900">
                      {selected.record?.patient?.name || "—"} · {selected.record?.patient?.phone || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                      <p className="text-[11px] text-ink-600">科室</p>
                      <p className="text-sm font-medium text-ink-900">{selected.record?.department || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-cream-50 p-3 ring-1 ring-gold-100/80">
                      <p className="text-[11px] text-ink-600">就诊日期</p>
                      <p className="text-sm font-medium text-ink-900">{selected.record?.visit_date || "—"}</p>
                    </div>
                  </div>
                  {selected.handling_conclusion && (
                    <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50/50 p-3">
                      <p className="text-[11px] text-ink-600">
                        上次处理（{selected.handler?.full_name || "—"}）
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-800">
                        {selected.handling_conclusion}
                      </p>
                    </div>
                  )}
                </div>

                <div className="divider-gold my-4" />

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-700">
                    处理结论（同步至号源利用报表）
                  </label>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    rows={4}
                    placeholder="请填写处理结论..."
                    className="w-full resize-none rounded-lg border border-gold-200/60 bg-cream-50 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-ink-700">
                    下一步状态
                  </label>
                  <div className="flex gap-2">
                    {[
                      { v: "processing", l: "处理中" },
                      { v: "resolved", l: "已解决" },
                      { v: "closed", l: "关闭" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setNextStatus(opt.v as typeof nextStatus)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                          nextStatus === opt.v
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-gold-200/60 bg-cream-50 text-ink-700 hover:bg-cream-100"
                        )}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={submitHandle}
                  disabled={!conclusion.trim() || handleMutation.isPending}
                >
                  {handleMutation.isPending ? "提交中..." : "提交处理并同步报表"}
                </Button>
                <p className="mt-2 text-center text-[11px] text-ink-600">
                  解决或关闭后，结论将自动同步至号源利用报表
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
