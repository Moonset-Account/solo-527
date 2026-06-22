import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';
import { useAuthStore } from '../store/auth';

interface RepairOrder {
  id: number;
  deviceId: number;
  deviceName: string;
  deviceCode: string;
  title: string;
  description?: string;
  priority: number;
  status: string;
  reporterId: number;
  reporterName: string;
  assigneeId?: number;
  assigneeName?: string;
  reportedAt: string;
  assignedAt?: string;
  completedAt?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface Device {
  id: number;
  name: string;
  code: string;
}

export function RepairsPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'assign' | 'update' | 'verify'>('create');
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    title: '',
    description: '',
    priority: '1',
    assigneeId: '',
    status: '',
    repairNotes: '',
    verificationNotes: '',
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;

      const res = await api.get('/repairs', { params });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch repairs error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices', { params: { limit: 100 } });
      setDevices(res.data.data);
    } catch (e) {
      console.error('Fetch devices error:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUsers();
    fetchDevices();
  }, [page, filters]);

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, search: keyword }));
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleCreate = () => {
    setModalType('create');
    setSelectedOrder(null);
    setFormData({
      deviceId: '',
      title: '',
      description: '',
      priority: '1',
      assigneeId: '',
      status: '',
      repairNotes: '',
      verificationNotes: '',
    });
    setModalOpen(true);
  };

  const handleAssign = (order: RepairOrder) => {
    setModalType('assign');
    setSelectedOrder(order);
    setFormData({ ...formData, assigneeId: order.assigneeId?.toString() || '' });
    setModalOpen(true);
  };

  const handleUpdateStatus = (order: RepairOrder, status: string) => {
    setModalType('update');
    setSelectedOrder(order);
    setFormData({ ...formData, status, repairNotes: '', verificationNotes: '' });
    setModalOpen(true);
  };

  const handleVerify = (order: RepairOrder) => {
    setModalType('verify');
    setSelectedOrder(order);
    setFormData({ ...formData, verificationNotes: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalType === 'create') {
        await api.post('/repairs', {
          deviceId: parseInt(formData.deviceId),
          title: formData.title,
          description: formData.description,
          priority: parseInt(formData.priority),
        });
      } else if (modalType === 'assign' && selectedOrder) {
        await api.put(`/repairs/${selectedOrder.id}/assign`, {
          assigneeId: parseInt(formData.assigneeId),
        });
      } else if (modalType === 'update' && selectedOrder) {
        await api.put(`/repairs/${selectedOrder.id}`, {
          status: formData.status,
          repairNotes: formData.repairNotes || undefined,
        });
      } else if (modalType === 'verify' && selectedOrder) {
        await api.put(`/repairs/${selectedOrder.id}`, {
          status: 'verified',
          verificationNotes: formData.verificationNotes || undefined,
        });
      }
      setModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'staff';
  const canAssign = user?.role === 'admin';
  const canVerify = user?.role === 'admin';

  const columns = [
    { key: 'id', title: '工单号', dataIndex: 'id' as keyof RepairOrder, width: '70px' },
    { key: 'deviceName', title: '设备名称', dataIndex: 'deviceName' as keyof RepairOrder, width: '140px' },
    { key: 'title', title: '标题', dataIndex: 'title' as keyof RepairOrder },
    {
      key: 'priority',
      title: '优先级',
      dataIndex: 'priority' as keyof RepairOrder,
      width: '70px',
      render: (value: number) => (
        <span className={`text-xs px-2 py-1 rounded ${value >= 3 ? 'bg-red-100 text-red-700' : value >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
          P{value}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof RepairOrder,
      width: '90px',
      render: (value: string) => <StatusBadge status={value} />,
    },
    { key: 'reporterName', title: '上报人', dataIndex: 'reporterName' as keyof RepairOrder, width: '80px' },
    { key: 'assigneeName', title: '处理人', dataIndex: 'assigneeName' as keyof RepairOrder, width: '80px' },
    {
      key: 'reportedAt',
      title: '上报时间',
      dataIndex: 'reportedAt' as keyof RepairOrder,
      width: '150px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '',
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as keyof RepairOrder,
      width: '200px',
      render: (_: any, record: RepairOrder) => (
        <div className="flex gap-2 flex-wrap">
          {canAssign && record.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssign(record);
              }}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              指派
            </button>
          )}
          {record.status === 'assigned' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(record, 'in_progress');
              }}
              className="text-purple-500 hover:text-purple-700 text-sm"
            >
              开始
            </button>
          )}
          {record.status === 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(record, 'completed');
              }}
              className="text-green-500 hover:text-green-700 text-sm"
            >
              完成
            </button>
          )}
          {canVerify && record.status === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVerify(record);
              }}
              className="text-teal-500 hover:text-teal-700 text-sm"
            >
              复核
            </button>
          )}
          {canVerify && record.status === 'verified' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(record, 'closed');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              关闭
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">维修工单</h2>
        {canManage && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm"
          >
            + 新建工单
          </button>
        )}
      </div>

      <FilterBar
        module="repairs"
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      >
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="assigned">已指派</option>
          <option value="in_progress">处理中</option>
          <option value="completed">已完成</option>
          <option value="verified">已复核</option>
          <option value="closed">已关闭</option>
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => handleFilterChange({ ...filters, priority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部优先级</option>
          <option value="1">P1 低</option>
          <option value="2">P2 中</option>
          <option value="3">P3 高</option>
        </select>

        <select
          value={filters.assigneeId || ''}
          onChange={(e) => handleFilterChange({ ...filters, assigneeId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部处理人</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => handleFilterChange({ search: '', status: '', priority: '', assigneeId: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重置
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
        }}
      />

      <Modal
        title={
          modalType === 'create'
            ? '新建维修工单'
            : modalType === 'assign'
            ? '指派维修'
            : modalType === 'verify'
            ? '复核维修'
            : '更新状态'
        }
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        confirmText="确认"
      >
        {modalType === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择设备</label>
              <select
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择设备</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="请输入故障标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="1">P1 低</option>
                <option value="2">P2 中</option>
                <option value="3">P3 高</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">故障描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="请详细描述故障情况..."
              />
            </div>
          </div>
        )}

        {modalType === 'assign' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">指派给</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择处理人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {modalType === 'update' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修备注</label>
              <textarea
                value={formData.repairNotes}
                onChange={(e) => setFormData({ ...formData, repairNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="请输入维修进展或说明..."
              />
            </div>
          </div>
        )}

        {modalType === 'verify' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">复核意见</label>
              <textarea
                value={formData.verificationNotes}
                onChange={(e) => setFormData({ ...formData, verificationNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="请输入复核意见..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
