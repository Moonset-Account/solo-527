import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  rowKey?: (row: T) => string | number;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onSort,
  rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: string) => {
    const dir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(dir);
    onSort?.(key, dir);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#334155]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-[#94A3B8] font-medium whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-[#F1F5F9]"
                  >
                    {col.title}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )
                    ) : (
                      <ChevronUp size={14} className="opacity-30" />
                    )}
                  </button>
                ) : (
                  col.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={rowKey ? rowKey(row) : idx}
              className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[#CBD5E1] whitespace-nowrap">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-[#64748B]">
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#334155]">
          <span className="text-sm text-[#94A3B8]">
            共 {total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94A3B8]"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed text-[#94A3B8]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
