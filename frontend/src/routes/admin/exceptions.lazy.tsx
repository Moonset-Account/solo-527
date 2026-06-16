import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { exceptionsApi, statsApi } from '../../lib/api';
import type { Exception, ExceptionLog } from '../../lib/types';

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-700' },
};

const categories = ['系统异常', '业务异常', '数据异常', '流程异常', '其他'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['open', 'closed'];

const delayGroups = [
  { key: '0', label: '延期0天', min: 0, max: 0 },
  { key: '1-3', label: '延期1-3天', min: 1, max: 3 },
  { key: '3-7', label: '延期3-7天', min: 3, max: 7 },
  { key: '7+', label: '延期7天以上', min: 7, max: Infinity },
];

type ActionType = 'close' | 'reopen' | 'delay' | null;

function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [logs, setLogs] = useState<ExceptionLog[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionForm, setActionForm] = useState({
    closeReason: '',
    resultSummary: '',
    resultNote: '',
    closer: '',
    reason: '',
    operator: '',
    delayDays: 0,
    delayReason: '',
  });
  const [ownersList, setOwnersList] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchExceptions();
    fetchOwners();
  }, [page, pageSize, search, status, category, priority, assignee]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchOwners = async () => {
    try {
      const data = await statsApi.getOwners();
      setOwnersList(data.owners);
    } catch (error) {
      console.error('Failed to fetch owners:', error);
    }
  };

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const data = await exceptionsApi.list({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        priority: priority || undefined,
        assignee: assignee || undefined,
      });
      setExceptions(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (exc: Exception) => {
    setSelectedException(exc);
    try {
      const data = await exceptionsApi.get(exc.id);
      setSelectedException(data.exception);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch exception detail:', error);
    }
    setShowDetail(true);
  };

  const handleViewOriginal = async (originalId: number) => {
    try {
      const data = await exceptionsApi.get(originalId);
      setSelectedException(data.exception);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch original exception:', error);
      setToast({ message: '获取原始异常失败', type: 'error' });
    }
  };

  const handleOpenAction = (type: ActionType, exc: Exception) => {
    setSelectedException(exc);
    setActionType(type);
    setActionForm({
      closeReason: '',
      resultSummary: '',
      resultNote: '',
      closer: '',
      reason: '',
      operator: '',
      delayDays: 0,
      delayReason: '',
    });
  };

  const handleSubmitAction = async () => {
    if (!selectedException || !actionType) return;

    try {
      switch (actionType) {
        case 'close':
          await exceptionsApi.close(selectedException.id, {
            closeReason: actionForm.closeReason,
            resultSummary: actionForm.resultSummary || undefined,
            resultNote: actionForm.resultNote || undefined,
            closer: actionForm.closer || undefined,
          });
          break;
        case 'reopen':
          await exceptionsApi.reopen(selectedException.id, {
            reason: actionForm.reason,
            operator: actionForm.operator || undefined,
          });
          setToast({ message: '已创建新异常，原异常记录已保留', type: 'success' });
          break;
        case 'delay':
          await exceptionsApi.delay(selectedException.id, {
            delayDays: actionForm.delayDays,
            reason: actionForm.delayReason || undefined,
            operator: actionForm.operator || undefined,
          });
          break;
      }
      setActionType(null);
      fetchExceptions();
      if (showDetail) {
        handleViewDetail(selectedException);
      }
    } catch (error) {
      console.error('Action failed:', error);
      setToast({ message: '操作失败，请重试', type: 'error' });
    }
  };

  const getDelayGroup = (delayDays: number) => {
    if (delayDays === 0) return '0';
    if (delayDays <= 3) return '1-3';
    if (delayDays <= 7) return '3-7';
    return '7+';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const groupedExceptions = delayGroups.map((group) => ({
    ...group,
    items: exceptions.filter((exc) => {
      const dg = getDelayGroup(exc.delayDays);
      return dg === group.key;
    }),
  }));

  const formatLogDetail = (detail: Record<string, any> | undefined) => {
    if (!detail) return null;
    return Object.entries(detail)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">异常池管理</h1>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索异常标题..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusMap[s]?.label || s}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类别</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部优先级</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {priorityMap[p]?.label || p}
                </option>
              ))}
            </select>

            <select
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部负责人</option>
              {ownersList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedExceptions.map((group) => (
            <div key={group.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  {group.label}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({group.items.length} 条)
                  </span>
                </h3>
              </div>

              {group.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">标题</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">类别</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">优先级</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">负责人</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">关联订单</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">延期天数</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((exc) => (
                        <tr key={exc.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <span>{exc.title}</span>
                              {(exc.reopenedFrom || exc.originalExceptionId) && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  回溯
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{exc.category}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                priorityMap[exc.priority]?.color ||
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {priorityMap[exc.priority]?.label || exc.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                statusMap[exc.status]?.color || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {statusMap[exc.status]?.label || exc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{exc.assignee || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {exc.orderNo || '-'}
                            {exc.orderAmount && (
                              <span className="ml-1 text-xs">({exc.orderAmount})</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium ${
                                exc.delayDays === 0
                                  ? 'text-green-600'
                                  : exc.delayDays <= 3
                                  ? 'text-yellow-600'
                                  : exc.delayDays <= 7
                                  ? 'text-orange-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {exc.delayDays} 天
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleViewDetail(exc)}
                                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                              >
                                详情
                              </button>
                              {exc.status !== 'closed' && (
                                <button
                                  onClick={() => handleOpenAction('close', exc)}
                                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                  关闭
                                </button>
                              )}
                              {exc.status === 'closed' && (
                                <button
                                  onClick={() => handleOpenAction('reopen', exc)}
                                  className="text-purple-500 hover:text-purple-700 text-sm font-medium"
                                >
                                  重开
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenAction('delay', exc)}
                                className="text-orange-500 hover:text-orange-700 text-sm font-medium"
                              >
                                延期
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">暂无异常</div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm">
            <div className="text-sm text-gray-500">
              共 {total} 条记录，第 {page}/{totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                首页
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {renderPagination().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                末页
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">异常详情</h2>
                <p className="text-sm text-gray-500">{selectedException.title}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {(selectedException.reopenedFrom || selectedException.originalExceptionId) && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">来源异常</p>
                  <button
                    onClick={() => handleViewOriginal(selectedException.reopenedFrom || selectedException.originalExceptionId!)}
                    className="text-sm text-purple-700 hover:text-purple-900 font-medium underline"
                  >
                    查看异常 #{selectedException.reopenedFrom || selectedException.originalExceptionId}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">标题</p>
                  <p className="text-sm font-medium text-gray-800">{selectedException.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">类别</p>
                  <p className="text-sm text-gray-800">{selectedException.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">优先级</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priorityMap[selectedException.priority]?.color ||
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {priorityMap[selectedException.priority]?.label ||
                      selectedException.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusMap[selectedException.status]?.color ||
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusMap[selectedException.status]?.label || selectedException.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">负责人</p>
                  <p className="text-sm text-gray-800">{selectedException.assignee || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">延期天数</p>
                  <p className="text-sm text-gray-800">{selectedException.delayDays} 天</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">关联订单</p>
                  <p className="text-sm text-gray-800">
                    {selectedException.orderNo || '-'}
                    {selectedException.orderAmount && (
                      <span className="ml-1">({selectedException.orderAmount})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">关闭人</p>
                  <p className="text-sm text-gray-800">{selectedException.closer || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">创建时间</p>
                  <p className="text-sm text-gray-800">
                    {formatDateTime(selectedException.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">更新时间</p>
                  <p className="text-sm text-gray-800">
                    {formatDateTime(selectedException.updatedAt)}
                  </p>
                </div>
                {selectedException.closedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">关闭时间</p>
                    <p className="text-sm text-gray-800">
                      {formatDateTime(selectedException.closedAt)}
                    </p>
                  </div>
                )}
              </div>

              {selectedException.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">描述</p>
                  <p className="text-sm text-gray-800">{selectedException.description}</p>
                </div>
              )}

              {selectedException.closeReason && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">关闭原因</p>
                  <p className="text-sm text-gray-800">{selectedException.closeReason}</p>
                </div>
              )}

              {selectedException.resultSummary && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">结果总结</p>
                  <p className="text-sm text-gray-800">{selectedException.resultSummary}</p>
                </div>
              )}

              {selectedException.resultNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">结果备注</p>
                  <p className="text-sm text-gray-800">{selectedException.resultNote}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-800 mb-3">操作日志</p>
                {logs.length > 0 ? (
                  <div className="space-y-3">
                    {logs.map((log, index) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          {index < logs.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800 text-sm">
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          {log.detail && (
                            <p className="text-xs text-gray-600 mb-1">
                              {formatLogDetail(log.detail)}
                            </p>
                          )}
                          {log.operator && (
                            <p className="text-xs text-gray-400">操作人: {log.operator}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">暂无操作日志</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {actionType && selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {actionType === 'close' && '关闭异常'}
                {actionType === 'reopen' && '重新打开异常'}
                {actionType === 'delay' && '设置延期'}
              </h2>
              <button
                onClick={() => setActionType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {actionType === 'close' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关闭原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionForm.closeReason}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, closeReason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请填写关闭原因..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结果总结
                    </label>
                    <textarea
                      value={actionForm.resultSummary}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, resultSummary: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="结果总结..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      结果备注
                    </label>
                    <textarea
                      value={actionForm.resultNote}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, resultNote: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="结果备注..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      关闭人
                    </label>
                    <input
                      type="text"
                      value={actionForm.closer}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, closer: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="关闭人..."
                    />
                  </div>
                </>
              )}

              {actionType === 'reopen' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      重开原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionForm.reason}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, reason: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请填写重开原因..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      操作人
                    </label>
                    <input
                      type="text"
                      value={actionForm.operator}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, operator: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="操作人..."
                    />
                  </div>
                </>
              )}

              {actionType === 'delay' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      延期天数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={actionForm.delayDays}
                      onChange={(e) =>
                        setActionForm({
                          ...actionForm,
                          delayDays: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      延期原因
                    </label>
                    <textarea
                      value={actionForm.delayReason}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, delayReason: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="延期原因..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      操作人
                    </label>
                    <input
                      type="text"
                      value={actionForm.operator}
                      onChange={(e) =>
                        setActionForm({ ...actionForm, operator: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="操作人..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAction}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/exceptions')({
  component: ExceptionsPage,
});
