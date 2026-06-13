import { useMemo, useState } from "react";

export function Pagination({
  total,
  page,
  pageSize,
  onChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = useMemo(() => {
    const list: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      list.push(1);
      if (page > 3) list.push("…");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) list.push(i);
      if (page < totalPages - 2) list.push("…");
      list.push(totalPages);
    }
    return list;
  }, [totalPages, page]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        共 {total} 条，第 {page} / {totalPages} 页</div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="btn-secondary h-8 px-3 !rounded-md"
        >
          上一页
        </button>
        {pages.map((p, i) => (
          p === "…" ? (
            <span key={`e${i}`} className="px-2 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`h-8 w-8 !rounded-md text-sm font-medium ${
                p === page
                  ? "btn-primary"
                  : "btn-ghost"
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="btn-secondary h-8 px-3 !rounded-md"
        >
          下一页
        </button>
      </div>
      </div>
  );
}

export function usePagination(defaultSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  return { page, pageSize, setPage, setPageSize };
}
