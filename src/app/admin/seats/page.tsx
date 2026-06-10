'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Mail,
  Clock,
  CheckCircle2,
  Download,
} from 'lucide-react';

const mockSeats = [
  { id: 'seat_001', email: 'zhang@example.com', name: '张三', plan: '专业版', company: '科技公司A', role: 'owner', status: 'active', lastActiveAt: '2024-07-09T10:30:00Z', joinDate: '2024-04-15T00:00:00Z' },
  { id: 'seat_002', email: 'wang@example.com', name: '王五', plan: '专业版', company: '科技公司A', role: 'admin', status: 'active', lastActiveAt: '2024-07-08T15:20:00Z', joinDate: '2024-04-20T00:00:00Z' },
  { id: 'seat_003', email: 'li@example.com', name: '李四', plan: '入门版', company: '创业公司B', role: 'owner', status: 'active', lastActiveAt: '2024-07-05T09:00:00Z', joinDate: '2024-05-12T00:00:00Z' },
  { id: 'seat_004', email: 'zhao@example.com', name: '赵六', plan: '专业版', company: '科技公司A', role: 'member', status: 'active', lastActiveAt: '2024-07-05T09:00:00Z', joinDate: '2024-05-15T00:00:00Z' },
  { id: 'seat_005', email: 'chen@example.com', name: '', plan: '专业版', company: '科技公司A', role: 'member', status: 'invited', lastActiveAt: null, joinDate: '2024-07-07T00:00:00Z' },
  { id: 'seat_006', email: 'zhou@example.com', name: '周杰', plan: '企业版', company: '大企业C', role: 'owner', status: 'active', lastActiveAt: '2024-07-09T08:00:00Z', joinDate: '2024-03-01T00:00:00Z' },
  { id: 'seat_007', email: 'wu@example.com', name: '吴敏', plan: '入门版', company: '工作室D', role: 'owner', status: 'trialing', lastActiveAt: '2024-07-09T11:00:00Z', joinDate: '2024-07-02T00:00:00Z' },
];

export default function AdminSeatsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSeats = mockSeats.filter((seat) => {
    const matchesSearch = seat.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seat.name && seat.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || seat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSeats = mockSeats.length;
  const activeSeats = mockSeats.filter((s) => s.status === 'active').length;
  const invitedSeats = mockSeats.filter((s) => s.status === 'invited').length;

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">席位管理</h1>
            <p className="mt-2 text-slate-500">查看和管理所有用户席位</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
              导出
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">总席位数</p>
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{totalSeats}</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">活跃席位</p>
              <CheckCircle2 className="w-5 h-5 text-success-600" />
            </div>
            <p className="font-display text-2xl font-bold text-success-600">{activeSeats}</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">待接受</p>
              <Mail className="w-5 h-5 text-warning-600" />
            </div>
            <p className="font-display text-2xl font-bold text-warning-600">{invitedSeats}</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">试用中</p>
              <Clock className="w-5 h-5 text-accent-600" />
            </div>
            <p className="font-display text-2xl font-bold text-accent-600">
              {mockSeats.filter((s) => s.status === 'trialing').length}
            </p>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">席位列表</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-56"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部状态</option>
                <option value="active">活跃</option>
                <option value="invited">已邀请</option>
                <option value="trialing">试用中</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-slate-50 border-t border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">所属套餐</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">加入时间</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">最近活跃</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSeats.map((seat) => (
                  <tr key={seat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                          {seat.name ? seat.name.charAt(0) : seat.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{seat.name || seat.email}</p>
                          <p className="text-xs text-slate-500">{seat.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{seat.plan}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {seat.role === 'owner' ? '所有者' : seat.role === 'admin' ? '管理员' : '成员'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={seat.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(seat.joinDate).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {seat.lastActiveAt ? new Date(seat.lastActiveAt).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              共 <span className="font-medium text-slate-700">{filteredSeats.length}</span> 条记录
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                上一页
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-500">1 / 1</span>
              <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
