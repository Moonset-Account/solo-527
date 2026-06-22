import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth';

interface WaitlistEntry {
  id: number;
  customerName: string;
  phone: string;
  courseType?: string;
  preferredCoach?: string;
  preferredTime?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export function WaitlistPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    status: '',
    courseType: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    courseType: '',
    preferredCoach: '',
    preferredTime: '',
    status: 'waiting',
    notes: '',
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.courseType) params.courseType = filters.courseType;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/waitlist', { params });
      setEntries(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch waitlist error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, search: keyword }));
    setPage(1);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({
      customerName: '',
      phone: '',
      courseType: '',
      preferredCoach: '',
      preferredTime: '',
      status: 'waiting',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (entry: WaitlistEntry) => {
    setEditingEntry(entry);
    setFormData({
      customerName: entry.customerName,
      phone: entry.phone,
      courseType: entry.courseType || '',
      preferredCoach: entry.preferredCoach || '',
      preferredTime: entry.preferredTime || '',
      status: entry.status,
      notes: entry.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingEntry) {
        await api.put(`/waitlist/${editingEntry.id}`, formData);
      } else {
        await api.post('/waitlist', formData);
      }
      setModalOpen(false);
      fetchEntries();
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条候补记录吗？')) return;
    try {
      await api.delete(`/waitlist/${id}`);
      fetchEntries();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const columns = [
    { key: 'customerName', title: '客户姓名', dataIndex: 'customerName' as keyof WaitlistEntry, width: '100px' },
    { key: 'phone', title: '联系电话', dataIndex: 'phone' as keyof WaitlistEntry, width: '130px' },
    { key: 'courseType', title: '课程类型', dataIndex: 'courseType' as keyof WaitlistEntry, width: '120px' },
    { key: 'preferredCoach', title: '期望教练', dataIndex: 'preferredCoach' as keyof WaitlistEntry, width: '100px' },
    { key: 'preferredTime', title: '期望时间', dataIndex: 'preferredTime' as keyof WaitlistEntry, width: '120px' },
    { key: 'status', title: '状态', dataIndex: 'status' as keyof WaitlistEntry, width: '90px',
      render: (value: string) => <StatusBadge status={value} /> },
    { key: 'createdAt', title: '登记时间', dataIndex: 'createdAt' as keyof WaitlistEntry, width: '160px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '' },
    { key: 'actions', title: '操作', dataIndex: 'id' as keyof WaitlistEntry, width: '150px',
      render: (_: any, record: WaitlistEntry) => (
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
        <h2 className="text-lg font-semibold">候补名单</h2>
        {canEdit && (
          <button onClick={handleAdd}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm">
            + 新增候补
          </button>
        )}
      </div>

      <FilterBar module="waitlist" filters={filters} onFilterChange={handleFilterChange} onSearch={handleSearch}>
        <select value={filters.status || ''}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部状态</option>
          <option value="waiting">等待中</option>
          <option value="notified">已通知</option>
          <option value="enrolled">已报名</option>
          <option value="cancelled">已取消</option>
        </select>

        <select value={filters.courseType || ''}
          onChange={(e) => handleFilterChange({ ...filters, courseType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部课程</option>
          <option value="儿童游泳班">儿童游泳班</option>
          <option value="自由泳基础">自由泳基础</option>
          <option value="蛙泳提高">蛙泳提高</option>
          <option value="私教课">私教课</option>
        </select>

        <button onClick={() => handleFilterChange({ status: '', courseType: '', search: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
      </FilterBar>

      <DataTable columns={columns} data={entries} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }} />

      <Modal title={editingEntry ? '编辑候补' : '新增候补'} open={modalOpen}
        onClose={() => setModalOpen(false)} onConfirm={handleSave} confirmText="保存">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
              <input type="text" value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input type="text" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">课程类型</label>
              <input type="text" value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="如：私教课" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望教练</label>
              <input type="text" value={formData.preferredCoach}
                onChange={(e) => setFormData({ ...formData, preferredCoach: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期望时间</label>
              <input type="text" value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="如：周六上午" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="waiting">等待中</option>
                <option value="notified">已通知</option>
                <option value="enrolled">已报名</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
