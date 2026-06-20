import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

const actionLabels = {
  create: '创建',
  update: '更新',
  delete: '删除',
  status_change: '状态变更',
  assign: '派单',
  refund: '退款',
  reschedule: '改约',
  login: '登录',
  logout: '登出',
  other: '其他'
};

const entityTypeLabels = {
  service: '服务项',
  pricing_rule: '加价规则',
  technician: '师傅',
  part: '配件',
  order: '订单',
  reschedule: '改约记录',
  refund: '退款',
  satisfaction: '满意度',
  user: '用户',
  other: '其他'
};

const actionColors = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  status_change: 'bg-purple-100 text-purple-700',
  assign: 'bg-orange-100 text-orange-700',
  refund: 'bg-pink-100 text-pink-700',
  reschedule: 'bg-yellow-100 text-yellow-700',
  login: 'bg-indigo-100 text-indigo-700',
  logout: 'bg-gray-100 text-gray-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [changes, setChanges] = useState([]);
  const [filters, setFilters] = useState({
    action: 'all',
    entityType: 'all',
    operatorName: '',
    startDate: '',
    endDate: ''
  });
  
  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);
  
  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === 'all') {
          delete params[key];
        }
      });
      
      const result = await api.get('/audit-logs', params);
      if (result.success) {
        setLogs(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadDetail = async (log) => {
    setSelectedLog(log);
    setShowDetail(true);
    
    try {
      const result = await api.get(`/audit-logs/compare/${log._id}`);
      if (result.success) {
        setChanges(result.data.changes || []);
      }
    } catch (error) {
      setChanges([]);
    }
  };
  
  return (
    <AdminLayout title="审计日志">
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">操作类型</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="select"
                style={{ width: '140px' }}
              >
                <option value="all">全部</option>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">实体类型</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                className="select"
                style={{ width: '140px' }}
              >
                <option value="all">全部</option>
                {Object.entries(entityTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="label">操作人</label>
              <input
                type="text"
                placeholder="操作人姓名"
                value={filters.operatorName}
                onChange={(e) => setFilters(prev => ({ ...prev, operatorName: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            
            <button onClick={loadLogs} className="btn btn-primary">
              查询
            </button>
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entityTypeLabels[log.entityType] || log.entityType}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {log.entityName || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {log.operatorName || '系统'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm max-w-xs truncate">
                      {log.remark || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => loadDetail(log)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {pagination.total > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 条，第 {pagination.page} / {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="btn btn-secondary text-sm py-1 px-3 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showDetail && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">审计日志详情</h3>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">操作时间</p>
                  <p className="font-medium">{dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-gray-500">操作类型</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${actionColors[selectedLog.action] || 'bg-gray-100 text-gray-700'}`}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">实体类型</p>
                  <p className="font-medium">{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-gray-500">实体名称</p>
                  <p className="font-medium">{selectedLog.entityName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">操作人</p>
                  <p className="font-medium">{selectedLog.operatorName || '系统'}</p>
                </div>
                <div>
                  <p className="text-gray-500">IP地址</p>
                  <p className="font-medium">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>
              
              {selectedLog.remark && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">备注</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{selectedLog.remark}</p>
                </div>
              )}
              
              {changes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">变更字段对比</p>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left">字段</th>
                          <th className="px-3 py-2 text-left">变更前</th>
                          <th className="px-3 py-2 text-left">变更后</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {changes.map((change, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium">{change.field}</td>
                            <td className="px-3 py-2 text-red-600">
                              {JSON.stringify(change.oldValue)}
                            </td>
                            <td className="px-3 py-2 text-green-600">
                              {JSON.stringify(change.newValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {changes.length === 0 && selectedLog.action === 'create' && selectedLog.afterData && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">创建数据</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}
              
              {changes.length === 0 && selectedLog.action === 'delete' && selectedLog.beforeData && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">删除前数据</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
