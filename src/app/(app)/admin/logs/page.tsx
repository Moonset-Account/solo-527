'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '@/components/useApi'
import { formatDateTime } from '@/lib/utils'
import { LogAction, Role } from '@prisma/client'

const actionLabels: Record<LogAction, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  ASSIGN: '分派',
  COMPLETE: '完成',
  PAY: '支付',
  EXPORT: '导出',
  LOGIN: '登录',
  LOGOUT: '登出',
  APPROVE: '审批',
  REJECT: '拒绝',
}

const roleLabels: Record<Role, string> = {
  RESIDENT: '住户',
  CUSTOMER_SERVICE: '客服',
  ENGINEER: '工程师',
  ADMIN: '管理员',
}

interface LogEntry {
  id: string
  action: LogAction
  targetType: string
  targetId: string
  detail: string | null
  ipAddress: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
    role: Role
  }
}

export default function LogsPage() {
  const { request, loading } = useApi()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  const loadLogs = useCallback(async () => {
    let url = `/api/logs?page=${page}&pageSize=${pageSize}`
    if (action) url += `&action=${action}`
    if (targetType) url += `&targetType=${targetType}`
    const data = await request<{ data: LogEntry[]; total: number }>(url)
    if (data) {
      setLogs(data.data)
      setTotal(data.total)
    }
  }, [request, page, action, targetType])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const totalPages = Math.ceil(total / pageSize)

  const ActionBadge = ({ a }: { a: LogAction }) => {
    const map: Record<LogAction, string> = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      ASSIGN: 'bg-indigo-100 text-indigo-700',
      COMPLETE: 'bg-green-100 text-green-700',
      PAY: 'bg-emerald-100 text-emerald-700',
      EXPORT: 'bg-purple-100 text-purple-700',
      LOGIN: 'bg-gray-100 text-gray-700',
      LOGOUT: 'bg-gray-100 text-gray-500',
      APPROVE: 'bg-green-100 text-green-700',
      REJECT: 'bg-red-100 text-red-700',
    }
    return <span className={`badge ${map[a]}`}>{actionLabels[a]}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
          <p className="text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={action} onChange={e => setAction(e.target.value)} className="input w-36">
            <option value="">全部操作</option>
            {Object.entries(actionLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={targetType} onChange={e => setTargetType(e.target.value)} className="input w-40">
            <option value="">全部对象</option>
            <option value="Bill">账单</option>
            <option value="WorkOrder">工单</option>
            <option value="VisitorAppointment">访客预约</option>
            <option value="Report">报表</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">对象类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && logs.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">加载中...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无数据</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{log.user.name || log.user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{roleLabels[log.user.role]}</td>
                <td className="px-6 py-4"><ActionBadge a={log.action} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">{log.targetType}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.detail || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono text-xs">{log.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary disabled:opacity-50">上一页</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary disabled:opacity-50">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
