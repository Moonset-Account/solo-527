import { useState } from 'react';
import useSWR from 'swr';
import Layout from '@/components/Layout';
import { Plus, Search, Star, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const categories = [
  { value: '', label: '全部' },
  { value: '场地', label: '场地' },
  { value: '花艺', label: '花艺' },
  { value: '摄影', label: '摄影' },
  { value: '餐饮', label: '餐饮' },
];

export default function SuppliersPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { data: suppliers, mutate } = useSWR(
    `/api/suppliers${category ? `?category=${category}` : ''}${search ? `&search=${search}` : ''}`
  );

  const supplierList = suppliers?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
            <p className="text-gray-500 mt-1">管理婚礼服务供应商</p>
          </div>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            添加供应商
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="搜索供应商名称或联系人..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierList.map((supplier: any) => (
            <div key={supplier.id} className="card hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {supplier.category}
                    </span>
                  </div>
                  {supplier.rating && (
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-medium">{supplier.rating}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  {supplier.contactName && (
                    <div className="flex items-center">
                      <span className="w-16 flex-shrink-0">联系人:</span>
                      <span>{supplier.contactName}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {supplier.services && supplier.services.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">服务项目</p>
                    <div className="space-y-1">
                      {supplier.services.slice(0, 3).map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{service.name}</span>
                          <span className="text-primary-600 font-medium">
                            {formatCurrency(service.basePrice)}
                            {service.unit && <span className="text-gray-400 text-xs ml-1">/{service.unit}</span>}
                          </span>
                        </div>
                      ))}
                      {supplier.services.length > 3 && (
                        <p className="text-xs text-gray-400">还有 {supplier.services.length - 3} 项服务...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {supplierList.length === 0 && (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到供应商</h3>
            <p className="text-gray-500">尝试调整搜索条件或添加新的供应商</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
