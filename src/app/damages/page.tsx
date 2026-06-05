'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, AlertTriangle, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/MobileNav'

const statusConfig: Record<string, { label: string; color: string }> = {
  reported: { label: '已上报', color: 'bg-yellow-100 text-yellow-700' },
  investigating: { label: '调查中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
}

const severityConfig: Record<string, { label: string; color: string }> = {
  minor: { label: '轻微', color: 'bg-yellow-100 text-yellow-700' },
  moderate: { label: '中度', color: 'bg-orange-100 text-orange-700' },
  severe: { label: '严重', color: 'bg-red-100 text-red-700' },
}

const mockDamages = [
  {
    id: '1',
    equipment_name: 'Canon EOS R5',
    equipment_sku: 'CAM-001',
    severity: 'minor',
    status: 'resolved',
    description: '机身底部有轻微划痕',
    created_at: '2024-01-08T16:30:00',
  },
  {
    id: '2',
    equipment_name: 'Manfrotto 三脚架',
    equipment_sku: 'TRIPOD-001',
    severity: 'moderate',
    status: 'reported',
    description: '三脚架云台连接处松动',
    created_at: '2024-01-14T11:00:00',
  },
  {
    id: '3',
    equipment_name: 'Profoto B10X Plus',
    equipment_sku: 'LIT-001',
    severity: 'severe',
    status: 'investigating',
    description: '闪光灯管破裂，无法正常闪光',
    created_at: '2024-01-12T09:15:00',
  },
]

export default function DamagesPage() {
  const [damages, setDamages] = useState(mockDamages)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDamages()
  }, [])

  async function loadDamages() {
    try {
      const res = await fetch('/api/damages')
      const data = await res.json()
      if (data.data?.length > 0) {
        setDamages(data.data.map((d: any) => ({
          ...d,
          equipment_name: d.equipment?.name || '未知器材',
          equipment_sku: d.equipment?.sku || '',
        })))
      }
    } catch (error) {
      console.error('Load damages error:', error)
    }
  }

  const filteredDamages = damages.filter(d => {
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    const matchesSearch = searchQuery === '' || 
      d.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <Link href="/dashboard" className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">损坏记录</h1>
            <p className="text-xs text-gray-500">共 {damages.length} 条记录</p>
          </div>
          <Link href="/damages/new" className="bg-primary-600 text-white p-2 rounded-lg">
            <Plus size={18} />
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索器材或描述"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'reported', 'investigating', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {status === 'all' ? '全部' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {filteredDamages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">暂无损坏记录</p>
            <p className="text-sm mt-1">点击右上角添加损坏报告</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDamages.map((damage) => (
              <Link
                key={damage.id}
                href={`/equipment/${damage.id}`}
                className="block bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-800">{damage.equipment_name}</div>
                    <div className="text-xs text-gray-500">{damage.equipment_sku}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[damage.status]?.color}`}>
                    {statusConfig[damage.status]?.label || damage.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig[damage.severity]?.color}`}>
                    {severityConfig[damage.severity]?.label || damage.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{damage.description}</p>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(damage.created_at).toLocaleString('zh-CN')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
