"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "PENDING", label: "待开课" },
  { value: "ONGOING", label: "进行中" },
  { value: "FINISHED", label: "已结课" },
  { value: "SUSPENDED", label: "已暂停" },
];

const MAJOR_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部专业" },
  { value: "FINE_ARTS", label: "美术" },
  { value: "DESIGN", label: "设计" },
  { value: "MEDIA", label: "传媒" },
  { value: "MUSIC", label: "音乐" },
  { value: "DANCE", label: "舞蹈" },
  { value: "OTHER", label: "其他" },
];

export function ClassesFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [major, setMajor] = useState(searchParams.get("major") || "all");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (major !== "all") params.set("major", major);
    if (keyword) params.set("keyword", keyword);
    params.set("page", "1");
    const qs = params.toString();
    router.push(`/classes${qs ? `?${qs}` : ""}`);
  }, [status, major, keyword, router]);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-deep-blue-600">
          <Filter size={16} className="text-ink-gold-500" />
          <span className="text-sm font-medium">班级状态</span>
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
        <div className="flex items-center gap-2 text-deep-blue-600">
          <span className="text-sm font-medium">专业方向</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MAJOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMajor(opt.value)}
              className={cn(
                "chip border transition-all text-xs px-3 py-1",
                major === opt.value
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
            placeholder="搜索班级名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>
    </div>
  );
}
