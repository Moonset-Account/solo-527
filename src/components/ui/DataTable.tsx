import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  className?: string
  onRowClick?: (row: T, index: number) => void
}

export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn('bg-white rounded-xl shadow-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.width && `w-${col.width}`
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className={cn(
                    'transition-colors duration-200',
                    onRowClick && 'cursor-pointer hover:bg-primary-50'
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-600',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right font-mono'
                      )}
                    >
                      {col.render ? col.render(row, index) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
