import { useState, useEffect } from 'react';
import api from '../api';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { format } from 'date-fns';

interface LogEntry {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  module: string;
  targetId?: number;
  details?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<Record<string, any>>({
    module: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/logs', { params });
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch (e) {
      console.error('Fetch logs error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const actionLabels: Record<string, string> = {
    user_login: '用户登录',
    create_device: '创建设备',
    update_device: '更新设备',
    delete_device: '删除设备',
    create_inspection: '创建巡检',
    create_repair_order: '创建工单',
    assign_repair: '指派维修',
    update_repair_status: '更新维修状态',
    create_schedule: '创建排班',
    update_schedule: '更新排班',
    delete_schedule: '删除排班',
    create_pricing: '创建价格',
    update_pricing: '更新价格',
    delete_pricing: '删除价格',
    create_event: '创建赛事',
    update_event: '更新赛事',
    reschedule_event: '赛事改期',
    close_event: '关闭赛事',
    delete_event: '删除赛事',
  };

  const moduleLabels: Record<string, string> = {
    auth: '认证',
    devices: '设备',
    inspections: '巡检',
    repairs: '维修',
    schedules: '排班',
    pricing: '价格',
    waitlist: '候补',
    events: '赛事',
    reports: '报表',
  };

  const columns = [
    { key: 'id', title: 'ID', dataIndex: 'id' as keyof LogEntry, width: '60px' },
    { key: 'userName', title: '操作人', dataIndex: 'userName' as keyof LogEntry, width: '100px' },
    { key: 'module', title: '模块', dataIndex: 'module' as keyof LogEntry, width: '100px',
      render: (value: string) => moduleLabels[value] || value },
    { key: 'action', title: '操作', dataIndex: 'action' as keyof LogEntry, width: '140px',
      render: (value: string) => actionLabels[value] || value },
    { key: 'targetId', title: '目标ID', dataIndex: 'targetId' as keyof LogEntry, width: '80px' },
    { key: 'details', title: '详情', dataIndex: 'details' as keyof LogEntry,
      render: (value?: Record<string, any>) => value ? JSON.stringify(value) : '-' },
    { key: 'ip', title: 'IP地址', dataIndex: 'ip' as keyof LogEntry, width: '120px' },
    { key: 'createdAt', title: '时间', dataIndex: 'createdAt' as keyof LogEntry, width: '160px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : '' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">操作日志</h2>

      <FilterBar module="logs" filters={filters} onFilterChange={handleFilterChange} onSearch={() => {}}>
        <select value={filters.module || ''}
          onChange={(e) => handleFilterChange({ ...filters, module: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm">
          <option value="">全部模块</option>
          {Object.entries(moduleLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <input type="date" value={filters.startDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <input type="date" value={filters.endDate || ''}
          onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm" />

        <button onClick={() => handleFilterChange({ module: '', action: '', userId: '', startDate: '', endDate: '' })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
      </FilterBar>

      <DataTable columns={columns} data={logs} loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage }} />
    </div>
  );
}
