'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import type { AuditLog } from '@/types'
import AppShell from '@/components/layout/AppShell'

const ACTION_TYPES = ['全部', '登录', '预约', '归档', '审批', '设备管理']

const MOCK_LOGS: AuditLog[] = [
  { id: '1', user_id: 'u1', action: '登录', resource_type: 'session', resource_id: null, details: { ip: '192.168.1.10' }, created_at: '2024-03-16T09:15:00Z', user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'researcher', display_name: '张三', lab_id: 'lab1' } },
  { id: '2', user_id: 'u2', action: '预约', resource_type: 'booking', resource_id: 'BK-001', details: { instrument: 'XRD', time: '09:00-11:00' }, created_at: '2024-03-16T09:30:00Z', user: { id: 'u2', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: 'lab1' } },
  { id: '3', user_id: 'u3', action: '归档', resource_type: 'archive', resource_id: 'AR-012', details: { project: '材料分析项目' }, created_at: '2024-03-16T10:00:00Z', user: { id: 'u3', email: 'wangwu@lab.edu', role: 'archivist', display_name: '王五', lab_id: 'lab1' } },
  { id: '4', user_id: 'u1', action: '审批', resource_type: 'permission', resource_id: 'PR-005', details: { approved: true }, created_at: '2024-03-16T10:15:00Z', user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'admin', display_name: '张三', lab_id: 'lab1' } },
  { id: '5', user_id: 'u4', action: '设备管理', resource_type: 'instrument', resource_id: 'INS-003', details: { action: '停用', reason: '校准维护' }, created_at: '2024-03-16T11:00:00Z', user: { id: 'u4', email: 'zhaoliu@lab.edu', role: 'equipment_teacher', display_name: '赵六', lab_id: 'lab1' } },
  { id: '6', user_id: 'u5', action: '登录', resource_type: 'session', resource_id: null, details: { ip: '192.168.1.22' }, created_at: '2024-03-16T11:30:00Z', user: { id: 'u5', email: 'sunqi@lab.edu', role: 'researcher', display_name: '孙七', lab_id: 'lab1' } },
  { id: '7', user_id: 'u2', action: '预约', resource_type: 'booking', resource_id: 'BK-002', details: { instrument: 'SEM', time: '14:00-16:00' }, created_at: '2024-03-16T13:00:00Z', user: { id: 'u2', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: 'lab1' } },
  { id: '8', user_id: 'u3', action: '归档', resource_type: 'archive', resource_id: 'AR-013', details: { project: '纳米材料研究' }, created_at: '2024-03-16T14:00:00Z', user: { id: 'u3', email: 'wangwu@lab.edu', role: 'archivist', display_name: '王五', lab_id: 'lab1' } },
  { id: '9', user_id: 'u1', action: '审批', resource_type: 'permission', resource_id: 'PR-006', details: { approved: false }, created_at: '2024-03-16T14:30:00Z', user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'admin', display_name: '张三', lab_id: 'lab1' } },
  { id: '10', user_id: 'u4', action: '设备管理', resource_type: 'instrument', resource_id: 'INS-001', details: { action: '恢复', note: '校准完成' }, created_at: '2024-03-16T15:00:00Z', user: { id: 'u4', email: 'zhaoliu@lab.edu', role: 'equipment_teacher', display_name: '赵六', lab_id: 'lab1' } },
  { id: '11', user_id: 'u6', action: '预约', resource_type: 'booking', resource_id: 'BK-003', details: { instrument: 'FTIR', time: '09:00-10:00' }, created_at: '2024-03-15T08:45:00Z', user: { id: 'u6', email: 'zhouba@lab.edu', role: 'researcher', display_name: '周八', lab_id: 'lab1' } },
  { id: '12', user_id: 'u5', action: '登录', resource_type: 'session', resource_id: null, details: { ip: '192.168.1.35' }, created_at: '2024-03-15T09:00:00Z', user: { id: 'u5', email: 'sunqi@lab.edu', role: 'researcher', display_name: '孙七', lab_id: 'lab1' } },
  { id: '13', user_id: 'u3', action: '归档', resource_type: 'archive', resource_id: 'AR-014', details: { project: '催化剂筛选' }, created_at: '2024-03-15T11:00:00Z', user: { id: 'u3', email: 'wangwu@lab.edu', role: 'archivist', display_name: '王五', lab_id: 'lab1' } },
  { id: '14', user_id: 'u2', action: '预约', resource_type: 'booking', resource_id: 'BK-004', details: { instrument: 'XRD', time: '13:00-15:00' }, created_at: '2024-03-15T12:30:00Z', user: { id: 'u2', email: 'lisi@lab.edu', role: 'researcher', display_name: '李四', lab_id: 'lab1' } },
  { id: '15', user_id: 'u1', action: '设备管理', resource_type: 'instrument', resource_id: 'INS-005', details: { action: '新增', note: '新增TEM设备' }, created_at: '2024-03-15T16:00:00Z', user: { id: 'u1', email: 'zhangsan@lab.edu', role: 'admin', display_name: '张三', lab_id: 'lab1' } },
]

const PAGE_SIZE = 5

const actionVariant: Record<string, string> = {
  '登录': 'bg-slate-100 text-slate-600',
  '预约': 'bg-teal-50 text-teal-700',
  '归档': 'bg-amber-50 text-amber-700',
  '审批': 'bg-purple-50 text-purple-700',
  '设备管理': 'bg-blue-50 text-blue-700',
}

export default function LogsPage() {
  const [actionFilter, setActionFilter] = useState('全部')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const filtered = MOCK_LOGS.filter(log => {
    if (actionFilter !== '全部' && log.action !== actionFilter) return false
    if (searchTerm && !log.user?.display_name.includes(searchTerm) && !log.user?.email.includes(searchTerm)) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-4">操作日志</h1>
        <div className="card flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <input type="date" className="input-field w-auto" placeholder="开始日期" />
          <span className="text-slate-400">至</span>
          <input type="date" className="input-field w-auto" placeholder="结束日期" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            className="input-field w-auto"
          >
            {ACTION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              placeholder="搜索用户..."
              className="input-field pl-9"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-medium text-slate-600">时间</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">用户</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">操作类型</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">资源类型</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">资源ID</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">详情</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{log.user?.display_name}</p>
                    <p className="text-xs text-slate-400">{log.user?.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionVariant[log.action] || 'bg-slate-100 text-slate-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.resource_type}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">{log.resource_id || '-'}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                    {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            共 {filtered.length} 条记录，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-teal-600 text-white' : 'border border-slate-300 hover:bg-slate-50'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
