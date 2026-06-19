import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { rescheduleApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/reschedule')({
  component: ReschedulePage,
});

function ReschedulePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reschedule' | 'cancel'>('all');

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    startDate: '',
    endDate: '',
    operatorType: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [filters, activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      if (activeTab === 'reschedule') params.isCancellation = 'false';
      if (activeTab === 'cancel') params.isCancellation = 'true';
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === '') delete params[key];
      });
      const data: any = await rescheduleApi.list(params);
      setRecords(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">改约/取消记录</h1>
        <p className="text-gray-500 mt-1">共 {total} 条记录</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab('reschedule')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reschedule'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              改约记录
            </button>
            <button
              onClick={() => setActiveTab('cancel')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cancel'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              取消记录
            </button>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
              <select
                name="operatorType"
                value={filters.operatorType}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">全部</option>
                <option value="customer">客户操作</option>
                <option value="staff">工作人员操作</option>
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
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联订单</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原预约</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新预约</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-primary-600">
                        {record.order?.orderNo || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          record.isCancellation
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {record.isCancellation ? '取消' : '改约'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div>{record.oldDate ? dayjs(record.oldDate).format('MM-DD') : '-'}</div>
                        <div className="text-xs text-gray-500">{record.oldTimeSlot || ''}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {record.isCancellation ? (
                          <span className="text-red-500">已取消</span>
                        ) : (
                          <>
                            <div>{record.newDate ? dayjs(record.newDate).format('MM-DD') : '-'}</div>
                            <div className="text-xs text-gray-500">{record.newTimeSlot || ''}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {record.reason || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {record.operatorType === 'customer' ? '客户' : '工作人员'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {records.length === 0 && (
              <div className="text-center py-20 text-gray-500">暂无记录</div>
            )}

            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t">
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
    </div>
  );
}
