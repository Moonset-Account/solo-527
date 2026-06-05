import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

interface Reservation {
  id: string;
  member_name: string;
  equipment_name: string;
  field_name: string;
  crop: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'waitlisted' | 'conflict';
  price_type: 'member' | 'subsidy' | 'commercial';
  is_conflict?: boolean;
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '作业中',
  completed: '已完成',
  cancelled: '已取消',
  waitlisted: '候补中',
  conflict: '时间冲突'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  waitlisted: 'bg-purple-100 text-purple-700',
  conflict: 'bg-orange-100 text-orange-700'
};

const priceTypeLabels: Record<string, string> = {
  member: '社员自用',
  subsidy: '合作社补贴',
  commercial: '跨村租赁'
};

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: ''
  });
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  const fetchReservations = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);

      const response = await axios.get(`/api/reservations?${params.toString()}`);
      setReservations(response.data);
    } catch (error) {
      console.error('获取预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try {
      await axios.post(`/api/reservations/${id}/cancel`);
      fetchReservations();
    } catch (error) {
      console.error('取消预约失败:', error);
      alert('取消失败，请重试');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await axios.post(`/api/reservations/${id}/confirm`);
      fetchReservations();
    } catch (error) {
      console.error('确认预约失败:', error);
      alert('确认失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">预约管理</h1>
          <p className="text-gray-500 mt-1">管理所有农机预约申请</p>
        </div>
        {user?.role === 'member' && (
          <Link to="/reservations/new" className="btn-primary">
            + 新建预约
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="label">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field min-w-[150px]"
            >
              <option value="">全部状态</option>
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="in_progress">作业中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="waitlisted">候补中</option>
              <option value="conflict">时间冲突</option>
            </select>
          </div>
          <div>
            <label className="label">日期</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">预约信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">设备/地块</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">作业时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">价格类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-medium">{item.member_name}</p>
                    <p className="text-xs text-gray-500">作物：{item.crop}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm">{item.equipment_name}</p>
                    <p className="text-xs text-gray-500">{item.field_name}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm">{dayjs(item.start_time).format('MM-DD HH:mm')}</p>
                    <p className="text-xs text-gray-500">至 {dayjs(item.end_time).format('HH:mm')}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm">{priceTypeLabels[item.price_type]}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                      {item.is_conflict && (
                        <span className="text-xs text-red-500 font-medium">⚠️ 冲突</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === 'pending' && user?.role !== 'member' && (
                        <button
                          onClick={() => handleConfirm(item.id)}
                          className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          确认
                        </button>
                      )}
                      {['pending', 'confirmed', 'waitlisted'].includes(item.status) && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reservations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📅</div>
            <p>暂无预约记录</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {reservations.filter(r => r.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">待确认</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">
            {reservations.filter(r => r.status === 'confirmed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">已确认</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {reservations.filter(r => r.status === 'in_progress').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">作业中</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">
            {reservations.filter(r => r.status === 'waitlisted').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">候补中</p>
        </div>
      </div>
    </div>
  );
}
