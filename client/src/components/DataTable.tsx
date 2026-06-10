import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  title: string;
  render?: (record: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  rowKey?: (record: T) => string | number;
  rowClassName?: (record: T) => string;
  actions?: (record: T) => ReactNode;
  emptyText?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  rowKey,
  rowClassName,
  actions,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  const renderPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  加载中...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr key={rowKey ? rowKey(record) : index} className={`hover:bg-gray-50 ${rowClassName ? rowClassName(record) : ''}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render(record) : (record as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">{actions(record)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 {total} 条，第 {page} / {totalPages || 1} 页
        </div>
        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
          )}
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            {renderPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-3 py-1 border rounded text-sm ${
                  p === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
