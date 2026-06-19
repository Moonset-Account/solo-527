import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { orderApi, technicianApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/orders')({
  component: OrdersPage,
});

interface Order {
  id: number;
  orderNo: string;
  status: string;
  source: string;
  applianceType: string;
  applianceBrand: string;
  faultDescription: string;
  address: string;
  city: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  estimatedCost: string | null;
  actualCost: string | null;
  isOnTime: boolean | null;
  createdAt: string;
  user: { name: string; phone: string } | null;
  technician: { name: string; phone: string } | null;
  cityManager: { name: string } | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待分配', color: 'bg-yellow-100 text-yellow-800' },
  assigned: { label: '已派单', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '维修中', color: 'bg-purple-100 text-purple-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-800' },
};

const sourceMap: Record<string, string> = {
  online: '线上预约',
  phone: '电话预约',
  walk_in: '到店预约',
  referral: '客户推荐',
  third_party: '第三方平台',
};

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    status: '',
    city: '',
    source: '',
    cityManagerId: '',
    startDate: '',
    endDate: '',
    keyword: '',
  });

  const [assignModal, setAssignModal] = useState<{ orderId: number } | null>(null);
  const [selectedTech, setSelectedTech] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchTechnicians();
    fetchManagers();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === '') delete params[key];
      });
      const data: any = await orderApi.list(params);
      setOrders(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const data: any = await technicianApi.list();
      setTechnicians(data);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const params: any = {};
      if (filters.city) params.city = filters.city;
      const data: any = await technicianApi.managers(params);
      setManagers(data);
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedTech) return;
    try {
      await orderApi.assign(assignModal.orderId, {
        technicianId: parseInt(selectedTech),
      });
      setAssignModal(null);
      setSelectedTech('');
      fetchOrders();
    } catch (error) {
      alert('派单失败');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (!confirm(`确定要将订单状态改为 ${statusMap[newStatus]?.label || newStatus} 吗？`)) return;
    try {
      await orderApi.updateStatus(orderId, { status: newStatus });
      fetchOrders();
    } catch (error) {
      alert('状态更新失败');
    }
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      pageSize: 20,
      status: '',
      city: '',
      source: '',
      cityManagerId: '',
      startDate: '',
      endDate: '',
      keyword: '',
    });
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
          <p className="text-gray-500 mt-1">共 {total} 条订单记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部状态</option>
              {Object.entries(statusMap).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
            <select
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部来源</option>
              {Object.entries(sourceMap).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <select
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部城市</option>
              {['北京', '上海', '广州', '深圳', '杭州', '成都'].map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
            <select
              name="cityManagerId"
              value={filters.cityManagerId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部负责人</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={String(mgr.id)}>
                  {mgr.name} ({mgr.city})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="订单号/故障描述"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
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
              onClick={fetchOrders}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              查询
            </button>
            <button
              onClick={resetFilters}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              重置
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户信息</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">家电类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预约时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">师傅</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-primary-600">{order.orderNo}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-900">{order.user?.name || '-'}</div>
                        <div className="text-gray-500 text-xs">{order.user?.phone || ''}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {order.applianceType} {order.applianceBrand || ''}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div>{dayjs(order.scheduledDate).format('YYYY-MM-DD')}</div>
                        <div className="text-xs text-gray-500">{order.scheduledTimeSlot}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {order.cityManager?.name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {order.technician?.name || '未分配'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {sourceMap[order.source] || order.source}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusMap[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => setAssignModal({ orderId: order.id })}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            派单
                          </button>
                        )}
                        {order.status === 'assigned' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'in_progress')}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            开始维修
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="text-green-600 hover:text-green-800"
                          >
                            完成
                          </button>
                        )}
                        <button
                          onClick={() => navigate({ to: `/admin/orders/${order.id}` })}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-20 text-gray-500">暂无订单数据</div>
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

      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">分配师傅</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">选择师傅</label>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">请选择师傅</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} - {tech.city} (等级{tech.skillLevel})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setAssignModal(null); setSelectedTech(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                确认派单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
