'use client';

import { useState } from 'react';
import UserLayout from '@/components/user/UserLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Crown,
  Shield,
  User,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const mockSeats = [
  { id: 'seat_001', email: 'zhang@example.com', name: '张三', role: 'owner', status: 'active', invitedAt: '2024-04-15T00:00:00Z', activatedAt: '2024-04-15T00:00:00Z', lastActiveAt: '2024-07-09T10:30:00Z' },
  { id: 'seat_002', email: 'wang@example.com', name: '王五', role: 'admin', status: 'active', invitedAt: '2024-04-20T00:00:00Z', activatedAt: '2024-04-21T00:00:00Z', lastActiveAt: '2024-07-08T15:20:00Z' },
  { id: 'seat_003', email: 'zhao@example.com', name: '赵六', role: 'member', status: 'active', invitedAt: '2024-05-15T00:00:00Z', activatedAt: '2024-05-16T00:00:00Z', lastActiveAt: '2024-07-05T09:00:00Z' },
  { id: 'seat_004', email: 'chen@example.com', name: '', role: 'member', status: 'invited', invitedAt: '2024-07-07T00:00:00Z', activatedAt: null, lastActiveAt: null },
];

export default function SeatsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const filteredSeats = mockSeats.filter(
    (seat) =>
      seat.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seat.name && seat.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = mockSeats.filter((s) => s.status === 'active').length;
  const totalLimit = 20;
  const usagePercent = (activeCount / totalLimit) * 100;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-accent-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-primary-500" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return '所有者';
      case 'admin':
        return '管理员';
      default:
        return '成员';
    }
  };

  return (
    <UserLayout>
      <div className="page-container">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-slate-900">席位管理</h1>
          <p className="mt-2 text-slate-500">管理您的团队席位和成员</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">已使用席位</p>
              <div className="p-2 bg-primary-50 rounded-lg">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">
              {activeCount}
              <span className="text-lg font-normal text-slate-500"> / {totalLimit}</span>
            </p>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500">使用率 {usagePercent.toFixed(0)}%</p>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">活跃成员</p>
              <div className="p-2 bg-success-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">{activeCount}</p>
            <p className="mt-2 text-xs text-slate-500">当前在线 2 人</p>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">待接受邀请</p>
              <div className="p-2 bg-warning-50 rounded-lg">
                <Mail className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">
              {mockSeats.filter((s) => s.status === 'invited').length}
            </p>
            <p className="mt-2 text-xs text-slate-500">7天内未接受将过期</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">团队成员</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索成员..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-56"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => setShowInviteModal(true)}
              >
                邀请成员
              </Button>
            </div>
          </div>

          {filteredSeats.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="暂无成员"
              description="邀请您的团队成员加入，开始协作。"
              action={
                <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                  邀请成员
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">成员</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">加入时间</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">最近活跃</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSeats.map((seat) => (
                    <tr key={seat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm">
                            {seat.name ? seat.name.charAt(0) : seat.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {seat.name || seat.email}
                            </p>
                            <p className="text-xs text-slate-500">{seat.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5">
                          {getRoleIcon(seat.role)}
                          <span className="text-sm text-slate-700">{getRoleLabel(seat.role)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={seat.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {formatDate(seat.invitedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {seat.lastActiveAt ? formatDate(seat.lastActiveAt) : '-'}
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
          )}
        </div>

        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-display text-xl font-bold text-slate-900">邀请团队成员</h3>
                <p className="text-sm text-slate-500 mt-1">发送邀请邮件，对方接受后加入团队</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    placeholder="请输入邮箱"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    角色权限
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="member">成员 - 基础访问权限</option>
                    <option value="admin">管理员 - 管理设置和成员</option>
                  </select>
                </div>
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600">
                    提示：您的套餐包含 {totalLimit} 个席位，当前已使用 {activeCount} 个。
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
                  取消
                </Button>
                <Button variant="primary" onClick={() => setShowInviteModal(false)}>
                  发送邀请
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
