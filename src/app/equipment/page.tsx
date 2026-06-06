'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { formatCurrency, getStatusText, getStatusColor } from '@/lib/utils'
import { Loader2, Plus, Search, Camera, Lightbulb, Wrench, Package as PackageIcon } from 'lucide-react'
import { Database } from '@/types/database'

type Equipment = Database['public']['Tables']['equipment']['Row']

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  const categoryIcons: Record<string, any> = {
    camera: Camera,
    lighting: Lightbulb,
    accessory: Wrench,
    other: PackageIcon,
  }

  useEffect(() => {
    const fetchEquipment = async () => {
      let query = supabase.from('equipment').select('*').order('created_at', { ascending: false })

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setEquipment(data || [])
      setLoading(false)
    }

    fetchEquipment()
  }, [categoryFilter, statusFilter])

  const filteredEquipment = equipment.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">器材管理</h1>
        {isStaff && (
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />
            添加器材
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索器材名称、品牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部分类</option>
              <option value="camera">相机</option>
              <option value="lighting">灯光</option>
              <option value="accessory">配件</option>
              <option value="other">其他</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部状态</option>
              <option value="available">可用</option>
              <option value="in_use">使用中</option>
              <option value="maintenance">维护中</option>
              <option value="damaged">已损坏</option>
              <option value="lost">已丢失</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              暂无器材数据
            </div>
          ) : (
            filteredEquipment.map((eq) => {
              const IconComponent = categoryIcons[eq.category] || PackageIcon
              return (
                <div
                  key={eq.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{eq.name}</h3>
                        <p className="text-sm text-gray-500">
                          {eq.brand} {eq.model}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                      {getStatusText(eq.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">日租金</p>
                      <p className="font-medium">{formatCurrency(eq.rental_price)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">押金</p>
                      <p className="font-medium">{formatCurrency(eq.deposit_amount)}</p>
                    </div>
                    {isStaff && eq.purchase_price && (
                      <div className="col-span-2">
                        <p className="text-gray-500">采购价（内部）</p>
                        <p className="font-medium text-gray-600">{formatCurrency(eq.purchase_price)}</p>
                      </div>
                    )}
                  </div>

                  {eq.description && (
                    <p className="mt-3 text-sm text-gray-600">{eq.description}</p>
                  )}

                  {eq.serial_number && (
                    <p className="mt-2 text-xs text-gray-400">SN: {eq.serial_number}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
