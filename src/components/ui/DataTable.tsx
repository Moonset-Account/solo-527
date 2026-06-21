"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);
  const pages: (number | "...")[] = [];
  const push = (x: number | "...") => pages.push(x);
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) push(i);
    else if (pages[pages.length - 1] !== "...") push("...");
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-2">
      <div className="text-xs text-deep-blue-500">
        显示 <span className="num text-deep-blue-700">{rangeStart}</span> - <span className="num text-deep-blue-700">{rangeEnd}</span> 条，共 <span className="num text-deep-blue-700">{total}</span> 条
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="btn-secondary !px-2 !py-1.5 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) => (
          p === "..." ? (
            <span key={i} className="w-8 h-8 flex items-center justify-center text-deep-blue-400 text-sm">...</span>
          ) : (
            <button
              key={i}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "num w-8 h-8 text-sm rounded-md transition",
                p === page
                  ? "bg-deep-blue-600 text-white shadow-sm"
                  : "text-deep-blue-600 hover:bg-deep-blue-50",
              )}
            >
              {p}
            </button>
          )
        ))}
        <button
          disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          className="btn-secondary !px-2 !py-1.5 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: (row: T) => string;
  className?: string;
  onClickRow?: (row: T) => void;
  empty?: React.ReactNode;
}

export function DataTable<T>({ columns, data, rowKey, className, onClickRow, empty }: DataTableProps<T>) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className={cn("table-head", c.width && `w-[${c.width}]`, c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length}>{empty ?? <div className="py-12 text-center text-sm text-deep-blue-400">暂无数据</div>}</td></tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={() => onClickRow?.(row)}
                  className={cn(
                    "transition-colors",
                    i % 2 === 1 ? "bg-deep-blue-50/20" : "bg-white",
                    onClickRow && "cursor-pointer hover:bg-ink-gold-50/50",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={cn(
                        "table-cell",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
