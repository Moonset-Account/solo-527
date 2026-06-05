import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  module: string;
  target_type: string;
  target_id: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
}

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  logout: '登出',
  confirm: '确认',
  cancel: '取消',
  complete: '完成'
};

const moduleLabels: Record<string, string> = {
  reservation: '预约管理',
  equipment: '设备管理',
  maintenance: '维修工单',
  settlement: '结算管理',
  user: '用户管理',
  auth: '认证系统',
  work: '作业管理'
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.module) params.append('module', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`/api/audit-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('获取审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'confirm': return '✅';
      case 'cancel': return '❌';
      case 'complete': return '🎉';
      default: return '📝';
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>
        <p className="text-gray-500 mt-1">系统操作记录和行为追踪</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="label">模块</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="input-field min-w-[130px]"
            >
              <option value="">全部模块</option>
              {Object.entries(moduleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">操作</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="input-field min-w-[130px]"
            >
              <option value="">全部操作</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">开始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">结束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedLog?.id === log.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getActionIcon(log.action)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{log.description}</p>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {dayjs(log.created_at).format('MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      👤 {log.user_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                      {moduleLabels[log.module] || log.module}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 rounded-full text-blue-600">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>暂无审计日志</p>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">🔍 日志详情</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">操作人</p>
              <p className="font-medium">{selectedLog.user_name}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">操作模块</p>
              <p className="font-medium">{moduleLabels[selectedLog.module] || selectedLog.module}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">操作类型</p>
              <p className="font-medium">{actionLabels[selectedLog.action] || selectedLog.action}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">操作时间</p>
              <p className="font-medium text-sm">{dayjs(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">变更前</p>
                <pre className="p-3 bg-red-50 rounded-lg text-xs overflow-x-auto text-red-700">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">变更后</p>
                <pre className="p-3 bg-green-50 rounded-lg text-xs overflow-x-auto text-green-700">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">IP 地址</p>
            <p className="font-mono text-sm">{selectedLog.ip_address}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">📊 今日操作统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.action === 'create').length}
            </p>
            <p className="text-xs text-blue-600 mt-1">新增操作</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-orange-600">
              {logs.filter(l => l.action === 'update').length}
            </p>
            <p className="text-xs text-orange-600 mt-1">更新操作</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action === 'confirm' || l.action === 'complete').length}
            </p>
            <p className="text-xs text-green-600 mt-1">确认操作</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-purple-600">
              {new Set(logs.map(l => l.user_name)).size}
            </p>
            <p className="text-xs text-purple-600 mt-1">活跃用户</p>
          </div>
        </div>
      </div>
    </div>
  );
}
