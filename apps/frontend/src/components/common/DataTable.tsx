import React from 'react';

interface DataTableColumn<T> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  onRowClick?: (record: T) => void;
}

export function DataTable<T extends { id?: number }>({
  columns,
  data,
  loading,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={(record.id as any) || index}
                  onClick={() => onRowClick?.(record)}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                      {col.render ? col.render(record[col.dataIndex], record) : String(record[col.dataIndex] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {pagination.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onChange(pagination.current - 1)}
              disabled={pagination.current <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </span>
            <button
              onClick={() => pagination.onChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
