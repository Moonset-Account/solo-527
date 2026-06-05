'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { AlertTriangle, Clock, CheckCircle, XCircle, Search, Eye, DollarSign } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  reported: { label: '已上报', color: 'bg-yellow-100 text-yellow-700' },
  investigating: { label: '调查中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
}

const severityConfig: Record<string, { label: string; color: string }> = {
  minor: { label: '轻微', color: 'bg-yellow-100 text-yellow-700' },
  moderate: { label: '中度', color: 'bg-orange-100 text-orange-700' },
  severe: { label: '严重', color: 'bg-red-100 text-red-700' },
  total: { label: '完全损坏', color: 'bg-gray-800 text-white' },
}

const mockDamages = [
  {
    id: '1',
    equipment_name: 'Canon EOS R5',
    equipment_sku: 'CAM-001',
    severity: 'minor',
    status: 'resolved',
    description: '机身底部有轻微划痕，不影响使用',
    responsible_party: '客户 张三',
    reporter: '李助理',
    repair_cost: 0,
    created_at: '2024-01-08T16:30:00',
    booking_no: 'BK20240110001',
  },
  {
    id: '2',
    equipment_name: 'Manfrotto 三脚架',
    equipment_sku: 'TRIPOD-001',
    severity: 'moderate',
    status: 'reported',
    description: '三脚架云台连接处松动，需要维修',
    responsible_party: '拍摄助理 张助理',
    reporter: '王助理',
    repair_cost: 500,
    created_at: '2024-01-14T11:00:00',
    booking_no: 'BK202401150002',
  },
  {
    id: '3',
    equipment_name: 'Profoto B10X Plus',
    equipment_sku: 'LIT-001',
    severity: 'severe',
    status: 'investigating',
    description: '闪光灯管破裂，无法正常闪光',
    responsible_party: '客户 王五公司',
    reporter: '赵助理',
    repair_cost: 2800,
    created_at: '2024-01-12T09:15:00',
    booking_no: 'BK202401150003',
  },
  {
    id: '4',
    equipment_name: 'Canon 24-70mm f/2.8',
    equipment_sku: 'LEN-001',
    severity: 'minor',
    status: 'reported',
    description: '镜头前镜片有指纹痕迹，需要清洁',
    responsible_party: '拍摄助理 李助理',
    reporter: '钱助理',
    repair_cost: 0,
    created_at: '2024-01-15T14:20:00',
    booking_no: 'BK202401160001',
  },
]

export default function AdminDamagesPage() {
  const [damages, setDamages] = useState(mockDamages)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDamages = damages.filter(d => {
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    const matchesSearch = searchQuery === '' || 
      d.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.booking_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.responsible_party.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: damages.length,
    reported: damages.filter(d => d.status === 'reported').length,
    investigating: damages.filter(d => d.status === 'investigating').length,
    resolved: damages.filter(d => d.status === 'resolved').length,
  }

  function updateStatus(id: string, newStatus: string) {
    setDamages(prev => prev.map(d => 
      d.id === id ? { ...d, status: newStatus } : d
    ))
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">损坏记录管理</h1>
          <p className="text-gray-500 mt-1">跟踪和处理器材损坏报告</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '总报告数', value: stats.total, icon: AlertTriangle, color: 'bg-blue-500' },
            { label: '待处理', value: stats.reported, icon: Clock, color: 'bg-yellow-500' },
            { label: '处理中', value: stats.investigating, icon: Eye, color: 'bg-purple-500' },
            { label: '已解决', value: stats.resolved, icon: CheckCircle, color: 'bg-green-500' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索器材、订单号或责任人"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'reported', 'investigating', 'resolved'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : statusConfig[status]?.label || status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">器材</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重程度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">维修费用</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上报时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDamages.map((damage) => (
                  <tr key={damage.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-800">{damage.equipment_name}</div>
                        <div className="text-xs text-gray-500">{damage.equipment_sku}</div>
                        {damage.booking_no && (
                          <div className="text-xs text-primary-600 mt-0.5">{damage.booking_no}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityConfig[damage.severity]?.color}`}>
                        {severityConfig[damage.severity]?.label || damage.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[damage.status]?.color}`}>
                        {statusConfig[damage.status]?.label || damage.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">{damage.responsible_party}</div>
                      <div className="text-xs text-gray-500">上报人：{damage.reporter}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-400" />
                        {damage.repair_cost > 0 ? `¥${damage.repair_cost}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(damage.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {damage.status === 'reported' && (
                          <button
                            onClick={() => updateStatus(damage.id, 'investigating')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            开始调查
                          </button>
                        )}
                        {damage.status === 'investigating' && (
                          <button
                            onClick={() => updateStatus(damage.id, 'resolved')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            标记解决
                          </button>
                        )}
                        {damage.status === 'resolved' && (
                          <button
                            onClick={() => updateStatus(damage.id, 'closed')}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            关闭
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDamages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle size={40} className="mx-auto mb-2 opacity-50" />
              <p>暂无损坏记录</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
