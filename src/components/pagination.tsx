"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="text-sm text-zinc-500">
        显示 {startItem} - {endItem} 条，共 {total} 条
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "min-w-8 rounded-md px-2 py-1 text-sm font-medium transition-colors",
                  page === pageNum
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="rounded-md border border-zinc-200 p-1 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
