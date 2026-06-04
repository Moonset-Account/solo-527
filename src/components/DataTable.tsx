"use client";

import { ReactNode, useState } from "react";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyText?: string;
}

export function DataTable<T extends { id?: number }>({
  columns,
  data,
  loading,
  onRowClick,
  emptyText = "暂无数据",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        加载中...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyText}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="table-header"
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, rowIdx) => (
            <tr
              key={item.id || rowIdx}
              className={`hover:bg-gray-50 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="table-cell">
                  {col.render
                    ? col.render(item)
                    : (item[col.key as keyof T] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-500">
        共 {total} 条记录，第 {page} / {totalPages} 页
      </div>
      <div className="flex space-x-2">
        <button
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`px-3 py-1 border rounded text-sm ${
              p === page
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

interface FilterBarProps {
  children: ReactNode;
  onExport?: () => void;
  onSaveFilter?: () => void;
  savedFilters?: { id: number; filterName: string; filterData: unknown }[];
  onApplyFilter?: (filter: unknown) => void;
}

export function FilterBar({
  children,
  onExport,
  onSaveFilter,
  savedFilters,
  onApplyFilter,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary text-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "收起筛选" : "展开筛选"}
          </button>
          {savedFilters && savedFilters.length > 0 && (
            <select
              className="input text-sm w-auto"
              onChange={(e) => {
                const filter = savedFilters.find(
                  (f) => f.id === parseInt(e.target.value, 10)
                );
                if (filter && onApplyFilter) {
                  onApplyFilter(filter.filterData);
                }
              }}
              defaultValue=""
            >
              <option value="">已保存的筛选条件</option>
              {savedFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.filterName}
                </option>
              ))}
            </select>
          )}
          {onSaveFilter && (
            <button className="btn-secondary text-sm" onClick={onSaveFilter}>
              保存当前筛选条件
            </button>
          )}
        </div>
        {onExport && (
          <button className="btn-success text-sm" onClick={onExport}>
            导出 Excel
          </button>
        )}
      </div>
      {showFilters && (
        <div className="card p-4">{children}</div>
      )}
    </div>
  );
}
