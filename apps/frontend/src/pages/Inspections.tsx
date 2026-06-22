import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { format } from 'date-fns';

interface InspectionRecord {
  id: number;
  deviceId: number;
  deviceName: string;
  deviceCode: string;
  inspectorId: number;
  inspectorName: string;
  inspectionDate: string;
  status: string;
  description?: string;
  temperature?: string;
  phValue?: string;
  chlorineLevel?: string;
}

interface Device {
  id: number;
  name: string;
  code: string;
}

export function InspectionsPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    search: '',
    status: '',
    deviceId: '',
    startDate: '',
    endDate: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    status: 'normal',
    description: '',
    temperature: '',
    phValue: '',
    chlorineLevel: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.deviceId) params.deviceId = filters.deviceId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/inspections', { params });
      setRecords(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch inspections error:', e);
    } finally {
      setLoading(false);
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
    fetchRecords();
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
    setFormData({
      deviceId: '',
      status: 'normal',
      description: '',
      temperature: '',
      phValue: '',
      chlorineLevel: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.post('/inspections', {
        ...formData,
        deviceId: parseInt(formData.deviceId),
      });
      setModalOpen(false);
      fetchRecords();
    } catch (e: any) {
      alert(e.response?.data?.error || '提交失败');
    }
  };

  const columns = [
    { key: 'id', title: 'ID', dataIndex: 'id' as keyof InspectionRecord, width: '60px' },
    { key: 'deviceCode', title: '设备编号', dataIndex: 'deviceCode' as keyof InspectionRecord, width: '120px' },
    { key: 'deviceName', title: '设备名称', dataIndex: 'deviceName' as keyof InspectionRecord },
    { key: 'inspectorName', title: '巡检人', dataIndex: 'inspectorName' as keyof InspectionRecord, width: '100px' },
    {
      key: 'inspectionDate',
      title: '巡检时间',
      dataIndex: 'inspectionDate' as keyof InspectionRecord,
      width: '160px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '',
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof InspectionRecord,
      width: '100px',
      render: (value: string) => (
        <StatusBadge status={value} customLabel={value === 'normal' ? '正常' : '异常'} />
      ),
    },
    { key: 'description', title: '描述', dataIndex: 'description' as keyof InspectionRecord },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">巡检记录</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 text-sm"
        >
          + 提交巡检
        </button>
      </div>

      <FilterBar
        module="inspections"
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
          <option value="normal">正常</option>
          <option value="abnormal">异常</option>
        </select>

        <select
          value={filters.deviceId || ''}
          onChange={(e) => handleFilterChange({ ...filters, deviceId: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">全部设备</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="开始日期"
        />
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="结束日期"
        />

        <button
          onClick={() =>
            handleFilterChange({ search: '', status: '', deviceId: '', startDate: '', endDate: '' })
          }
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          重置
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
        }}
      />

      <Modal
        title="提交巡检记录"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        confirmText="提交"
      >
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
            <label className="block text-sm font-medium text-gray-700 mb-1">巡检状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="normal">正常</option>
              <option value="abnormal">异常</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
              <input
                type="text"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="如 26.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH 值</label>
              <input
                type="text"
                value={formData.phValue}
                onChange={(e) => setFormData({ ...formData, phValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="如 7.4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">余氯 (mg/L)</label>
              <input
                type="text"
                value={formData.chlorineLevel}
                onChange={(e) => setFormData({ ...formData, chlorineLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="如 0.5"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="请输入巡检描述..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
