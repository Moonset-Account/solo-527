import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api, exportUrl } from '@/utils/api';
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
    setRedeemCode(order.redeemCode || '');
    setRedeemModalOpen(true);
  };

  const confirmRedeem = async () => {
    if (!selectedOrder) return;
    try {
      await api.post(`/admin/orders/${selectedOrder.id}/redeem`, {
        redeemCode,
      });
      alert('核销成功！');
      setRedeemModalOpen(false);
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExport = () => {
    const params: any = { ...filters };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    exportUrl('/admin/statistics/export', { type: 'orders', ...params });
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
              onClick={() => { setSelectedOrder(null); setRedeemCode(''); setRedeemModalOpen(true); }}
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

            {selectedOrder ? (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">订单号</p>
                <p className="font-mono font-medium">{selectedOrder.orderNo}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {(selectedOrder as any).product?.name} × {selectedOrder.quantity}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">输入核销码</label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="请输入8位核销码"
                  maxLength={8}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono text-center text-lg tracking-widest"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRedeemModalOpen(false)}
                className="flex-1 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmRedeem}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
              >
                确认核销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
