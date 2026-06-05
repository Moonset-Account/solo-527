'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { Package, Search, Plus } from 'lucide-react'

const mockEquipment = [
  { id: '1', name: 'Canon EOS R5', sku: 'CAM-001', category: '相机机身', status: 'available', hourly_rate: 80 },
  { id: '2', name: 'Sony A7 IV', sku: 'CAM-002', category: '相机机身', status: 'rented', hourly_rate: 70 },
  { id: '3', name: 'Canon 24-70mm f/2.8', sku: 'LEN-001', category: '镜头', status: 'available', hourly_rate: 40 },
  { id: '4', name: 'Profoto B10X Plus', sku: 'LIT-001', category: '灯光设备', status: 'rented', hourly_rate: 60 },
  { id: '5', name: 'Godox SL60W', sku: 'LIT-002', category: '灯光设备', status: 'available', hourly_rate: 25 },
  { id: '6', name: 'Manfrotto 三脚架', sku: 'TRIPOD-001', category: '三脚架', status: 'maintenance', hourly_rate: 15 },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: 'bg-green-100 text-green-700' },
  rented: { label: '已出租', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
  damaged: { label: '损坏', color: 'bg-red-100 text-red-700' },
  lost: { label: '丢失', color: 'bg-gray-100 text-gray-700' },
}

export default function AdminEquipmentPage() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">器材管理</h1>
            <p className="text-gray-500 mt-1">管理所有器材库存</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
            <Plus size={18} />
            添加器材
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索器材名称、SKU"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">器材名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时租价格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-800">{eq.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{eq.sku}</td>
                    <td className="px-6 py-4 text-gray-600">{eq.category}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">¥{eq.hourly_rate}/h</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[eq.status]?.color}`}>
                        {statusConfig[eq.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
