import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth';

interface Schedule {
  id: number;
  coachId: number;
  coachName: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  courseType?: string;
  maxStudents?: number;
  status: string;
  notes?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export function SchedulesPage() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    coachId: '',
    status: '',
    courseType: '',
    startDate: '',
    endDate: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    coachId: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    courseType: '',
    maxStudents: '10',
    status: 'scheduled',
    notes: '',
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.coachId) params.coachId = filters.coachId;
      if (filters.status) params.status = filters.status;
      if (filters.courseType) params.courseType = filters.courseType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/schedules', { params });
      setSchedules(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch schedules error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const res = await api.get('/auth/users');
      setCoaches(res.data.filter((u: any) => u.role === 'coach_supervisor'));
    } catch (e) {
      console.error('Fetch coaches error:', e);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCoaches();
  }, [page, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setFormData({
      coachId: user?.role === 'coach_supervisor' ? user.id.toString() : '',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      courseType: '',
      maxStudents: '10',
      status: 'scheduled',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      coachId: schedule.coachId.toString(),
      date: schedule.date.toString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location || '',
      courseType: schedule.courseType || '',
      maxStudents: schedule.maxStudents?.toString() || '10',
      status: schedule.status,
      notes: schedule.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        coachId: parseInt(formData.coachId),
        maxStudents: parseInt(formData.maxStudents),
      };

      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      setModalOpen(false);
      fetchSchedules();
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个排班吗？')) return;
    try {
      await api.delete(`/schedules/${id}`);
      fetchSchedules();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const columns = [
    { key: 'date', title: '日期', dataIndex: 'date' as keyof Schedule, width: '120px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd') : '' },
    { key: 'coachName', title: '教练', dataIndex: 'coachName' as keyof Schedule, width: '100px' },
    { key: 'time', title: '时间', dataIndex: 'startTime' as keyof Schedule, width: '120px',
      render: (_: any, record: Schedule) => `${record.startTime} - ${record.endTime}` },
    { key: 'courseType', title: '课程类型', dataIndex: 'courseType' as keyof Schedule, width: '120px' },
    { key: 'location', title: '地点', dataIndex: 'location' as keyof Schedule, width: '120px' },
    { key: 'maxStudents', title: '最大人数', dataIndex: 'maxStudents' as keyof Schedule, width: '80px' },
    { key: 'status', title: '状态', dataIndex: 'status' as keyof Schedule, width: '90px',
      render: (value: string) => <StatusBadge status={value} /> },
    { key: 'actions', title: '操作', dataIndex: 'id' as keyof Schedule, width: '120px',
      render: (_: any, record: Schedule) => (
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
        <h2 className="text-lg font-semibold">教练排班</h2>
        {canEdit && (
          <button onClick={handleAdd}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm">
            + 新增排班
          </button>
        )}
      </div>

      <FilterBar module="schedules" filters={filters} onFilterChange={handleFilterChange} onSearch={() => {}}>
        <select value={filters.coachId || ''}
          onChange={(e) => handleFilterChange({ ...filters, coachId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部教练</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={filters.status || ''}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部状态</option>
          <option value="scheduled">已排期</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>

        <input type="date" value={filters.startDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input type="date" value={filters.endDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />

        <button onClick={() => handleFilterChange({ coachId: '', status: '', courseType: '', startDate: '', endDate: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
      </FilterBar>

      <DataTable columns={columns} data={schedules} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }} />

      <Modal title={editingSchedule ? '编辑排班' : '新增排班'} open={modalOpen}
        onClose={() => setModalOpen(false)} onConfirm={handleSave} confirmText="保存">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教练</label>
              <select value={formData.coachId}
                onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">请选择</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input type="time" value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input type="time" value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">课程类型</label>
              <input type="text" value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="如：自由泳基础" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <input type="text" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="如：泳池1道" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大人数</label>
              <input type="number" value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="scheduled">已排期</option>
                <option value="completed">已完成</option>
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
