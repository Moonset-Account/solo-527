import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string;
  direction: SortDirection;
}

interface FilterState {
  [key: string]: string;
}

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  emptyText?: string;
  showHeader?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey = "id",
  loading = false,
  pagination = true,
  pageSize = 10,
  onRowClick,
  className,
  emptyText = "暂无数据",
  showHeader = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({});

  const processedData = useMemo(() => {
    let result = [...data];

    if (sortState && sortState.direction) {
      result.sort((a, b) => {
        const aVal = a[sortState.key];
        const bVal = b[sortState.key];
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    Object.entries(filterState).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = String(item[key] ?? "").toLowerCase();
          return itemValue.includes(value.toLowerCase());
        });
      }
    });

    return result;
  }, [data, sortState, filterState]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize, pagination]);

  const handleSort = (key: string) => {
    setSortState((prev) => {
      if (prev?.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return String(record[rowKey] ?? index);
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  if (!loading && processedData.length === 0) {
    return <EmptyState title={emptyText} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-xl border border-card-border shadow-card">
        <table className="w-full border-collapse">
          {showHeader && (
            <thead>
              <tr className="bg-muted/5 border-b border-card-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-sm font-semibold text-foreground",
                      alignClasses[column.align || "left"],
                      column.className
                    )}
                    style={{ width: column.width }}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        (column.sortable || column.filterable) && "cursor-pointer select-none",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      <span>{column.title}</span>
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="p-0.5 hover:bg-muted/10 rounded"
                        >
                          {sortState?.key === column.key ? (
                            sortState.direction === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                          )}
                        </button>
                      )}
                      {column.filterable && (
                        <div className="relative">
                          <Filter className="w-3.5 h-3.5 text-muted" />
                          <input
                            type="text"
                            value={filterState[column.key] || ""}
                            onChange={(e) =>
                              setFilterState((prev) => ({
                                ...prev,
                                [column.key]: e.target.value,
                              }))
                            }
                            placeholder="筛选"
                            className="absolute top-full left-0 mt-1 w-32 px-2 py-1 text-xs border border-card-border rounded bg-card shadow-md z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {loading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index} className="border-b border-card-border last:border-b-0">
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "px-4 py-3",
                          alignClasses[column.align || "left"],
                          column.className
                        )}
                      >
                        <div className="h-4 bg-muted/20 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : paginatedData.map((record, index) => (
                  <tr
                    key={getRowKey(record, index)}
                    className={cn(
                      "border-b border-card-border last:border-b-0 transition-colors",
                      onRowClick && "hover:bg-muted/5 cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = record[column.dataIndex];
                      return (
                        <td
                          key={colIndex}
                          className={cn(
                            "px-4 py-3 text-sm text-foreground",
                            alignClasses[column.align || "left"],
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(value, record, index)
                            : value as React.ReactNode}
                        </td>
                      );
                    })}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pagination && processedData.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted">
            共 {processedData.length} 条记录，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
