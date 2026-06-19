import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { refundApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/refunds')({
  component: RefundsPage,
});

const refundStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已同意', color: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已驳回', color: 'bg-gray-100 text-gray-800' },
  completed: { label: '已退款', color: 'bg-green-100 text-green-800' },
};

function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    status: '',
    startDate: '',
    endDate: '',
  });

  const [handleModal, setHandleModal] = useState<{ id: number } | null>(null);
  const [handleStatus, setHandleStatus] = useState<'approved' | 'rejected' | 'completed'>('approved');
  const [handleNote, setHandleNote] = useState('');

  useEffect(() => {
    fetchRefunds();
  }, [filters]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === '') delete params[key];
      });
      const data: any = await refundApi.list(params);
      setRefunds(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleRefund = async () => {
    if (!handleModal) return;
    try {
      await refundApi.handle(handleModal.id, {
        status: handleStatus,
        handleNote,
      });
      setHandleModal(null);
      setHandleNote('');
      fetchRefunds();
    } catch (error) {
      alert('处理失败');
    }
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">退款管理</h1>
        <p className="text-gray-500 mt-1">共 {total} 条退款记录</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部状态</option>
              {Object.entries(refundStatusMap).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchRefunds}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退款单号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联订单</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退款金额</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退款原因</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-primary-600">{refund.refundNo}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{refund.order?.orderNo || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{refund.user?.name || '-'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-red-600">¥{refund.amount}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{refund.reason}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${refundStatusMap[refund.status]?.color}`}>
                          {refundStatusMap[refund.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {dayjs(refund.createdAt).format('YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-4 py-4 text-sm space-x-2">
                        {refund.status === 'pending' && (
                          <button
                            onClick={() => setHandleModal({ id: refund.id })}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            处理
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {refunds.length === 0 && (
              <div className="text-center py-20 text-gray-500">暂无退款记录</div>
            )}

            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  共 {total} 条，第 {filters.page} / {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                    disabled={filters.page >= totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {handleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">处理退款</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
                <select
                  value={handleStatus}
                  onChange={(e) => setHandleStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="approved">同意退款</option>
                  <option value="rejected">驳回申请</option>
                  <option value="completed">退款完成</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
                <textarea
                  value={handleNote}
                  onChange={(e) => setHandleNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="请输入处理说明"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setHandleModal(null); setHandleNote(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
