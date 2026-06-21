"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { StatusChip } from "@/components/ui/StatusChip";
import { AlertTriangle, TrendingDown, Phone, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function RenewalTable() {
  const [riskLevel, setRiskLevel] = useState<"ALL" | "HIGH" | "MID">("ALL");
  const [page, setPage] = useState(1);
  const { data } = trpc.reports.renewalReport.useQuery({ riskLevel });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  type RItem = {
    id: string;
    name: string;
    remainingHours: number;
    totalHours: number;
    level: "HIGH" | "MID";
    classes: string[];
    lastFeedbackScore?: number;
    daysLeft: number;
    reasons: string[];
    suggestions: string[];
  };

  const allItems: RItem[] = (data?.list ?? []) as RItem[];
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const pagedItems = allItems.slice(start, start + pageSize);

  const tabs = [
    { v: "ALL" as const, label: "全部", icon: <AlertTriangle size={13} /> },
    { v: "HIGH" as const, label: "高风险", danger: true },
    { v: "MID" as const, label: "中风险" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-deep-blue-50/60 rounded-lg">
            {tabs.map((t, idx) => {
              const isDanger = "danger" in t && t.danger;
              return (
                <button
                  key={t.v}
                  onClick={() => { setRiskLevel(t.v); setPage(1); }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    riskLevel === t.v
                      ? isDanger
                        ? "bg-alert-red text-white shadow-sm"
                        : "bg-white text-deep-blue-700 shadow-sm"
                      : "text-deep-blue-500 hover:text-deep-blue-700",
                  )}
                >
                  {"icon" in t ? t.icon : <TrendingDown size={13} />}
                  {t.label}
                  <span className={cn(
                    "chip !px-1.5 !py-0 text-[10px]",
                    riskLevel === t.v ? "bg-white/20 text-white" : "bg-white text-deep-blue-600",
                  )}>
                    {t.v === "ALL" ? data?.stats.total : t.v === "HIGH" ? data?.stats.high : data?.stats.mid}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-deep-blue-400">
            阈值：高风险 ≤ {data?.rules.high}节，中风险 ≤ {data?.rules.mid}节
          </div>
        </div>
      </div>

      <DataTable<RItem>
        columns={[
          { key: "expand", header: "", width: "40px", render: (r) => (
            <button
              onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === r.id ? null : r.id); }}
              className="w-6 h-6 flex items-center justify-center text-deep-blue-400 hover:text-deep-blue-600"
            >
              <ChevronRight size={14} className={cn("transition-transform", expandedId === r.id && "rotate-90")} />
            </button>
          )},
          { key: "name", header: "学生", width: "140px", render: (r) => (
            <div>
              <div className="text-sm font-medium text-deep-blue-700">{r.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {r.classes.map((c) => (
                  <span key={c} className="chip bg-deep-blue-50 text-deep-blue-600 text-[10px]">{c}</span>
                ))}
              </div>
            </div>
          )},
          { key: "level", header: "风险等级", width: "100px", render: (r) => (
            <StatusChip variant={r.level === "HIGH" ? "danger" : "warn"} pulse={r.level === "HIGH"}>
              {r.level === "HIGH" ? "高风险" : "中风险"}
            </StatusChip>
          )},
          { key: "remainingHours", header: "剩余课时", width: "110px", render: (r) => {
            const pct = (r.remainingHours / r.totalHours) * 100;
            return (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-deep-blue-700 num">{r.remainingHours}</span>
                  <span className="text-xs text-deep-blue-400">/ {r.totalHours} 节</span>
                </div>
                <div className="h-1.5 w-full bg-deep-blue-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      r.level === "HIGH" ? "bg-alert-red" : "bg-warn-orange"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }},
          { key: "daysLeft", header: "预计剩余", width: "100px", render: (r) => (
            <div className="text-sm">
              <span className={cn("num font-semibold", r.daysLeft <= 7 ? "text-alert-red" : r.daysLeft <= 14 ? "text-warn-orange" : "text-deep-blue-700")}>
                {r.daysLeft}
              </span>
              <span className="text-xs text-deep-blue-400 ml-1">天</span>
            </div>
          )},
          { key: "lastFeedbackScore", header: "最近作品评分", width: "120px", render: (r) => r.lastFeedbackScore ? (
            <div className="flex items-center gap-1">
              <Star size={13} className="text-ink-gold-500 fill-ink-gold-500" />
              <span className="text-sm text-deep-blue-700 num">{r.lastFeedbackScore.toFixed(1)}</span>
            </div>
          ) : <span className="text-xs text-deep-blue-400">无</span>},
          { key: "actions", header: "操作", width: "110px", align: "right", render: () => (
            <button className="btn-gold !px-3 !py-1 text-xs">
              <Phone size={13} /> 联系
            </button>
          )},
        ]}
        data={pagedItems}
        rowKey={(r) => r.id}
        onClickRow={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
      />
      <Pagination page={page} pageSize={pageSize} total={allItems.length} onPageChange={setPage} />

      <div className="space-y-2">
        {pagedItems.map((r) => expandedId === r.id && (
          <div key={`exp-${r.id}`} className="card !rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-deep-blue-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-alert-red" />风险原因
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.reasons.map((reason) => (
                  <span key={reason} className="chip bg-red-50 text-alert-red border-red-100 text-[11px]">{reason}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-deep-blue-600 mb-2 flex items-center gap-1.5">
                <Phone size={13} className="text-ink-gold-600" />跟进建议
              </div>
              <ul className="space-y-1">
                {r.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-deep-blue-600 flex items-start gap-2">
                    <span className="text-ink-gold-500 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
