'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { Users, Search, Plus } from 'lucide-react'

const mockClients = [
  { id: '1', name: '张三', company: '', type: 'individual', phone: '138****1234', email: 'zhangsan@example.com', total_bookings: 5, total_spent: 12500 },
  { id: '2', name: '李四公司', company: '李四文化传媒有限公司', type: 'corporate', phone: '139****5678', email: 'lisi@example.com', total_bookings: 12, total_spent: 85000 },
  { id: '3', name: '王五公司', company: '王五广告制作有限公司', type: 'corporate', phone: '137****9012', email: 'wangwu@example.com', total_bookings: 8, total_spent: 45000 },
  { id: '4', name: '赵六', company: '', type: 'individual', phone: '136****3456', email: 'zhaoliu@example.com', total_bookings: 3, total_spent: 8500 },
]

export default function AdminClientsPage() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
            <p className="text-gray-500 mt-1">管理客户信息和历史</p>
          </div>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
            <Plus size={18} />
            添加客户
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索客户名称、电话、邮箱"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系电话</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">累计订单</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">累计消费</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">{client.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{client.name}</div>
                          {client.company && (
                            <div className="text-xs text-gray-500">{client.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.type === 'corporate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {client.type === 'corporate' ? '企业' : '个人'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{client.phone}</td>
                    <td className="px-6 py-4 text-gray-800">{client.total_bookings} 单</td>
                    <td className="px-6 py-4 font-medium text-gray-800">¥{client.total_spent.toLocaleString()}</td>
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
