'use client'

import { useState } from 'react'
import { Search, QrCode, Package, Filter, Plus } from 'lucide-react'
import { MobileNav } from '@/components/MobileNav'
import { EquipmentStatusBadge } from '@/components/StatusBadges'
import Link from 'next/link'

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const mockEquipment = [
    {
      id: '1',
      name: 'Canon EOS R5',
      sku: 'CAM-001',
      status: 'available',
      hourly_rate: 80,
      brand: 'Canon',
      model: 'EOS R5',
      category: { name: '相机机身' },
    },
    {
      id: '2',
      name: 'Sony A7 IV',
      sku: 'CAM-002',
      status: 'rented',
      hourly_rate: 70,
      brand: 'Sony',
      model: 'A7 IV',
      category: { name: '相机机身' },
    },
    {
      id: '3',
      name: 'Canon 24-70mm f/2.8',
      sku: 'LEN-001',
      status: 'available',
      hourly_rate: 40,
      brand: 'Canon',
      model: 'EF 24-70mm',
      category: { name: '镜头' },
    },
    {
      id: '4',
      name: 'Profoto B10X Plus',
      sku: 'LIT-001',
      status: 'rented',
      hourly_rate: 60,
      brand: 'Profoto',
      model: 'B10X Plus',
      category: { name: '灯光设备' },
    },
    {
      id: '5',
      name: 'Godox SL60W',
      sku: 'LIT-002',
      status: 'available',
      hourly_rate: 25,
      brand: 'Godox',
      model: 'SL60W',
      category: { name: '灯光设备' },
    },
    {
      id: '6',
      name: '三脚架',
      sku: 'TRIPOD-001',
      status: 'maintenance',
      hourly_rate: 15,
      brand: 'Manfrotto',
      model: 'MT055',
      category: { name: '三脚架/稳定器' },
    },
  ]

  const categories = [
    { value: 'all', label: '全部' },
    { value: '相机机身', label: '相机机身' },
    { value: '镜头', label: '镜头' },
    { value: '灯光设备', label: '灯光' },
    { value: '三脚架/稳定器', label: '脚架' },
  ]

  const statuses = [
    { value: 'all', label: '全部' },
    { value: 'available', label: '可用' },
    { value: 'rented', label: '已租' },
    { value: 'maintenance', label: '维护' },
  ]

  const filteredEquipment = mockEquipment.filter((eq) => {
    if (search && !eq.name.includes(search) && !eq.sku.includes(search)) return false
    if (statusFilter !== 'all' && eq.status !== statusFilter) return false
    if (categoryFilter !== 'all' && eq.category.name !== categoryFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">器材管理</h1>
            <div className="flex gap-2">
              <Link
                href="/scan"
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <QrCode size={20} className="text-gray-600" />
              </Link>
              <Link
                href="/equipment/new"
                className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <Plus size={16} />
                添加
              </Link>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索器材名称或编号"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  categoryFilter === cat.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                statusFilter === status.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredEquipment.map((equipment) => (
            <Link
              key={equipment.id}
              href={`/equipment/${equipment.id}`}
              className="bg-white rounded-xl shadow-sm p-3 block"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
              <div className="font-medium text-gray-800 text-sm line-clamp-1">{equipment.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{equipment.sku}</div>
              <div className="flex items-center justify-between mt-2">
                <EquipmentStatusBadge status={equipment.status} />
                <div className="text-sm font-semibold text-primary-600">
                  ¥{equipment.hourly_rate}/h
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-50" />
            <p>没有找到相关器材</p>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  )
}
