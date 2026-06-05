'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { Search, Filter, Download, User, Clock, FileText } from 'lucide-react'

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [entityFilter, actionFilter])

  async function loadLogs() {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setLogs(mockLogs)
    } catch (error) {
      console.error('Failed to load audit logs', error)
    } finally {
      setLoading(false)
    }
  }

  const mockLogs = [
    {
      id: '1',
      action: 'UPDATE',
      entity_type: 'bookings',
      entity_id: 'booking-123',
      user: { full_name: '王经理', email: 'manager@studio.com' },
      old_data: { status: 'pending' },
      new_data: { status: 'confirmed' },
      ip_address: '192.168.1.100',
      created_at: '2024-01-15T14:30:00',
    },
    {
      id: '2',
      action: 'INSERT',
      entity_type: 'payments',
      entity_id: 'payment-456',
      user: { full_name: '王经理', email: 'manager@studio.com' },
      old_data: null,
      new_data: { amount: 500, payment_method: '微信', is_deposit: true },
      ip_address: '192.168.1.100',
      created_at: '2024-01-15T14:25:00',
    },
    {
      id: '3',
      action: 'INSERT',
      entity_type: 'equipment_damages',
      entity_id: 'damage-789',
      user: { full_name: '张助理', email: 'assistant@studio.com' },
      old_data: null,
      new_data: { equipment_id: 'eq-123', severity: 'minor', description: '镜头轻微划痕' },
      ip_address: '192.168.1.101',
      created_at: '2024-01-15T12:15:00',
    },
    {
      id: '4',
      action: 'UPDATE',
      entity_type: 'equipment',
      entity_id: 'eq-456',
      user: { full_name: '李摄影师', email: 'photo@studio.com' },
      old_data: { status: 'available' },
      new_data: { status: 'rented' },
      ip_address: '192.168.1.102',
      created_at: '2024-01-15T10:00:00',
    },
    {
      id: '5',
      action: 'DELETE',
      entity_type: 'booking_equipment',
      entity_id: 'be-123',
      user: { full_name: '王经理', email: 'manager@studio.com' },
      old_data: { equipment_id: 'eq-789', quantity: 1 },
      new_data: null,
      ip_address: '192.168.1.100',
      created_at: '2024-01-14T18:45:00',
    },
    {
      id: '6',
      action: 'INSERT',
      entity_type: 'bookings',
      entity_id: 'booking-456',
      user: { full_name: '王经理', email: 'manager@studio.com' },
      old_data: null,
      new_data: { client_id: 'client-123', studio_id: 'studio-1', start_time: '2024-01-20T09:00:00' },
      ip_address: '192.168.1.100',
      created_at: '2024-01-14T16:30:00',
    },
    {
      id: '7',
      action: 'UPDATE',
      entity_type: 'clients',
      entity_id: 'client-456',
      user: { full_name: '王经理', email: 'manager@studio.com' },
      old_data: { phone: '138****1234' },
      new_data: { phone: '138****5678' },
      ip_address: '192.168.1.100',
      created_at: '2024-01-14T14:20:00',
    },
  ]

  const entities = [
    { value: 'all', label: '全部类型' },
    { value: 'bookings', label: '订单' },
    { value: 'payments', label: '支付' },
    { value: 'equipment', label: '器材' },
    { value: 'equipment_damages', label: '损坏记录' },
    { value: 'clients', label: '客户' },
  ]

  const actions = [
    { value: 'all', label: '全部操作' },
    { value: 'INSERT', label: '新增' },
    { value: 'UPDATE', label: '更新' },
    { value: 'DELETE', label: '删除' },
  ]

  const filteredLogs = logs.filter((log) => {
    if (search && !log.user.full_name.includes(search) && !log.entity_type.includes(search)) {
      return false
    }
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    return true
  })

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT': return { label: '新增', color: 'bg-green-100 text-green-700' }
      case 'UPDATE': return { label: '更新', color: 'bg-blue-100 text-blue-700' }
      case 'DELETE': return { label: '删除', color: 'bg-red-100 text-red-700' }
      default: return { label: action, color: 'bg-gray-100 text-gray-700' }
    }
  }

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      bookings: '订单',
      payments: '支付',
      equipment: '器材',
      equipment_damages: '损坏记录',
      clients: '客户',
      booking_equipment: '订单器材',
    }
    return labels[entity] || entity
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>
          <p className="text-gray-500 mt-1">所有系统操作的完整记录，可追溯到具体人和时间</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索操作人或实体类型"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {entities.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {actions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                <Download size={16} />
                导出
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实体类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">变更详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const actionConfig = getActionLabel(log.action)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">
                          {new Date(log.created_at).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleTimeString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionConfig.color}`}>
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{getEntityLabel(log.entity_type)}</div>
                        <div className="text-xs text-gray-400 font-mono">{log.entity_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={14} className="text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-800">{log.user.full_name}</div>
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {log.ip_address}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {log.old_data && (
                            <div className="mb-1">
                              <span className="text-red-500">-</span>{' '}
                              <code className="text-xs bg-red-50 px-1 py-0.5 rounded">
                                {JSON.stringify(log.old_data)}
                              </code>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <span className="text-green-500">+</span>{' '}
                              <code className="text-xs bg-green-50 px-1 py-0.5 rounded">
                                {JSON.stringify(log.new_data)}
                              </code>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 {filteredLogs.length} 条记录
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled>
                上一页
              </button>
              <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
