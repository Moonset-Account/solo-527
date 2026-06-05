import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';

interface MaintenanceTicket {
  id: string;
  equipment_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporter_name: string;
  reported_at: string;
  resolved_at?: string;
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  critical: 'bg-red-100 text-red-600'
};

const statusLabels: Record<string, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

export default function Maintenance() {
  const user = useAuthStore(state => state.user);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    equipment_id: '',
    title: '',
    description: '',
    priority: 'medium'
  });
  const [equipment, setEquipment] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, equipRes] = await Promise.all([
        axios.get('/api/maintenance'),
        axios.get('/api/equipment')
      ]);
      setTickets(ticketsRes.data);
      setEquipment(equipRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/maintenance', newTicket);
      alert('工单创建成功！');
      setShowNewModal(false);
      setNewTicket({ equipment_id: '', title: '', description: '', priority: 'medium' });
      fetchData();
    } catch (error) {
      console.error('创建工单失败:', error);
      alert('创建失败，请重试');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/maintenance/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('操作失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));
  const resolvedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">维修工单</h1>
          <p className="text-gray-500 mt-1">设备故障报修和维修进度跟踪</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          + 新建工单
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">
            {tickets.filter(t => t.priority === 'critical' && t.status === 'open').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">紧急待处理</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-600">
            {tickets.filter(t => t.status === 'open').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">待处理</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">
            {tickets.filter(t => t.status === 'in_progress').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">处理中</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'resolved').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">本月已解决</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            待处理工单 ({openTickets.length})
          </h2>
          <div className="space-y-3">
            {openTickets.map(ticket => (
              <div key={ticket.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{ticket.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{ticket.equipment_name}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {dayjs(ticket.reported_at).format('MM-DD HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">报修人：{ticket.reporter_name}</span>
                  <div className="flex gap-2">
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        开始处理
                      </button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                        className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        标记解决
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {openTickets.length === 0 && (
              <div className="card text-center py-8 text-gray-500">
                <p>暂无待处理工单 🎉</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            已完成工单 ({resolvedTickets.length})
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {resolvedTickets.map(ticket => (
              <div key={ticket.id} className="card bg-gray-50 opacity-80">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-700">{ticket.title}</h3>
                    <p className="text-xs text-gray-500">{ticket.equipment_name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  完成于 {ticket.resolved_at ? dayjs(ticket.resolved_at).format('YYYY-MM-DD') : '-'}
                </p>
              </div>
            ))}
            {resolvedTickets.length === 0 && (
              <div className="card text-center py-8 text-gray-500">
                <p>暂无已完成工单</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">新建维修工单</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="label">选择设备 *</label>
                <select
                  value={newTicket.equipment_id}
                  onChange={(e) => setNewTicket({ ...newTicket, equipment_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">请选择故障设备</option>
                  {equipment.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">故障标题 *</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="简要描述故障"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">优先级</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
              <div>
                <label className="label">详细描述</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={3}
                  placeholder="详细描述故障现象..."
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  提交工单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
