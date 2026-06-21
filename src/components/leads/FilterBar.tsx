"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Download, Users } from "lucide-react";
import { StatusChip, leadStatusVariant } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";

type LeadStatusKey = "NEW" | "FOLLOWING" | "TRIAL_SCHEDULED" | "TRIAL_DONE" | "CONVERTED" | "LOST";

const statusLabels: Record<LeadStatusKey, string> = {
  NEW: "新线索",
  FOLLOWING: "跟进中",
  TRIAL_SCHEDULED: "待试听",
  TRIAL_DONE: "已试听",
  CONVERTED: "已转化",
  LOST: "已流失",
};

interface Assignee {
  id: string;
  name: string;
}

interface FilterBarProps {
  sources: string[];
  assignees: Assignee[];
  counts: Record<LeadStatusKey, number>;
  total: number;
}

export default function FilterBar({ sources, assignees, counts, total }: FilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  const currentStatus = params.get("status") || "ALL";
  const currentSource = params.get("source") || "";
  const currentAssignee = params.get("assigneeId") || "";
  const currentKeyword = params.get("keyword") || "";

  const updateQuery = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`/leads?${next.toString()}`);
  };

  const handleExport = () => {
    alert("导出任务已提交，请在导出中心下载");
  };

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateQuery("status", "")}
          className={cn(
            "chip border px-3 py-1.5 text-sm transition",
            currentStatus === "ALL" || !currentStatus
              ? "bg-deep-blue-600 text-white border-deep-blue-600"
              : "bg-white text-deep-blue-600 border-deep-blue-200 hover:bg-deep-blue-50"
          )}
        >
          全部 <span className="num ml-1">{total}</span>
        </button>
        {(Object.keys(counts) as LeadStatusKey[]).map((k) => (
          <button key={k} onClick={() => updateQuery("status", k)} className="transition">
            <StatusChip
              variant={leadStatusVariant(k)}
              size="md"
              className={cn(
                "cursor-pointer",
                currentStatus === k && "ring-2 ring-offset-1 ring-deep-blue-400"
              )}
            >
              {statusLabels[k]} <span className="num ml-1">{counts[k]}</span>
            </StatusChip>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-400" />
          <input
            defaultValue={currentKeyword}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateQuery("keyword", (e.target as HTMLInputElement).value);
              }
            }}
            placeholder="搜索姓名、手机号..."
            className="input pl-9 w-full"
          />
        </div>

        <select
          value={currentSource}
          onChange={(e) => updateQuery("source", e.target.value)}
          className="input min-w-[140px]"
        >
          <option value="">全部来源</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="relative">
          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-400" />
          <select
            value={currentAssignee}
            onChange={(e) => updateQuery("assigneeId", e.target.value)}
            className="input pl-9 min-w-[160px]"
          >
            <option value="">全部负责人</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleExport} className="btn-secondary gap-1.5">
          <Download size={16} />
          导出
        </button>
      </div>
    </div>
  );
}
