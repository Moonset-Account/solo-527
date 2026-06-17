import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api, exportFile } from '@/utils/api';
import {
  ShoppingCart,
  Search,
  Filter,
  Check,
  Download,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { ExchangeOrder, PaginatedResponse } from '@shared/types';
import { formatDate, formatNumber, getStatusColor, getStatusText } from '@/utils';

function RedeemOrderInfo({ order }: { order: ExchangeOrder }) {
  const product = (order as any).product;
  const member = (order as any).member;
  const isRedeemed = order.status === 'redeemed';

  return (
    <div className="mb-5">
      <div className={`p-5 rounded-xl border-2 ${isRedeemed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">订单号</p>
            <p className="font-mono font-semibold text-gray-800">{order.orderNo}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">商品</span>
            <span className="font-medium text-gray-800">
              {product?.name || '-'} × {order.quantity}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">消耗积分</span>
            <span className="font-semibold text-brand-600">{formatNumber(order.totalPoints)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">会员</span>
            <span className="font-medium text-gray-800">{member?.nickname || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">手机号</span>
            <span className="font-mono text-gray-700">{member?.phone || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">核销码</span>
            <span className="font-mono font-semibold text-gray-800">{order.redeemCode || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">下单时间</span>
            <span className="text-gray-600">{formatDate(order.createdAt)}</span>
          </div>
          {isRedeemed && (order as any).redeemedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">核销时间</span>
              <span className="text-green-600 font-medium">{formatDate((order as any).redeemedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ExchangeOrder | null>(null);
  const [queriedOrder, setQueriedOrder] = useState<ExchangeOrder | null>(null);
  const [queryingOrder, setQueryingOrder] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, keyword, status, startDate, endDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<ExchangeOrder> & { filters: any }>('/admin/orders', {
        page,
        pageSize,
        keyword: keyword || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setFilters(data.filters || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (order: ExchangeOrder) => {
    setSelectedOrder(order);
    setQueriedOrder(order);
    setRedeemCode(order.redeemCode || '');
    setRedeemModalOpen(true);
  };

  const queryOrderByCode = async () => {
    if (!redeemCode.trim()) {
      alert('请输入核销码');
      return;
    }
    setQueryingOrder(true);
    setQueriedOrder(null);
    try {
      const order = await api.get<ExchangeOrder>(`/admin/orders/redeem-code/${redeemCode.trim().toUpperCase()}`);
      setQueriedOrder(order);
    } catch (e: any) {
      alert(e.message || '未找到对应订单');
    } finally {
      setQueryingOrder(false);
    }
  };

  const confirmRedeem = async () => {
    const order = selectedOrder || queriedOrder;
    if (!order) {
      alert('请先选择或查询订单');
      return;
    }
    setRedeeming(true);
    try {
      await api.post(`/admin/orders/${order.id}/redeem`, {
        redeemCode: order.redeemCode,
      });
      alert('核销成功！');
      setRedeemModalOpen(false);
      setSelectedOrder(null);
      setQueriedOrder(null);
      setRedeemCode('');
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRedeeming(false);
    }
  };

  const closeRedeemModal = () => {
    setRedeemModalOpen(false);
    setSelectedOrder(null);
    setQueriedOrder(null);
    setRedeemCode('');
  };

  const handleExport = async () => {
    try {
      const params: any = { ...filters };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      await exportFile('/admin/statistics/export', { type: 'orders', ...params }, '订单列表.csv');
    } catch (e: any) {
      alert(e.message || '导出失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const tabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待核销' },
    { value: 'redeemed', label: '已核销' },
  ];

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">订单核销</h1>
          <p className="text-gray-500 mt-1">共 {total} 笔订单</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === tab.value
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                placeholder="搜索订单号、会员昵称、手机号..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                showFilters ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>

            <button
              onClick={() => { closeRedeemModal(); setRedeemModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              扫码核销
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 animate-fadeIn">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">订单信息</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">会员</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">积分</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">核销码</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">下单时间</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">暂无订单数据</p>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => {
                  const product = (order as any).product;
                  const member = (order as any).member;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {product?.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ShoppingCart className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-mono text-gray-500">{order.orderNo}</p>
                            <p className="font-medium text-gray-800 truncate max-w-xs">
                              {product?.name || '商品'}
                            </p>
                            <p className="text-xs text-gray-400">数量：{order.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {member?.nickname || '-'}
                          </p>
                          <p className="text-xs text-gray-400">{member?.phone || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-brand-600">{formatNumber(order.totalPoints)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-mono text-gray-600">
                          {order.redeemCode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleRedeem(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            核销
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {redeemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fadeInUp">
            <h3 className="text-lg font-bold text-gray-800 mb-4">订单核销</h3>

            {!selectedOrder && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">输入核销码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') queryOrderByCode(); }}
                    placeholder="请输入或扫码核销码"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono text-center text-lg tracking-widest"
                  />
                  <button
                    onClick={queryOrderByCode}
                    disabled={queryingOrder || !redeemCode.trim()}
                    className="px-5 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {queryingOrder ? '查询中...' : '查询'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">提示：扫码或手动输入核销码后点击查询</p>
              </div>
            )}

            {(selectedOrder || queriedOrder) && (
              <RedeemOrderInfo
                order={(selectedOrder || queriedOrder)!}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={closeRedeemModal}
                className="flex-1 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                关闭
              </button>
              {(selectedOrder || queriedOrder)?.status === 'pending' && (
                <button
                  onClick={confirmRedeem}
                  disabled={redeeming}
                  className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {redeeming ? '核销中...' : '确认核销'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
