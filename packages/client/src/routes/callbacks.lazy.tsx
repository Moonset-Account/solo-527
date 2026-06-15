import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export const Route = createLazyFileRoute('/callbacks')({
  component: CallbacksIndex,
});

interface Callback {
  id: string;
  callbackType: string;
  callbackUrl: string;
  status: string;
  retryCount: number;
  errorMessage: string;
  lastAttemptAt: string;
  receipt: {
    id: string;
    receiptNo: string;
  } | null;
  createdAt: string;
}

function CallbacksIndex() {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [callbackType, setCallbackType] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    loadCallbacks();
  }, [status, callbackType, receiptNo]);

  const loadCallbacks = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (callbackType) params.append('callbackType', callbackType);
      if (receiptNo) params.append('receiptNo', receiptNo);

      const { data } = await apiClient.get(`/callbacks?${params.toString()}`);
      setCallbacks(data.items);
    } catch (error) {
      console.error('Failed to load callbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryCallback = async (id: string) => {
    setRetrying(id);
    try {
      await apiClient.post(`/callbacks/${id}/retry`);
      loadCallbacks();
    } catch (error) {
      console.error('Failed to retry callback:', error);
    } finally {
      setRetrying(null);
    }
  };

  const retryBatch = async () => {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (callbackType) params.callbackType = callbackType;

      await apiClient.post('/callbacks/retry-batch', params);
      loadCallbacks();
    } catch (error) {
      console.error('Failed to batch retry:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      retrying: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      pending: '待执行',
      success: '成功',
      failed: '失败',
      retrying: '重试中',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const failedCount = callbacks.filter((c) => c.status === 'failed').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">异常回调管理</h1>
        {failedCount > 0 && (
          <button
            onClick={retryBatch}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            🔄 批量重试失败 ({failedCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500 mb-1">总回调数</div>
          <div className="text-2xl font-bold text-gray-800">{callbacks.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500 mb-1">成功</div>
          <div className="text-2xl font-bold text-green-600">
            {callbacks.filter((c) => c.status === 'success').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500 mb-1">失败</div>
          <div className="text-2xl font-bold text-red-600">{failedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-500 mb-1">重试中</div>
          <div className="text-2xl font-bold text-yellow-600">
            {callbacks.filter((c) => c.status === 'retrying').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待执行</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
            <option value="retrying">重试中</option>
          </select>
          <select
            value={callbackType}
            onChange={(e) => setCallbackType(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="notification">通知回调</option>
            <option value="payment">支付回调</option>
            <option value="webhook">Webhook</option>
          </select>
          <input
            type="text"
            placeholder="按单据号查询"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadCallbacks}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            查询
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">回调类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">关联单据</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">回调地址</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">重试次数</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">错误信息</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {callbacks.map((callback) => (
              <tr key={callback.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      callback.callbackType === 'payment'
                        ? 'bg-purple-100 text-purple-700'
                        : callback.callbackType === 'notification'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {callback.callbackType === 'payment'
                      ? '支付'
                      : callback.callbackType === 'notification'
                      ? '通知'
                      : callback.callbackType}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {callback.receipt?.receiptNo || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate text-sm text-gray-500">
                    {callback.callbackUrl}
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(callback.status)}</td>
                <td className="px-4 py-3 text-gray-600">{callback.retryCount || 0}</td>
                <td className="px-4 py-3">
                  {callback.errorMessage ? (
                    <span
                      className="text-red-600 text-sm cursor-help"
                      title={callback.errorMessage}
                    >
                      {callback.errorMessage.slice(0, 30)}...
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(callback.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {(callback.status === 'failed' || callback.status === 'retrying') && (
                    <button
                      onClick={() => retryCallback(callback.id)}
                      disabled={retrying === callback.id}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                    >
                      {retrying === callback.id ? '重试中...' : '重试'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {callbacks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
