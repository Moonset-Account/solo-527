"use client";

import { useMemo, useState } from "react";
import { Search, Download, Layers3, ListFilter, Plus, X } from "lucide-react";
import { Pagination } from "../ui/Pagination";
import { SelectEnum } from "../ui/SelectEnum";
import { cn, downloadCSV, buildDownloadFileName } from "@/lib/utils";

export interface FilterSpec {
  key: string;
  label: string;
  options?: { value: string; label: string }[];
  type?: "select" | "text" | "date";
}

export interface ColumnSpec<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string | number | undefined | null;
  className?: string;
}

export interface ListPageTemplateProps<
  T extends { id: string },
  F extends Record<string, unknown>
> {
  title: string;
  description?: string;
  createLabel?: string;
  onCreate?: () => void;
  canCreate?: boolean;
  canGroup?: boolean;
  canExport?: boolean;
  downloadBaseName: string;
  filters: FilterSpec[];
  columns: ColumnSpec<T>[];
  exportHeaders?: { key: string; label: string }[];
  onRowClick?: (row: T) => void;
  query: (input: F) => {
    data?: {
      items: T[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      grouped?: { owner: { id: string; name: string; email: string }; items: T[] }[];
    };
    isLoading: boolean;
    isError?: boolean;
    refetch: () => void;
  };
  exportMutation?: {
    mutateAsync: (input: Omit<F, "page" | "pageSize" | "groupByOwner" | "groupByAssignee">) => Promise<T[]>;
    isPending: boolean;
  };
  defaultFilters?: Partial<F>;
}

export function ListPageTemplate<
  T extends { id: string },
  F extends Record<string, unknown> = Record<string, unknown>
>(props: ListPageTemplateProps<T, F>) {
  const {
    title,
    description,
    createLabel = "新建",
    onCreate,
    canCreate = true,
    canGroup = true,
    canExport = true,
    downloadBaseName,
    filters,
    columns,
    exportHeaders,
    onRowClick,
    query,
    exportMutation,
    defaultFilters = {},
  } = props;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [groupBy, setGroupBy] = useState(false);
  const [filterState, setFilterState] = useState<Record<string, unknown>>({
    keyword: null,
    ...defaultFilters,
  });

  const inputObj = useMemo(
    () =>
      ({
        page,
        pageSize,
        groupByOwner: groupBy,
        groupByAssignee: groupBy,
        ...filterState,
      }) as F,
    [page, pageSize, groupBy, filterState]
  );

  const result = query(inputObj);
  const data = result.data;

  const updateFilter = (key: string, value: unknown) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilterState({ keyword: null, ...defaultFilters });
    setPage(1);
  };

  const handleExport = async () => {
    if (!exportMutation) return;
    const exportInput = { ...filterState } as Omit<
      F,
      "page" | "pageSize" | "groupByOwner" | "groupByAssignee"
    >;
    const rows = await exportMutation.mutateAsync(exportInput);
    const headers =
      exportHeaders ??
      columns.map((c) => ({
        key: c.key,
        label: c.label,
      }));
    const csvRows = rows.map((r) => {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        if (col.csvValue) {
          row[col.key] = col.csvValue(r);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = (r as any)[col.key];
          row[col.key] =
            typeof v === "object" && v !== null && "label" in v
              ? (v as { label: string }).label
              : v;
        }
      }
      return row;
    });
    downloadCSV(buildDownloadFileName(downloadBaseName), csvRows, headers);
  };

  const renderTable = (items: T[]) => (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(row) : renderCell(row, c.key)}
                </td>
              ))}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-sm text-slate-400"
              >
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canExport && exportMutation && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4" />
              导出
            </button>
          )}
          {canGroup && (
            <button
              type="button"
              className={cn("btn-secondary", groupBy && "bg-primary-50 !text-primary-700")}
              onClick={() => {
                setGroupBy((v) => !v);
                setPage(1);
              }}
            >
              <Layers3 className="h-4 w-4" />
              {groupBy ? "取消分组" : "按负责人分组"}
            </button>
          )}
          {canCreate && onCreate && (
            <button type="button" className="btn-primary" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              {createLabel}
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <ListFilter className="h-4 w-4" />
            筛选
          </div>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="关键词搜索…"
              className="h-9 w-full pl-8"
              value={(filterState.keyword as string | null) ?? ""}
              onChange={(e) =>
                updateFilter("keyword", e.target.value || null)
              }
            />
          </div>
          {filters.map((f) =>
            f.type === "text" ? (
              <input
                key={f.key}
                type="text"
                placeholder={f.label}
                className="h-9 w-44"
                value={(filterState[f.key] as string | null) ?? ""}
                onChange={(e) => updateFilter(f.key, e.target.value || null)}
              />
            ) : f.type === "date" ? (
              <input
                key={f.key}
                type="date"
                className="h-9 w-auto"
                value={formatForInput(filterState[f.key])}
                onChange={(e) => updateFilter(f.key, e.target.value || null)}
              />
            ) : (
              <SelectEnum
                key={f.key}
                placeholder={f.label}
                options={f.options ?? []}
                value={filterState[f.key] as string | null | undefined}
                onChange={(v) => updateFilter(f.key, v)}
                className="w-40"
                nullable
              />
            )
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={resetFilters}
          >
            <X className="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      {result.isLoading ? (
        <div className="card p-10 text-center text-sm text-slate-400">
          加载中…
        </div>
      ) : result.isError ? (
        <div className="card p-10 text-center text-sm text-danger-600">
          加载失败
        </div>
      ) : groupBy && data?.grouped && data.grouped.length > 0 ? (
        <div className="space-y-4">
          {data.grouped.map((g) => (
            <div key={g.owner.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {g.owner.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {g.owner.name ?? "未命名"}
                    </span>
                    {g.owner.email && (
                      <span className="ml-2 text-xs text-slate-500">
                        {g.owner.email}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {g.items.length} 条
                </span>
              </div>
              {renderTable(g.items)}
            </div>
          ))}
        </div>
      ) : (
        <>
          {renderTable(data?.items ?? [])}
          <div className="card">
            <Pagination
              page={data?.page ?? page}
              pageSize={data?.pageSize ?? pageSize}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? Math.ceil((data?.total ?? 0) / pageSize)}
              onChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function renderCell<T extends object>(row: T, key: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (row as any)[key];
  if (v === null || v === undefined) return <span className="text-slate-400">-</span>;
  if (typeof v === "object" && v !== null && "label" in v && "cls" in v) {
    return <span className={(v as { cls: string }).cls}>{(v as { label: string }).label}</span>;
  }
  if (typeof v === "object" && v !== null && "name" in v) {
    return (v as { name?: string }).name ?? "-";
  }
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return "-";
}

function formatForInput(v: unknown) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return "";
}
