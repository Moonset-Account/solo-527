import { createLazyFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { subscriptionsApi } from '../../lib/api';
import type { Subscription, MembershipPlan } from '../../lib/types';

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700' },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-700' },
  canceled: { label: '已取消', color: 'bg-red-100 text-red-700' },
  pending: { label: '待生效', color: 'bg-yellow-100 text-yellow-700' },
};

function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [owner, setOwner] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [renewOrders, setRenewOrders] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const owners = ['张三', '李四', '王五', '赵六'];

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, pageSize, search, status, planId, owner]);

  const fetchPlans = async () => {
    try {
      const data = await subscriptionsApi.getPlans();
      setPlans(data.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionsApi.list({
        page,
        pageSize,
        search: search || undefined,
        status: status || undefined,
        planId: planId || undefined,
        owner: owner || undefined,
      });
      setSubscriptions(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const data = await subscriptionsApi.get(id);
      setSelectedSubscription(data.subscription);
      setRenewOrders(data.renewOrders);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch subscription detail:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">订阅管理</h1>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="搜索用户、邮箱..."
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
              {Object.entries(statusMap).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <select
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部套餐</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>

            <select
              value={owner}
              onChange={(e) => {
                setOwner(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部负责人</option>
              {owners.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">用户</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">套餐</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">负责人</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">开始时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">结束时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">续费次数</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{sub.userName || '-'}</div>
                          <div className="text-xs text-gray-500">{sub.userEmail || '-'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-gray-800">{sub.planName || '-'}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(sub.planPrice || 0)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[sub.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {statusMap[sub.status]?.label || sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{sub.owner || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(sub.startDate)}</td>
                      <td className="py-3 px-4 text-gray-600">{formatDate(sub.endDate)}</td>
                      <td className="py-3 px-4 text-gray-600">{sub.renewCount}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetail(sub.id)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
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
          </>
        )}
      </div>

      {showDetail && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">订阅详情</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">用户</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.userName}</p>
                  <p className="text-sm text-gray-500">{selectedSubscription.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">套餐</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.planName}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedSubscription.planPrice || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[selectedSubscription.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {statusMap[selectedSubscription.status]?.label || selectedSubscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">负责人</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.owner || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">开始时间</p>
                  <p className="font-medium text-gray-800">{formatDate(selectedSubscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">结束时间</p>
                  <p className="font-medium text-gray-800">{formatDate(selectedSubscription.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">续费次数</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.renewCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">自动续费</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.autoRenew ? '是' : '否'}</p>
                </div>
              </div>

              {selectedSubscription.cancelReason && (
                <div>
                  <p className="text-sm text-gray-500">取消原因</p>
                  <p className="font-medium text-gray-800">{selectedSubscription.cancelReason}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-800 mb-3">续费记录</h3>
                {renewOrders.length > 0 ? (
                  <div className="space-y-2">
                    {renewOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{order.orderNo}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{formatCurrency(order.amount)}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${statusMap[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {statusMap[order.status]?.label || order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无续费记录</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createLazyFileRoute('/admin/subscriptions')({
  component: SubscriptionsPage,
});
