import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentSatisfaction, setRecentSatisfaction] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const result = await api.get('/reports/dashboard');
      if (result.success) {
        setStats(result.data.stats);
        setRecentOrders(result.data.recentOrders || []);
        setRecentSatisfaction(result.data.recentSatisfaction || []);
      }
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800'
  };
  
  const statusLabels = {
    pending: '待确认',
    confirmed: '已确认',
    assigned: '已派单',
    in_progress: '维修中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  };
  
  const statCards = stats ? [
    { label: '今日订单', value: stats.todayOrders, color: 'bg-blue-500', icon: '📋' },
    { label: '今日营收', value: `¥${stats.todayRevenue.toFixed(0)}`, color: 'bg-green-500', icon: '💰' },
    { label: '待处理订单', value: stats.pendingOrders, color: 'bg-yellow-500', icon: '⏳' },
    { label: '维修中', value: stats.inProgressOrders, color: 'bg-orange-500', icon: '🔧' },
    { label: '今日完成', value: stats.todayCompleted, color: 'bg-purple-500', icon: '✅' },
    { label: '在岗师傅', value: stats.totalTechnicians, color: 'bg-indigo-500', icon: '👷' },
    { label: '库存预警', value: stats.lowStockParts, color: 'bg-red-500', icon: '⚠️' },
    { label: '待退款', value: stats.refundPending, color: 'bg-pink-500', icon: '💸' }
  ] : [];
  
  if (loading) {
    return (
      <AdminLayout title="仪表盘">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="仪表盘">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">最近订单</h3>
            </div>
            <div className="p-5">
              {recentOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无订单</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{order.orderNo}</p>
                        <p className="text-xs text-gray-500">{order.customerName} - {order.applianceType}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                        <p className="text-sm font-medium text-gray-800 mt-1">¥{order.totalAmount?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">最近评价</h3>
            </div>
            <div className="p-5">
              {recentSatisfaction.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无评价</p>
              ) : (
                <div className="space-y-3">
                  {recentSatisfaction.map((item) => (
                    <div key={item._id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.orderNo}</p>
                        <p className="text-xs text-gray-500">师傅: {item.technicianName}</p>
                      </div>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= item.overallRating ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">本月营收概览</h3>
          <div className="flex items-center space-x-8">
            <div>
              <p className="text-3xl font-bold text-gray-800">
                ¥{stats?.monthlyRevenue?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-gray-500 mt-1">本月总营收</p>
            </div>
            <div className="h-12 w-px bg-gray-200"></div>
            <div>
              <p className="text-2xl font-bold text-green-600">+12.5%</p>
              <p className="text-sm text-gray-500 mt-1">较上月</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
