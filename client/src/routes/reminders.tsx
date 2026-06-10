import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Reminder {
  id: number;
  leaseEndDate: string;
  reminderDate: string;
  type: string;
  processed: boolean;
  note: string;
  createdAt: string;
  apartment: { id: number; apartmentNo: string; building: string; status: string };
  processedBy: { name: string };
}

export const Route = createFileRoute()({
  component: RemindersPage,
});

function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [processFormData, setProcessFormData] = useState({
    note: '',
    action: 'renew' as 'renew' | 'relet' | 'maintenance' | 'other',
    createTodo: false,
    todoTitle: '',
    todoAssigneeId: 0,
  });
  const { user } = useAuthStore();

  const fetchReminders = () => {
    setLoading(true);
    apiClient
      .get('/reminders', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setReminders(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    apiClient.get('/users').then((res) => {
      setUsers(res.data.list || res.data);
    });
  };

  useEffect(() => {
    fetchReminders();
  }, [page, pageSize, filters]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleGenerate = () => {
    if (confirm('确定要生成空置提醒吗？系统将自动检查30天内到期的租约并生成提醒。')) {
      apiClient.post('/reminders/generate').then((res) => {
        alert(`成功生成 ${res.data.generated} 条空置提醒`);
        fetchReminders();
      });
    }
  };

  const handleProcess = () => {
    if (selectedReminder) {
      const data = {
        ...processFormData,
        todoAssigneeId: processFormData.todoAssigneeId || undefined,
        todoTitle: processFormData.createTodo ? processFormData.todoTitle : undefined,
      };
      apiClient.post(`/reminders/${selectedReminder.id}/process`, data).then(() => {
        setProcessModalOpen(false);
        fetchReminders();
      });
    }
  };

  const openProcessModal = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setProcessFormData({
      note: '',
      action: 'renew',
      createTodo: false,
      todoTitle: '',
      todoAssigneeId: 0,
    });
    setProcessModalOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      upcoming: '即将到期',
      overdue: '已逾期',
      manual: '手动创建',
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      manual: 'bg-blue-100 text-blue-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'apartment',
      title: '房源',
      render: (r: Reminder) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
    },
    {
      key: 'leaseEndDate',
      title: '租约到期日',
      render: (r: Reminder) => dayjs(r.leaseEndDate).format('YYYY-MM-DD'),
    },
    {
      key: 'reminderDate',
      title: '提醒日期',
      render: (r: Reminder) => dayjs(r.reminderDate).format('YYYY-MM-DD'),
    },
    {
      key: 'type',
      title: '类型',
      render: (r: Reminder) => (
        <span className={`px-2 py-1 rounded text-xs ${getTypeColor(r.type)}`}>
          {getTypeLabel(r.type)}
        </span>
      ),
    },
    {
      key: 'processed',
      title: '状态',
      render: (r: Reminder) => (
        <span className={`px-2 py-1 rounded text-xs ${r.processed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {r.processed ? '已处理' : '待处理'}
        </span>
      ),
    },
    {
      key: 'daysLeft',
      title: '剩余天数',
      render: (r: Reminder) => {
        const days = dayjs(r.leaseEndDate).diff(dayjs(), 'day');
        if (days < 0) {
          return <span className="text-red-600">已逾期 {Math.abs(days)} 天</span>;
        } else if (days <= 7) {
          return <span className="text-orange-600">{days} 天</span>;
        }
        return <span className="text-gray-600">{days} 天</span>;
      },
    },
    {
      key: 'processedBy',
      title: '处理人',
      render: (r: Reminder) => r.processedBy?.name || '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">空置提醒</h1>
        {user?.role === 'admin' && (
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔔 生成空置提醒
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">待处理提醒</div>
          <div className="text-2xl font-bold text-red-600">
            {reminders.filter((r) => !r.processed).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">7天内到期</div>
          <div className="text-2xl font-bold text-orange-600">
            {reminders.filter((r) => dayjs(r.leaseEndDate).diff(dayjs(), 'day') <= 7 && dayjs(r.leaseEndDate).diff(dayjs(), 'day') > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已逾期</div>
          <div className="text-2xl font-bold text-red-600">
            {reminders.filter((r) => dayjs(r.leaseEndDate).diff(dayjs(), 'day') < 0).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已处理</div>
          <div className="text-2xl font-bold text-green-600">
            {reminders.filter((r) => r.processed).length}
          </div>
        </div>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        showDateRange={true}
        extraFilters={
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">处理状态</label>
              <select
                value={(filters.processed as string) || ''}
                onChange={(e) => setFilters({ ...filters, processed: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                <option value="false">待处理</option>
                <option value="true">已处理</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">提醒类型</label>
              <select
                value={(filters.type as string) || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                <option value="upcoming">即将到期</option>
                <option value="overdue">已逾期</option>
              </select>
            </div>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={reminders}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        rowClassName={(r) => {
          if (!r.processed && dayjs(r.leaseEndDate).diff(dayjs(), 'day') < 0) {
            return 'bg-red-50';
          }
          if (!r.processed && dayjs(r.leaseEndDate).diff(dayjs(), 'day') <= 7) {
            return 'bg-orange-50';
          }
          return '';
        }}
        actions={(r) =>
          !r.processed && (
            <button
              onClick={() => openProcessModal(r)}
              className="text-blue-600 hover:text-blue-800"
            >
              处理
            </button>
          )
        }
      />

      <Modal
        open={processModalOpen}
        title="处理空置提醒"
        onClose={() => setProcessModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setProcessModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              确认处理
            </button>
          </>
        }
      >
        {selectedReminder && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                房源: <span className="font-medium">{selectedReminder.apartment?.building} {selectedReminder.apartment?.apartmentNo}</span>
                {' | '}租约到期日: <span className="font-medium">{dayjs(selectedReminder.leaseEndDate).format('YYYY-MM-DD')}</span>
                {' | '}剩余: <span className="font-medium">{dayjs(selectedReminder.leaseEndDate).diff(dayjs(), 'day')} 天</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理方式</label>
                <select
                  value={processFormData.action}
                  onChange={(e) => setProcessFormData({ ...processFormData, action: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="renew">客户续租</option>
                  <option value="relet">重新招租</option>
                  <option value="maintenance">维修整理</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
                <textarea
                  value={processFormData.note}
                  onChange={(e) => setProcessFormData({ ...processFormData, note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="请填写处理说明..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createTodo"
                  checked={processFormData.createTodo}
                  onChange={(e) => setProcessFormData({ ...processFormData, createTodo: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="createTodo" className="text-sm text-gray-700">
                  创建跟进待办
                </label>
              </div>
              {processFormData.createTodo && (
                <div className="pl-6 space-y-4 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">待办标题 *</label>
                    <input
                      type="text"
                      value={processFormData.todoTitle}
                      onChange={(e) => setProcessFormData({ ...processFormData, todoTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="待办事项标题"
                      required={processFormData.createTodo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">指派给</label>
                    <select
                      value={processFormData.todoAssigneeId}
                      onChange={(e) => setProcessFormData({ ...processFormData, todoAssigneeId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value={0}>不指派（自己处理）</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
