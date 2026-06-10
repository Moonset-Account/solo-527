import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
}

function Skeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = '暂无数据',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="card">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={cn('border-b border-gray-50 hover:bg-gray-50/50 transition-colors', idx % 2 === 1 && 'bg-gray-50/30')}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.render ? col.render(row, idx) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {data.map((row, idx) => (
          <div key={idx} className="card p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">{col.label}</span>
                <span className="text-sm font-medium text-gray-800">
                  {col.render ? col.render(row, idx) : (row[col.key] as ReactNode)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
