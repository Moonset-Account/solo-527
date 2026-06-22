import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth';

interface Event {
  id: number;
  name: string;
  description?: string;
  originalDate: string;
  currentDate: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  participants?: number;
  status: string;
  rescheduleReason?: string;
  closedAt?: string;
  createdAt: string;
}

export function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'reschedule' | 'close'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    originalDate: '',
    currentDate: '',
    startTime: '09:00',
    endTime: '17:00',
    location: '主泳池',
    organizer: '',
    participants: '0',
    newDate: '',
    reason: '',
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/events', { params });
      setEvents(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch events error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
    setModalType('create');
    setSelectedEvent(null);
    setFormData({
      name: '',
      description: '',
      originalDate: '',
      currentDate: '',
      startTime: '09:00',
      endTime: '17:00',
      location: '主泳池',
      organizer: '',
      participants: '0',
      newDate: '',
      reason: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setModalType('edit');
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      originalDate: event.originalDate.toString().split('T')[0],
      currentDate: event.currentDate.toString().split('T')[0],
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      organizer: event.organizer || '',
      participants: event.participants?.toString() || '0',
      newDate: '',
      reason: '',
    });
    setModalOpen(true);
  };

  const handleReschedule = (event: Event) => {
    setModalType('reschedule');
    setSelectedEvent(event);
    setFormData({ ...formData, newDate: '', reason: '' });
    setModalOpen(true);
  };

  const handleClose = (event: Event) => {
    setModalType('close');
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === 'create' || modalType === 'edit') {
        const payload = {
          name: formData.name,
          description: formData.description,
          originalDate: formData.originalDate,
          currentDate: formData.currentDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          organizer: formData.organizer,
          participants: parseInt(formData.participants),
        };

        if (modalType === 'create') {
          await api.post('/events', payload);
        } else if (selectedEvent) {
          await api.put(`/events/${selectedEvent.id}`, payload);
        }
      } else if (modalType === 'reschedule' && selectedEvent) {
        await api.post(`/events/${selectedEvent.id}/reschedule`, {
          newDate: formData.newDate,
          reason: formData.reason,
        });
      } else if (modalType === 'close' && selectedEvent) {
        await api.post(`/events/${selectedEvent.id}/close`);
      }

      setModalOpen(false);
      fetchEvents();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个赛事吗？')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canClose = user?.role === 'manager';

  const columns = [
    { key: 'name', title: '赛事名称', dataIndex: 'name' as keyof Event },
    { key: 'date', title: '日期', dataIndex: 'currentDate' as keyof Event, width: '120px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd') : '' },
    { key: 'time', title: '时间', dataIndex: 'startTime' as keyof Event, width: '120px',
      render: (_: any, record: Event) => `${record.startTime} - ${record.endTime}` },
    { key: 'location', title: '地点', dataIndex: 'location' as keyof Event, width: '120px' },
    { key: 'organizer', title: '主办方', dataIndex: 'organizer' as keyof Event, width: '100px' },
    { key: 'participants', title: '参与人数', dataIndex: 'participants' as keyof Event, width: '90px' },
    { key: 'status', title: '状态', dataIndex: 'status' as keyof Event, width: '90px',
      render: (value: string) => <StatusBadge status={value} /> },
    { key: 'actions', title: '操作', dataIndex: 'id' as keyof Event, width: '220px',
      render: (_: any, record: Event) => (
        <div className="flex gap-2 flex-wrap">
          {canManage && (
            <button onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
              className="text-primary-500 hover:text-primary-700 text-sm">编辑</button>
          )}
          {canManage && record.status !== 'closed' && (
            <button onClick={(e) => { e.stopPropagation(); handleReschedule(record); }}
              className="text-purple-500 hover:text-purple-700 text-sm">改期</button>
          )}
          {canClose && record.status !== 'closed' && (
            <button onClick={(e) => { e.stopPropagation(); handleClose(record); }}
              className="text-green-500 hover:text-green-700 text-sm">关闭</button>
          )}
          {canManage && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
              className="text-red-500 hover:text-red-700 text-sm">删除</button>
          )}
        </div>
      ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">赛事管理</h2>
        {canManage && (
          <button onClick={handleAdd}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm">
            + 新增赛事
          </button>
        )}
      </div>

      <FilterBar module="events" filters={filters} onFilterChange={handleFilterChange} onSearch={handleSearch}>
        <select value={filters.status || ''}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部状态</option>
          <option value="scheduled">已排期</option>
          <option value="rescheduled">已改期</option>
          <option value="completed">已完成</option>
          <option value="closed">已关闭</option>
          <option value="cancelled">已取消</option>
        </select>

        <input type="date" value={filters.startDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input type="date" value={filters.endDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />

        <button onClick={() => handleFilterChange({ status: '', startDate: '', endDate: '', search: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
      </FilterBar>

      <DataTable columns={columns} data={events} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }} />

      <Modal
        title={
          modalType === 'create' ? '新增赛事' :
          modalType === 'edit' ? '编辑赛事' :
          modalType === 'reschedule' ? '赛事改期' : '关闭赛事'
        }
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        confirmText={modalType === 'close' ? '确认关闭' : '保存'}
        width="max-w-xl"
      >
        {(modalType === 'create' || modalType === 'edit') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">赛事名称</label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原定日期</label>
                <input type="date" value={formData.originalDate}
                  onChange={(e) => setFormData({ ...formData, originalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前日期</label>
                <input type="date" value={formData.currentDate}
                  onChange={(e) => setFormData({ ...formData, currentDate: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                <input type="text" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主办方</label>
                <input type="text" value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预计参与人数</label>
              <input type="number" value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
            </div>
          </div>
        )}

        {modalType === 'reschedule' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新日期</label>
              <input type="date" value={formData.newDate}
                onChange={(e) => setFormData({ ...formData, newDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">改期原因</label>
              <textarea value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3}
                placeholder="请说明改期原因..." />
            </div>
          </div>
        )}

        {modalType === 'close' && (
          <div className="py-4">
            <p className="text-gray-600">
              确定要关闭赛事 "{selectedEvent?.name}" 吗？关闭后将更新场地利用报表。
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
