import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuthStore } from '../store/auth';

interface Device {
  id: number;
  name: string;
  code: string;
  category: string;
  location: string;
  status: string;
  description?: string;
  purchaseDate?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
}

export function DevicesPage() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    category: '',
    status: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    location: '',
    status: 'normal',
    description: '',
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const res = await api.get('/devices', { params });
      setDevices(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch devices error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      code: '',
      category: '',
      location: '',
      status: 'normal',
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      code: device.code,
      category: device.category,
      location: device.location,
      status: device.status,
      description: device.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingDevice) {
        await api.put(`/devices/${editingDevice.id}`, formData);
      } else {
        await api.post('/devices', formData);
      }
      setModalOpen(false);
      fetchDevices();
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个设备吗？')) return;
    try {
      await api.delete(`/devices/${id}`);
      fetchDevices();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const columns = [
    { key: 'code', title: '设备编号', dataIndex: 'code' as keyof Device, width: '120px' },
    { key: 'name', title: '设备名称', dataIndex: 'name' as keyof Device },
    { key: 'category', title: '类别', dataIndex: 'category' as keyof Device, width: '120px' },
    { key: 'location', title: '位置', dataIndex: 'location' as keyof Device, width: '150px' },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof Device,
      width: '100px',
      render: (value: string) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id' as keyof Device,
      width: '150px',
      render: (_: any, record: Device) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            className="text-primary-500 hover:text-primary-700 text-sm"
          >
            编辑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record.id);
            }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  const canEdit = user?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">设备管理</h2>
        {canEdit && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm"
          >
            + 新增设备
          </button>
        )}
      </div>

      <FilterBar
        module="devices"
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      >
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部类别</option>
          <option value="水循环系统">水循环系统</option>
          <option value="消毒系统">消毒系统</option>
          <option value="水质监测">水质监测</option>
          <option value="加热系统">加热系统</option>
          <option value="通风系统">通风系统</option>
          <option value="安全设备">安全设备</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部状态</option>
          <option value="normal">正常</option>
          <option value="warning">预警</option>
          <option value="fault">故障</option>
          <option value="maintenance">维护中</option>
        </select>

        <button
          onClick={() => handleFilterChange({ search: '', category: '', status: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重置
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        data={devices}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
        }}
      />

      <Modal
        title={editingDevice ? '编辑设备' : '新增设备'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        confirmText="保存"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备编号</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">请选择</option>
                <option value="水循环系统">水循环系统</option>
                <option value="消毒系统">消毒系统</option>
                <option value="水质监测">水质监测</option>
                <option value="加热系统">加热系统</option>
                <option value="通风系统">通风系统</option>
                <option value="安全设备">安全设备</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="normal">正常</option>
                <option value="warning">预警</option>
                <option value="fault">故障</option>
                <option value="maintenance">维护中</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
