"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "SCHEDULED", label: "待试听" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
  { value: "NO_SHOW", label: "未到场" },
];

const FOLLOWUP_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部跟进" },
  { value: "true", label: "已跟进" },
  { value: "false", label: "待跟进" },
];

export function TrialsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [followedUp, setFollowedUp] = useState(searchParams.get("followedUp") || "all");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (followedUp !== "all") params.set("followedUp", followedUp);
    if (keyword) params.set("keyword", keyword);
    params.set("page", "1");
    const qs = params.toString();
    router.push(`/trials${qs ? `?${qs}` : ""}`);
  }, [status, followedUp, keyword, router]);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-deep-blue-600">
          <Filter size={16} className="text-ink-gold-500" />
          <span className="text-sm font-medium">筛选条件</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "chip border transition-all text-xs px-3 py-1",
                status === opt.value
                  ? "bg-deep-blue-600 text-white border-deep-blue-600"
                  : "bg-white text-deep-blue-600 border-deep-blue-200 hover:border-ink-gold-400",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {FOLLOWUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFollowedUp(opt.value)}
              className={cn(
                "chip border transition-all text-xs px-3 py-1",
                followedUp === opt.value
                  ? "bg-ink-gold-500 text-white border-ink-gold-500"
                  : "bg-white text-deep-blue-600 border-deep-blue-200 hover:border-ink-gold-400",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-deep-blue-400" />
          <input
            type="text"
            placeholder="搜索学员姓名、电话..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>
    </div>
  );
}
