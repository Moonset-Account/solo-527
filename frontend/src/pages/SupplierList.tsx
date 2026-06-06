import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Star, Hotel, Car, Ticket, User } from 'lucide-react';
import { Layout } from '../components/Layout';
import { supplierApi } from '../services/api';
import { Supplier, SupplierType } from '../types';
import { formatDateTime } from '../utils/format';

const typeOptions: { value: SupplierType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'hotel', label: '酒店', icon: Hotel },
  { value: 'vehicle', label: '车辆', icon: Car },
  { value: 'ticket', label: '门票', icon: Ticket },
  { value: 'guide', label: '导游', icon: User },
];

export const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    keyword: '',
    status: '',
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await supplierApi.findAll(filters);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此供应商吗？')) {
      await supplierApi.remove(id);
      fetchSuppliers();
    }
  };

  const getTypeIcon = (type: SupplierType) => {
    const option = typeOptions.find((o) => o.value === type);
    return option ? option.icon : Hotel;
  };

  const getTypeLabel = (type: SupplierType) => {
    const option = typeOptions.find((o) => o.value === type);
    return option ? option.label : type;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">供应商管理</h1>
            <p className="text-slate-500 mt-1">管理酒店、车辆、门票等供应商资源</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm">
            <Plus size={18} />
            新增供应商
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="搜索供应商名称..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">全部类型</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">全部状态</option>
              <option value="active">合作中</option>
              <option value="inactive">已停用</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              暂无供应商数据
            </div>
          ) : (
            suppliers.map((supplier) => {
              const TypeIcon = getTypeIcon(supplier.type);
              return (
                <div
                  key={supplier.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                        <TypeIcon size={24} className="text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{supplier.name}</div>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {getTypeLabel(supplier.type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= supplier.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={14} className="text-slate-400" />
                      <span>{supplier.contactPerson || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">📞</span>
                      <span>{supplier.contactPhone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">📍</span>
                      <span className="truncate">{supplier.address || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        supplier.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {supplier.status === 'active' ? '合作中' : '已停用'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};
