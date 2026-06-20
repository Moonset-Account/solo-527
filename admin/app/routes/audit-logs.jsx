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
  restore: '还原',
  other: '其他'
};

const entityTypeLabels = {
  service: '服务项',
  pricing_rule: '加价规则',
  'pricing-rule': '加价规则',
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
  restore: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700'
};

const restorableActions = ['create', 'update', 'delete', 'status_change', 'assign', 'refund', 'reschedule'];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [changes, setChanges] = useState([]);
  const [detailTab, setDetailTab] = useState('changes');
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState({ show: false, version: 'before' });
  const [restoring, setRestoring] = useState(false);
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
    setDetailTab('changes');
    setChanges([]);
    setTimeline([]);

    try {
      const result = await api.get(`/audit-logs/compare/${log._id}`);
      if (result.success) {
        setChanges(result.data.changes || []);
      }
    } catch (error) {
      setChanges([]);
    }
  };

  const loadTimeline = async () => {
    if (!selectedLog || !selectedLog.entityId || !selectedLog.entityType) return;
    setTimelineLoading(true);
    try {
      const result = await api.get(`/audit-logs/timeline/${selectedLog.entityType}/${selectedLog.entityId}`);
      if (result.success) {
        setTimeline(result.data || []);
      }
    } catch (error) {
      console.error('加载时间线失败:', error);
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setDetailTab(tab);
    if (tab === 'timeline' && timeline.length === 0) {
      loadTimeline();
    }
  };

  const canRestore = selectedLog && restorableActions.includes(selectedLog.action);

  const handleRestore = async (version) => {
    if (!canRestore || !selectedLog) return;
    setRestoreConfirm({ show: true, version });
  };

  const confirmRestore = async () => {
    if (!selectedLog || restoring) return;
    setRestoring(true);
    try {
      const result = await api.post(`/audit-logs/restore/${selectedLog._id}`, {
        version: restoreConfirm.version
      });
      if (result.success) {
        alert(`还原成功！已将实体还原到${restoreConfirm.version === 'before' ? '变更前' : '变更后'}的状态。`);
        setRestoreConfirm({ show: false, version: 'before' });
        setShowDetail(false);
        loadLogs();
      } else {
        alert(`还原失败：${result.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('还原失败:', error);
      alert(`还原失败：${error.message || '网络错误'}`);
    } finally {
      setRestoring(false);
    }
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">审计日志详情</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  日志ID: {selectedLog._id}
                </p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="flex border-b border-gray-200 flex-shrink-0 bg-gray-50">
              <button
                onClick={() => handleTabChange('changes')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'changes'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                变更详情
              </button>
              <button
                onClick={() => handleTabChange('timeline')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'timeline'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                版本时间线 {timeline.length > 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{timeline.length}</span>}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {detailTab === 'changes' && (
                <div className="space-y-4">
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
                    {selectedLog.entityId && (
                      <div className="col-span-2">
                        <p className="text-gray-500">实体ID</p>
                        <p className="font-mono text-xs text-gray-700 bg-gray-50 p-2 rounded">{selectedLog.entityId}</p>
                      </div>
                    )}
                  </div>

                  {selectedLog.remark && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">备注</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{selectedLog.remark}</p>
                    </div>
                  )}

                  {canRestore && (
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <h4 className="text-sm font-semibold text-teal-800">数据还原操作</h4>
                          </div>
                          <p className="text-xs text-teal-700 mt-1">
                            可将 <b>{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</b>「{selectedLog.entityName || '未命名'}」还原到以下版本。
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleRestore('before')}
                          disabled={!selectedLog.beforeData && selectedLog.action !== 'delete'}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            还原到变更前
                          </div>
                          <div className="text-xs mt-1 text-red-500 opacity-80">
                            {selectedLog.action === 'create' ? '删除此实体' : selectedLog.action === 'delete' ? '恢复被删除数据' : '使用本次变更前的数据'}
                          </div>
                        </button>
                        <button
                          onClick={() => handleRestore('after')}
                          disabled={!selectedLog.afterData && selectedLog.action !== 'create'}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            还原到变更后
                          </div>
                          <div className="text-xs mt-1 text-green-500 opacity-80">
                            {selectedLog.action === 'delete' ? '删除此实体' : selectedLog.action === 'create' ? '重新创建此实体' : '使用本次变更后的数据'}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {changes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">变更字段对比</p>
                      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left w-1/4">字段</th>
                              <th className="px-3 py-2 text-left w-5/12">
                                <span className="inline-flex items-center gap-1 text-red-700">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                  </svg>
                                  变更前
                                </span>
                              </th>
                              <th className="px-3 py-2 text-left w-5/12">
                                <span className="inline-flex items-center gap-1 text-green-700">
                                  变更后
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {changes.map((change, idx) => (
                              <tr key={idx} className="hover:bg-white">
                                <td className="px-3 py-2 font-medium text-gray-700 bg-gray-100/50">{change.field}</td>
                                <td className="px-3 py-2 text-red-600 align-top">
                                  <pre className="whitespace-pre-wrap break-all text-xs font-mono">{formatValue(change.oldValue)}</pre>
                                </td>
                                <td className="px-3 py-2 text-green-600 align-top">
                                  <pre className="whitespace-pre-wrap break-all text-xs font-mono">{formatValue(change.newValue)}</pre>
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
                      <pre className="bg-green-50 p-4 rounded-lg text-xs overflow-x-auto border border-green-200 text-green-800">
                        {JSON.stringify(selectedLog.afterData, null, 2)}
                      </pre>
                    </div>
                  )}

                  {changes.length === 0 && selectedLog.action === 'delete' && selectedLog.beforeData && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">删除前数据</p>
                      <pre className="bg-red-50 p-4 rounded-lg text-xs overflow-x-auto border border-red-200 text-red-800">
                        {JSON.stringify(selectedLog.beforeData, null, 2)}
                      </pre>
                    </div>
                  )}

                  {changes.length === 0 && selectedLog.action === 'restore' && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-teal-800 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        还原操作说明
                      </p>
                      <p className="text-xs text-teal-700">
                        此日志记录了一次数据还原操作。如需回滚，请查看该实体的版本时间线选择其他版本进行还原。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'timeline' && (
                <div className="space-y-3">
                  {timelineLoading ? (
                    <div className="py-16 text-center text-gray-500">加载时间线中...</div>
                  ) : timeline.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      暂无版本时间线数据
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span>实体：<b>{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</b> - {selectedLog.entityName || selectedLog.entityId}</span>
                        <span>共 <b className="text-blue-600">{timeline.length}</b> 个历史版本</span>
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 via-blue-200 to-gray-200" />
                        {timeline.map((item, idx) => (
                          <div key={item._id || idx} className="relative pl-12 pb-5 last:pb-0">
                            <div className={`absolute left-1.5 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                              idx === 0 ? 'bg-green-500 ring-4 ring-green-100' : 'bg-blue-500'
                            }`}>
                              {idx === 0 ? (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                idx
                              )}
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between flex-wrap gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${actionColors[item.action] || 'bg-gray-100 text-gray-700'}`}>
                                      v{timeline.length - idx} · {actionLabels[item.action] || item.action}
                                    </span>
                                    {idx === 0 && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                                        当前版本
                                      </span>
                                    )}
                                    {item.versionTag && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                                        {item.versionTag}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                    <span>🕒 {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                                    <span>👤 {item.operatorName || '系统'}</span>
                                  </div>
                                  {item.remark && (
                                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                      💬 {item.remark}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  {item.beforeData && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`确定将此实体还原到版本 v${timeline.length - idx} 的「变更前」状态？\n\n操作：${actionLabels[item.action] || item.action}\n时间：${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}`)) {
                                          api.post(`/audit-logs/restore/${item._id}`, { version: 'before' })
                                            .then(r => {
                                              if (r.success) {
                                                alert('还原成功！');
                                                setShowDetail(false);
                                                loadLogs();
                                              } else {
                                                alert('还原失败：' + (r.message || '未知错误'));
                                              }
                                            })
                                            .catch(e => alert('还原失败：' + (e.message || '网络错误')));
                                        }
                                      }}
                                      className="px-2.5 py-1 text-xs rounded-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                    >
                                      还原变更前
                                    </button>
                                  )}
                                  {item.afterData && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`确定将此实体还原到版本 v${timeline.length - idx} 的「变更后」状态？\n\n操作：${actionLabels[item.action] || item.action}\n时间：${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}`)) {
                                          api.post(`/audit-logs/restore/${item._id}`, { version: 'after' })
                                            .then(r => {
                                              if (r.success) {
                                                alert('还原成功！');
                                                setShowDetail(false);
                                                loadLogs();
                                              } else {
                                                alert('还原失败：' + (r.message || '未知错误'));
                                              }
                                            })
                                            .catch(e => alert('还原失败：' + (e.message || '网络错误')));
                                        }
                                      }}
                                      className="px-2.5 py-1 text-xs rounded-md bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                                    >
                                      还原变更后
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {restoreConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-5 ${restoreConfirm.version === 'before' ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  restoreConfirm.version === 'before' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">确认数据还原</h3>
                  <p className={`text-sm ${restoreConfirm.version === 'before' ? 'text-red-700' : 'text-green-700'}`}>
                    {restoreConfirm.version === 'before' ? '还原到变更前版本' : '还原到变更后版本'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">实体类型</span>
                  <span className="font-medium">{entityTypeLabels[selectedLog?.entityType] || selectedLog?.entityType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">实体名称</span>
                  <span className="font-medium">{selectedLog?.entityName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">原操作类型</span>
                  <span className="font-medium">{actionLabels[selectedLog?.action] || selectedLog?.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">原操作时间</span>
                  <span className="font-medium">{selectedLog && dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg text-xs ${
                restoreConfirm.version === 'before'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                <p className="font-medium mb-1">⚠️ 还原操作不可撤销</p>
                <p>还原后，当前实体数据将被覆盖，本次还原操作本身也会生成一条新的审计日志（可在时间线中追溯）。</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setRestoreConfirm({ show: false, version: 'before' })}
                disabled={restoring}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmRestore}
                disabled={restoring}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-all ${
                  restoreConfirm.version === 'before'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {restoring ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    还原中...
                  </span>
                ) : '确认还原'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
