import * as React from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T;
  render?: (record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onSort?: (key: keyof T | string, order: 'asc' | 'desc' | null) => void;
  rowKey?: keyof T | ((record: T) => string);
  className?: string;
  emptyText?: string;
}

export default function Table<T extends object>({
  columns,
  data,
  loading = false,
  pagination,
  onSort,
  rowKey = 'id' as keyof T,
  className,
  emptyText = '暂无数据',
}: TableProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | null>(null);

  const handleSort = (key: keyof T | string) => {
    if (!onSort) return;
    let newOrder: 'asc' | 'desc' | null = 'asc';
    if (sortKey === key) {
      if (sortOrder === 'asc') newOrder = 'desc';
      else if (sortOrder === 'desc') newOrder = null;
    }
    setSortKey(newOrder ? key : null);
    setSortOrder(newOrder);
    onSort(key, newOrder);
  };

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return String(record[rowKey] ?? index);
  };

  const renderCell = (record: T, column: TableColumn<T>, index: number): React.ReactNode => {
    if (column.render) return column.render(record, index);
    if (column.dataIndex) return record[column.dataIndex] as React.ReactNode;
    return null;
  };

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium text-neutral-700 border-b border-neutral-200',
                    alignClasses[col.align || 'left'],
                    col.sortable ? 'cursor-pointer select-none' : '',
                    col.width ? `w-[${col.width}]` : ''
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="inline-flex items-center gap-1">
                    {col.title}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={cn(
                            'w-3 h-3',
                            sortKey === col.key && sortOrder === 'asc'
                              ? 'text-primary-500'
                              : 'text-neutral-300'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 -mt-1',
                            sortKey === col.key && sortOrder === 'desc'
                              ? 'text-primary-500'
                              : 'text-neutral-300'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary-500" />
                  <p className="mt-2 text-sm text-neutral-500">加载中...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-neutral-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={getRowKey(record, index)}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-sm text-neutral-800 border-b border-neutral-100',
                        alignClasses[col.align || 'left']
                      )}
                    >
                      {renderCell(record, col, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
          <span className="text-sm text-neutral-500">
            共 {pagination.total} 条
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              上一页
            </button>
            <span className="text-sm text-neutral-700">
              {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
            </span>
            <button
              className="px-3 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
