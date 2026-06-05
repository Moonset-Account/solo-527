import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

interface SettlementRecord {
  id: string;
  reservation_id: string;
  member_name: string;
  equipment_name: string;
  work_hours: number;
  base_price: number;
  price_type: 'member' | 'subsidy' | 'commercial';
  price_multiplier: number;
  total_amount: number;
  fuel_consumption: number;
  fuel_cost: number;
  status: 'pending' | 'confirmed' | 'paid';
  created_at: string;
}

const priceTypeLabels: Record<string, string> = {
  member: '社员自用',
  subsidy: '合作社补贴',
  commercial: '跨村租赁'
};

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已支付'
};

export default function Settlement() {
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    price_type: '',
    month: ''
  });

  useEffect(() => {
    fetchSettlements();
  }, [filters]);

  const fetchSettlements = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.price_type) params.append('price_type', filters.price_type);
      if (filters.month) params.append('month', filters.month);

      const response = await axios.get(`/api/settlements?${params.toString()}`);
      setRecords(response.data);
    } catch (error) {
      console.error('获取结算记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await axios.post(`/api/settlements/${id}/confirm`);
      fetchSettlements();
    } catch (error) {
      console.error('确认结算失败:', error);
      alert('操作失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const totalAmount = records.reduce((sum, r) => sum + r.total_amount, 0);
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const avgMultiplier = records.length > 0 
    ? (records.reduce((sum, r) => sum + r.price_multiplier, 0) / records.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">结算中心</h1>
        <p className="text-gray-500 mt-1">管理作业费用结算和价格体系</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">¥{totalAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">总金额</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">待确认</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{records.length}</p>
          <p className="text-sm text-gray-500 mt-1">结算笔数</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">×{avgMultiplier}</p>
          <p className="text-sm text-gray-500 mt-1">平均价格系数</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="label">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field min-w-[120px]"
            >
              <option value="">全部</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="paid">已支付</option>
            </select>
          </div>
          <div>
            <label className="label">价格类型</label>
            <select
              value={filters.price_type}
              onChange={(e) => setFilters({ ...filters, price_type: e.target.value })}
              className="input-field min-w-[120px]"
            >
              <option value="">全部</option>
              <option value="member">社员自用</option>
              <option value="subsidy">合作社补贴</option>
              <option value="commercial">跨村租赁</option>
            </select>
          </div>
          <div>
            <label className="label">月份</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">社员/设备</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">作业信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">价格类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">费用明细</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-medium">{record.member_name}</p>
                    <p className="text-xs text-gray-500">{record.equipment_name}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm">{record.work_hours} 小时</p>
                    <p className="text-xs text-gray-500">油耗 {record.fuel_consumption}L</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium">{priceTypeLabels[record.price_type]}</span>
                    <p className="text-xs text-gray-500">系数 ×{record.price_multiplier}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-semibold text-green-600">¥{record.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      基础 ¥{record.base_price} + 油费 ¥{record.fuel_cost.toFixed(2)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      record.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {statusLabels[record.status]}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {record.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(record.id)}
                        className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        确认
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">💰</div>
            <p>暂无结算记录</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">📊 价格体系说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👤</span>
              <h4 className="font-semibold text-green-700">社员自用</h4>
            </div>
            <p className="text-3xl font-bold text-green-600">×0.7</p>
            <p className="text-sm text-green-600 mt-2">合作社内部社员使用，享受7折优惠</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏛️</span>
              <h4 className="font-semibold text-blue-700">合作社补贴</h4>
            </div>
            <p className="text-3xl font-bold text-blue-600">×0.5</p>
            <p className="text-sm text-blue-600 mt-2">政府补贴项目，个人仅需支付50%</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏘️</span>
              <h4 className="font-semibold text-orange-700">跨村租赁</h4>
            </div>
            <p className="text-3xl font-bold text-orange-600">×1.3</p>
            <p className="text-sm text-orange-600 mt-2">外部村社租赁，按市场价130%计费</p>
          </div>
        </div>
      </div>
    </div>
  );
}
