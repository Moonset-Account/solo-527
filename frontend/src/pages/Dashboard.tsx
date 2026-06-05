import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface DashboardStats {
  equipment: {
    total: number;
    available: number;
    in_use: number;
    maintenance: number;
    broken: number;
  };
  settlements: {
    total_amount: number;
    pending_count: number;
    confirmed_count: number;
  };
  today_reservations: number;
  total_reservations: number;
  open_maintenance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: '设备总数',
      value: stats?.equipment.total || 0,
      icon: '🚜',
      color: 'bg-blue-50 text-blue-600',
      link: '/equipment'
    },
    {
      label: '可用设备',
      value: stats?.equipment.available || 0,
      icon: '✅',
      color: 'bg-green-50 text-green-600',
      link: '/equipment'
    },
    {
      label: '今日预约',
      value: stats?.today_reservations || 0,
      icon: '📅',
      color: 'bg-purple-50 text-purple-600',
      link: '/reservations'
    },
    {
      label: '待处理工单',
      value: stats?.open_maintenance || 0,
      icon: '🔧',
      color: 'bg-orange-50 text-orange-600',
      link: '/maintenance'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来 👋</h1>
        <p className="text-gray-500">这是您的农业合作社农机共享平台概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">设备状态分布</h3>
          <div className="space-y-3">
            {[
              { label: '可用', value: stats?.equipment.available || 0, color: 'bg-green-500', total: stats?.equipment.total || 1 },
              { label: '使用中', value: stats?.equipment.in_use || 0, color: 'bg-blue-500', total: stats?.equipment.total || 1 },
              { label: '维修中', value: stats?.equipment.maintenance || 0, color: 'bg-yellow-500', total: stats?.equipment.total || 1 },
              { label: '故障', value: stats?.equipment.broken || 0, color: 'bg-red-500', total: stats?.equipment.total || 1 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.value} 台</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">结算概览</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gold-50 rounded-xl">
              <div>
                <p className="text-sm text-gold-700">总营收</p>
                <p className="text-3xl font-bold text-gold-600">
                  ¥{(stats?.settlements.total_amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">待确认</p>
                <p className="text-xl font-semibold text-gray-700">{stats?.settlements.pending_count || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">已确认</p>
                <p className="text-xl font-semibold text-gray-700">{stats?.settlements.confirmed_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/reservations/new" className="btn-primary text-center py-4 rounded-xl">
            📅 新建预约
          </Link>
          <Link to="/equipment" className="btn-secondary text-center py-4 rounded-xl">
            🚜 查看设备
          </Link>
          <Link to="/fields" className="btn-secondary text-center py-4 rounded-xl">
            🗺️ 地块地图
          </Link>
          <Link to="/settlement" className="btn-secondary text-center py-4 rounded-xl">
            💰 结算中心
          </Link>
        </div>
      </div>
    </div>
  );
}
