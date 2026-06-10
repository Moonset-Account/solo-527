'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Mail,
  TrendingUp,
  Bell,
  UserPlus,
  Send,
} from 'lucide-react';

const mockTrials = [
  { id: 'trial_001', email: 'wu@example.com', name: '吴敏', plan: '入门版', startDate: '2024-07-02T00:00:00Z', endDate: '2024-07-16T00:00:00Z', status: 'ACTIVE', daysLeft: 7, usagePercent: 45, lastActiveAt: '2024-07-09T11:00:00Z', reminderSent: false },
  { id: 'trial_002', email: 'sun@example.com', name: '孙丽', plan: '专业版', startDate: '2024-07-05T00:00:00Z', endDate: '2024-07-19T00:00:00Z', status: 'ACTIVE', daysLeft: 10, usagePercent: 20, lastActiveAt: '2024-07-08T16:00:00Z', reminderSent: false },
  { id: 'trial_003', email: 'qian@example.com', name: '钱伟', plan: '专业版', startDate: '2024-06-25T00:00:00Z', endDate: '2024-07-09T00:00:00Z', status: 'ACTIVE', daysLeft: 0, usagePercent: 85, lastActiveAt: '2024-07-09T09:30:00Z', reminderSent: true },
  { id: 'trial_004', email: 'feng@example.com', name: '冯华', plan: '入门版', startDate: '2024-06-15T00:00:00Z', endDate: '2024-06-29T00:00:00Z', status: 'EXPIRED', daysLeft: 0, usagePercent: 30, lastActiveAt: '2024-06-25T00:00:00Z', reminderSent: true },
  { id: 'trial_005', email: 'zheng@example.com', name: '郑强', plan: '企业版', startDate: '2024-05-20T00:00:00Z', endDate: '2024-06-19T00:00:00Z', status: 'CONVERTED', daysLeft: 0, usagePercent: 100, lastActiveAt: '2024-07-09T08:00:00Z', reminderSent: true },
  { id: 'trial_006', email: 'xu@example.com', name: '徐静', plan: '专业版', startDate: '2024-07-01T00:00:00Z', endDate: '2024-07-15T00:00:00Z', status: 'CANCELLED', daysLeft: 6, usagePercent: 10, lastActiveAt: '2024-07-03T00:00:00Z', reminderSent: false },
];

export default function AdminTrialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTrials = mockTrials.filter((trial) => {
    const matchesSearch = trial.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trial.name && trial.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || trial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeTrials = mockTrials.filter((t) => t.status === 'ACTIVE').length;
  const convertedTrials = mockTrials.filter((t) => t.status === 'CONVERTED').length;
  const expiredTrials = mockTrials.filter((t) => t.status === 'EXPIRED').length;
  const conversionRate = (convertedTrials / (convertedTrials + expiredTrials) * 100).toFixed(1);

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">试用管理</h1>
            <p className="mt-2 text-slate-500">跟踪试用用户，促进付费转化</p>
          </div>
          <Button variant="primary" icon={<Bell className="w-4 h-4" />}>
            批量提醒
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">试用中</p>
              <RefreshCw className="w-5 h-5 text-primary-600" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{activeTrials}</p>
            <p className="text-xs text-slate-400 mt-1">正在试用的用户</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">已转化</p>
              <CheckCircle2 className="w-5 h-5 text-success-600" />
            </div>
            <p className="font-display text-2xl font-bold text-success-600">{convertedTrials}</p>
            <p className="text-xs text-slate-400 mt-1">试用转付费</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">已过期</p>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-500">{expiredTrials}</p>
            <p className="text-xs text-slate-400 mt-1">未转化</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">转化率</p>
              <TrendingUp className="w-5 h-5 text-accent-600" />
            </div>
            <p className="font-display text-2xl font-bold text-accent-600">{conversionRate}%</p>
            <p className="text-xs text-slate-400 mt-1">整体转化</p>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">试用列表</h2>
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
                <option value="ACTIVE">试用中</option>
                <option value="CONVERTED">已转化</option>
                <option value="EXPIRED">已过期</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTrials.map((trial, index) => (
              <div
                key={trial.id}
                className="p-5 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-medium">
                      {trial.name ? trial.name.charAt(0) : trial.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-slate-900">{trial.name || trial.email}</h3>
                        <StatusBadge status={trial.status} />
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{trial.email}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                          {trial.plan}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {trial.status === 'ACTIVE' ? `剩余 ${trial.daysLeft} 天` : `结束于 ${new Date(trial.endDate).toLocaleDateString('zh-CN')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-32 mb-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>用量</span>
                        <span>{trial.usagePercent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            trial.usagePercent >= 80 ? 'bg-danger-500' :
                            trial.usagePercent >= 50 ? 'bg-warning-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${trial.usagePercent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {trial.status === 'ACTIVE' && !trial.reminderSent && (
                        <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="发送提醒">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {trial.reminderSent && (
                        <span className="text-xs text-success-600 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          已提醒
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
