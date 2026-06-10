import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  module: string
  action: string
  detail: string
}

interface LogResponse {
  items: LogEntry[]
  total: number
  page: number
  limit: number
}

const moduleOptions = [
  { value: '', label: '全部模块' },
  { value: 'plots', label: '地块管理' },
  { value: 'varieties', label: '品种管理' },
  { value: 'farm-records', label: '农事记录' },
  { value: 'harvests', label: '采收记录' },
  { value: 'sorting', label: '分拣订单' },
  { value: 'orders', label: '订单履约' },
  { value: 'declarations', label: '申报材料' },
  { value: 'admin', label: '系统管理' },
]

const moduleLabel: Record<string, string> = {
  plots: '地块管理',
  varieties: '品种管理',
  'farm-records': '农事记录',
  harvests: '采收记录',
  sorting: '分拣订单',
  orders: '订单履约',
  declarations: '申报材料',
  admin: '系统管理',
}

function formatDateTime(ts: string) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function Logs() {
  const { execute, data, loading } = useApi<LogResponse>()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [module, setModule] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actionSearch, setActionSearch] = useState('')
  const limit = 20

  const fetchLogs = (p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(limit) })
    if (module) params.set('module', module)
    if (userId) params.set('userId', userId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (actionSearch) params.set('action', actionSearch)
    execute(`/api/admin/logs?${params.toString()}`).then((res) => {
      if (res) {
        setLogs(res.items || [])
        setTotal(res.total || 0)
        setPage(res.page || p)
      }
    })
  }

  useEffect(() => {
    fetchLogs(1)
  }, [])

  const handleSearch = () => {
    setPage(1)
    fetchLogs(1)
  }

  const totalPages = Math.ceil(total / limit)

  const columns: any = [
    {
      key: 'timestamp',
      label: '时间',
      render: (row: LogEntry) => (
        <span className="text-gray-600">{formatDateTime(row.timestamp)}</span>
      ),
    },
    {
      key: 'userName',
      label: '操作人',
      render: (row: LogEntry) => (
        <span className="font-medium text-gray-800">{row.userName}</span>
      ),
    },
    {
      key: 'module',
      label: '模块',
      render: (row: LogEntry) => (
        <span className="status-badge bg-primary-50 text-primary-700">
          {moduleLabel[row.module] || row.module}
        </span>
      ),
    },
    {
      key: 'action',
      label: '操作',
      render: (row: LogEntry) => (
        <span className="text-gray-700">{row.action}</span>
      ),
    },
    {
      key: 'detail',
      label: '详情',
      render: (row: LogEntry) => (
        <span className="text-gray-500 text-xs max-w-xs truncate block">{row.detail}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="操作日志" subtitle="查看系统操作记录" />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <FormField label="模块">
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="input-field"
            >
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="操作人ID">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="input-field"
              placeholder="输入用户ID"
            />
          </FormField>
          <FormField label="开始日期">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </FormField>
          <FormField label="结束日期">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </FormField>
          <FormField label="操作">
            <div className="flex gap-2">
              <input
                type="text"
                value={actionSearch}
                onChange={(e) => setActionSearch(e.target.value)}
                className="input-field"
                placeholder="搜索操作"
              />
              <button onClick={handleSearch} className="btn-primary flex items-center gap-1.5 flex-shrink-0">
                <Search className="h-4 w-4" />
                搜索
              </button>
            </div>
          </FormField>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs as unknown as Record<string, unknown>[]}
        loading={loading}
        emptyMessage="暂无日志记录"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-gray-500">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className={cn(
                'p-2 rounded-lg border transition-colors',
                page <= 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700 px-2">{page}</span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className={cn(
                'p-2 rounded-lg border transition-colors',
                page >= totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
