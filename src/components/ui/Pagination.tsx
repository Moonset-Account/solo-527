"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex items-center justify-between gap-2 px-4 py-3 text-sm", className)}>
      <div className="text-slate-500">
        显示 <span className="font-medium text-slate-700">{start}</span> –{" "}
        <span className="font-medium text-slate-700">{end}</span> 条，共{" "}
        <span className="font-medium text-slate-700">{total}</span> 条
      </div>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <select
            className="h-8 w-auto"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} 条/页
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary h-8 w-8 !p-0"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            aria-label="上一页"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {buildPages(page, totalPages).map((p) =>
            p === "..." ? (
              <span key={`dot-${p}-${Math.random()}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={cn("h-8 min-w-8 px-2 rounded-md text-sm", {
                  "bg-primary-600 text-white": p === page,
                  "text-slate-600 hover:bg-slate-100": p !== page,
                })}
                onClick={() => onChange(p as number)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="btn-secondary h-8 w-8 !p-0"
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            aria-label="下一页"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function buildPages(current: number, total: number): (number | "...")[] {
  const delta = 2;
  const range: number[] = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  const pages: (number | "...")[] = [1];
  if (range[0] > 2) pages.push("...");
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}
