import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Search, Star, Phone, Mail, MapPin, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const categories = [
  { value: '', label: '全部' },
  { value: '场地', label: '场地' },
  { value: '花艺', label: '花艺' },
  { value: '摄影', label: '摄影' },
  { value: '餐饮', label: '餐饮' },
];

interface SupplierFormData {
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
}

export default function SuppliersPage() {
  const { data: session } = useSession();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    category: '场地',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    rating: 0,
  });

  const { data: suppliers, isLoading } = useSWR('/api/suppliers');

  const supplierList = suppliers?.data?.items || [];
  
  const filteredSuppliers = supplierList.filter((s: any) => {
    const matchCategory = !category || s.category === category;
    const matchSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const canCreate = session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER';

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        mutate('/api/suppliers');
        setShowCreateModal(false);
        setFormData({
          name: '',
          category: '场地',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          rating: 0,
        });
      }
    } catch (e) {
      console.error('创建供应商失败', e);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
            <p className="text-gray-500 mt-1">管理婚礼服务供应商</p>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加供应商
            </button>
          )}
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier: any) => (
              <div key={supplier.id} className="card hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {supplier.category}
                      </span>
                    </div>
                    {supplier.rating && supplier.rating > 0 && (
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
        )}

        {!isLoading && filteredSuppliers.length === 0 && (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到供应商</h3>
            <p className="text-gray-500">尝试调整搜索条件或添加新的供应商</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="添加供应商"
        size="lg"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                供应商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="input"
                placeholder="如：浪漫海岸婚礼会所"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务类别 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="input"
                required
              >
                <option value="场地">场地</option>
                <option value="花艺">花艺</option>
                <option value="摄影">摄影</option>
                <option value="餐饮">餐饮</option>
                <option value="婚纱">婚纱</option>
                <option value="司仪">司仪</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系人
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleFormChange}
                className="input"
                placeholder="联系人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="input"
                placeholder="联系电话"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              className="input"
              placeholder="邮箱地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地址
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              className="input min-h-[60px]"
              placeholder="详细地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              评分 (0-5)
            </label>
            <input
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleFormChange}
              className="input"
              min="0"
              max="5"
              step="0.5"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建供应商
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
