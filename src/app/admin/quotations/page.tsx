'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { FileText, Plus } from 'lucide-react'

const mockQuotations = [
  { id: '1', quotation_no: 'QT202401150001', client: '张三', status: 'draft', total_amount: 2500, valid_until: '2024-01-22', created_at: '2024-01-15T10:00:00' },
  { id: '2', quotation_no: 'QT202401140001', client: '李四公司', status: 'sent', total_amount: 8500, valid_until: '2024-01-21', created_at: '2024-01-14T14:30:00' },
  { id: '3', quotation_no: 'QT202401120001', client: '王五公司', status: 'accepted', total_amount: 12000, valid_until: '2024-01-19', created_at: '2024-01-12T09:15:00' },
  { id: '4', quotation_no: 'QT202401100001', client: '赵六', status: 'rejected', total_amount: 3000, valid_until: '2024-01-17', created_at: '2024-01-10T16:20:00' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: '已接受', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-500' },
}

export default function AdminQuotationsPage() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">报价单管理</h1>
            <p className="text-gray-500 mt-1">管理客户报价单</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
            <Plus size={18} />
            新建报价单
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">报价单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期至</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockQuotations.map((qt) => (
                  <tr key={qt.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 font-medium text-primary-600">{qt.quotation_no}</td>
                    <td className="px-6 py-4 text-gray-800">{qt.client}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">¥{qt.total_amount}</td>
                    <td className="px-6 py-4 text-gray-500">{qt.valid_until}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[qt.status]?.color}`}>
                        {statusConfig[qt.status]?.label}
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
