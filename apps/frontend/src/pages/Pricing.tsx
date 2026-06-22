import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth';

interface PricingRule {
  id: number;
  name: string;
  type: string;
  price: string;
  duration?: number;
  description?: string;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
}

export function PricingPage() {
  const { user } = useAuthStore();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    type: '',
    isActive: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ticket',
    price: '',
    duration: '',
    description: '',
    isActive: true,
    validFrom: '',
    validTo: '',
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.type) params.type = filters.type;
      if (filters.isActive !== '') params.isActive = filters.isActive;

      const res = await api.get('/pricing', { params });
      setRules(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch pricing error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [page, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleAdd = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      type: 'ticket',
      price: '',
      duration: '',
      description: '',
      isActive: true,
      validFrom: '',
      validTo: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      price: rule.price,
      duration: rule.duration?.toString() || '',
      description: rule.description || '',
      isActive: rule.isActive,
      validFrom: rule.validFrom?.toString().split('T')[0] || '',
      validTo: rule.validTo?.toString().split('T')[0] || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: formData.name,
        type: formData.type,
        price: formData.price,
        description: formData.description,
        isActive: formData.isActive,
      };
      if (formData.duration) payload.duration = parseInt(formData.duration);
      if (formData.validFrom) payload.validFrom = formData.validFrom;
      if (formData.validTo) payload.validTo = formData.validTo;

      if (editingRule) {
        await api.put(`/pricing/${editingRule.id}`, payload);
      } else {
        await api.post('/pricing', payload);
      }
      setModalOpen(false);
      fetchRules();
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个价格规则吗？')) return;
    try {
      await api.delete(`/pricing/${id}`);
      fetchRules();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const typeLabels: Record<string, string> = {
    ticket: '门票',
    membership: '会员',
    course: '课程',
  };

  const columns = [
    { key: 'name', title: '名称', dataIndex: 'name' as keyof PricingRule },
    { key: 'type', title: '类型', dataIndex: 'type' as keyof PricingRule, width: '100px',
      render: (value: string) => typeLabels[value] || value },
    { key: 'price', title: '价格', dataIndex: 'price' as keyof PricingRule, width: '100px',
      render: (value: string) => `¥${value}` },
    { key: 'duration', title: '时长/有效期', dataIndex: 'duration' as keyof PricingRule, width: '100px',
      render: (value?: number) => value ? `${value}分钟/天` : '-' },
    { key: 'isActive', title: '状态', dataIndex: 'isActive' as keyof PricingRule, width: '80px',
      render: (value: boolean) => (
        <span className={`text-xs px-2 py-1 rounded-full ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {value ? '启用' : '停用'}
        </span>
      ) },
    { key: 'createdAt', title: '创建时间', dataIndex: 'createdAt' as keyof PricingRule, width: '160px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '' },
    { key: 'actions', title: '操作', dataIndex: 'id' as keyof PricingRule, width: '120px',
      render: (_: any, record: PricingRule) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
            className="text-primary-500 hover:text-primary-700 text-sm">编辑</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
            className="text-red-500 hover:text-red-700 text-sm">删除</button>
        </div>
      ) },
  ];

  const canEdit = user?.role === 'admin' || user?.role === 'coach_supervisor';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">价格规则</h2>
        {canEdit && (
          <button onClick={handleAdd}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm">
            + 新增规则
          </button>
        )}
      </div>

      <FilterBar module="pricing" filters={filters} onFilterChange={handleFilterChange} onSearch={() => {}}>
        <select value={filters.type || ''}
          onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部类型</option>
          <option value="ticket">门票</option>
          <option value="membership">会员</option>
          <option value="course">课程</option>
        </select>

        <select value={filters.isActive === '' ? '' : filters.isActive.toString()}
          onChange={(e) => handleFilterChange({ ...filters, isActive: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>

        <button onClick={() => handleFilterChange({ type: '', isActive: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
      </FilterBar>

      <DataTable columns={columns} data={rules} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }} />

      <Modal title={editingRule ? '编辑价格规则' : '新增价格规则'} open={modalOpen}
        onClose={() => setModalOpen(false)} onConfirm={handleSave} confirmText="保存" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="ticket">门票</option>
                <option value="membership">会员</option>
                <option value="course">课程</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格 (元)</label>
              <input type="text" value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="如 50.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时长/有效期</label>
              <input type="number" value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="分钟/天" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生效日期</label>
              <input type="date" value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">失效日期</label>
              <input type="date" value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded" />
            <label htmlFor="isActive" className="text-sm text-gray-700">启用</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
