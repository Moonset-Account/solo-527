'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  History,
  Search,
  Filter,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  RefreshCw,
  User,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  Users,
} from 'lucide-react';

const mockChanges = [
  {
    id: 'log_001',
    subscriptionId: 'sub_001',
    user: '张三',
    userEmail: 'zhang@example.com',
    type: 'UPGRADE',
    oldPlan: '入门版',
    newPlan: '专业版',
    oldValue: '¥99/月',
    newValue: '¥299/月',
    note: '用户主动升级',
    result: 'success',
    changedBy: 'user',
    changedByName: '张三',
    createdAt: '2024-05-15T10:30:00Z',
    refundReason: null,
  },
  {
    id: 'log_002',
    subscriptionId: 'sub_001',
    user: '张三',
    userEmail: 'zhang@example.com',
    type: 'SEAT_CHANGE',
    oldPlan: null,
    newPlan: null,
    oldValue: '5 席位',
    newValue: '20 席位',
    note: '套餐升级自动增加席位',
    result: 'success',
    changedBy: 'system',
    changedByName: '系统',
    createdAt: '2024-05-15T10:30:05Z',
    refundReason: null,
  },
  {
    id: 'log_003',
    subscriptionId: 'sub_003',
    user: '王五',
    userEmail: 'wang@example.com',
    type: 'DOWNGRADE',
    oldPlan: '专业版',
    newPlan: '入门版',
    oldValue: '¥299/月',
    newValue: '¥99/月',
    note: '用户反馈价格太高',
    result: 'success',
    changedBy: 'user',
    changedByName: '王五',
    createdAt: '2024-06-01T14:20:00Z',
    refundReason: 'PRICE_TOO_HIGH',
  },
  {
    id: 'log_004',
    subscriptionId: 'sub_002',
    user: '李四',
    userEmail: 'li@example.com',
    type: 'CANCEL',
    oldPlan: '入门版',
    newPlan: null,
    oldValue: 'active',
    newValue: 'canceled',
    note: '产品太复杂，用不明白',
    result: 'success',
    changedBy: 'user',
    changedByName: '李四',
    createdAt: '2024-06-10T09:15:00Z',
    refundReason: 'TOO_COMPLEX',
  },
  {
    id: 'log_005',
    subscriptionId: 'sub_001',
    user: '张三',
    userEmail: 'zhang@example.com',
    type: 'REACTIVATE',
    oldPlan: null,
    newPlan: '专业版',
    oldValue: 'paused',
    newValue: 'active',
    note: '续费成功，恢复服务',
    result: 'success',
    changedBy: 'system',
    changedByName: '系统',
    createdAt: '2024-06-26T00:00:00Z',
    refundReason: null,
  },
  {
    id: 'log_006',
    subscriptionId: 'sub_004',
    user: '赵六',
    userEmail: 'zhao@example.com',
    type: 'TRIAL_CONVERT',
    oldPlan: null,
    newPlan: '专业版',
    oldValue: 'trial',
    newValue: 'active',
    note: '试用转付费',
    result: 'success',
    changedBy: 'user',
    changedByName: '赵六',
    createdAt: '2024-07-01T16:45:00Z',
    refundReason: null,
  },
  {
    id: 'log_007',
    subscriptionId: 'sub_005',
    user: '钱七',
    userEmail: 'qian@example.com',
    type: 'CANCEL',
    oldPlan: '企业版',
    newPlan: null,
    oldValue: 'active',
    newValue: 'canceled',
    note: '管理员操作 - 客户要求退款',
    result: 'pending',
    changedBy: 'admin',
    changedByName: '系统管理员',
    createdAt: '2024-07-08T11:00:00Z',
    refundReason: 'CUSTOMER_SERVICE',
  },
  {
    id: 'log_008',
    subscriptionId: 'sub_002',
    user: '李四',
    userEmail: 'li@example.com',
    type: 'PLAN_CHANGE',
    oldPlan: '入门版',
    newPlan: '专业版',
    oldValue: '旧版套餐',
    newValue: '新版套餐',
    note: '套餐迁移 - 版本升级',
    result: 'success',
    changedBy: 'admin',
    changedByName: '系统管理员',
    createdAt: '2024-07-05T10:00:00Z',
    refundReason: null,
  },
];

const typeLabels: Record<string, string> = {
  UPGRADE: '升级',
  DOWNGRADE: '降级',
  CANCEL: '取消',
  REACTIVATE: '恢复',
  SEAT_CHANGE: '席位变更',
  PLAN_CHANGE: '套餐变更',
  TRIAL_CONVERT: '试用转化',
};

const resultLabels: Record<string, string> = {
  success: '成功',
  pending: '处理中',
  failed: '失败',
};

export default function AdminChangesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredChanges = mockChanges.filter((change) => {
    const matchesSearch = change.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (change.note && change.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || change.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'UPGRADE':
      case 'TRIAL_CONVERT':
      case 'REACTIVATE':
        return <ArrowUpCircle className="w-5 h-5 text-success-600" />;
      case 'DOWNGRADE':
      case 'CANCEL':
        return <ArrowDownCircle className="w-5 h-5 text-danger-600" />;
      case 'SEAT_CHANGE':
        return <Users className="w-5 h-5 text-primary-600" />;
      case 'PLAN_CHANGE':
        return <RefreshCw className="w-5 h-5 text-warning-600" />;
      default:
        return <History className="w-5 h-5 text-slate-600" />;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'text-success-600 bg-success-50';
      case 'pending':
        return 'text-warning-600 bg-warning-50';
      case 'failed':
        return 'text-danger-600 bg-danger-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">变更记录</h1>
            <p className="mt-2 text-slate-500">查看所有套餐变更和操作历史</p>
          </div>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            导出记录
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <ArrowUpCircle className="w-5 h-5 text-success-600" />
              <p className="text-sm text-slate-500">升级次数</p>
            </div>
            <p className="font-display text-2xl font-bold text-success-600">
              {mockChanges.filter((c) => c.type === 'UPGRADE' || c.type === 'TRIAL_CONVERT').length}
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <ArrowDownCircle className="w-5 h-5 text-danger-600" />
              <p className="text-sm text-slate-500">取消/降级</p>
            </div>
            <p className="font-display text-2xl font-bold text-danger-600">
              {mockChanges.filter((c) => c.type === 'CANCEL' || c.type === 'DOWNGRADE').length}
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary-600" />
              <p className="text-sm text-slate-500">席位变更</p>
            </div>
            <p className="font-display text-2xl font-bold text-primary-600">
              {mockChanges.filter((c) => c.type === 'SEAT_CHANGE').length}
            </p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <p className="text-sm text-slate-500">总变更数</p>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{mockChanges.length}</p>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">变更历史</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索变更..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-64"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部类型</option>
                <option value="UPGRADE">升级</option>
                <option value="DOWNGRADE">降级</option>
                <option value="CANCEL">取消</option>
                <option value="REACTIVATE">恢复</option>
                <option value="SEAT_CHANGE">席位变更</option>
                <option value="PLAN_CHANGE">套餐变更</option>
                <option value="TRIAL_CONVERT">试用转化</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            <div className="space-y-6">
              {filteredChanges.map((change, index) => (
                <div
                  key={change.id}
                  className="relative pl-16 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-md flex items-center justify-center ${
                    change.result === 'success' ? 'bg-success-500' :
                    change.result === 'pending' ? 'bg-warning-500' : 'bg-danger-500'
                  }`}>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getResultColor(change.result)}`}>
                          {getTypeIcon(change.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-slate-900">
                              {typeLabels[change.type]}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getResultColor(change.result)}`}>
                              {resultLabels[change.result]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">
                            用户: {change.user} ({change.userEmail})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {new Date(change.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(change.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {(change.oldValue || change.newValue) && (
                      <div className="mt-4 flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">变更前</p>
                          <p className="text-sm font-medium text-slate-600 line-through">
                            {change.oldValue || '-'}
                          </p>
                        </div>
                        <ArrowUpCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-slate-500 mb-1">变更后</p>
                          <p className="text-sm font-medium text-slate-900">
                            {change.newValue || '-'}
                          </p>
                        </div>
                      </div>
                    )}

                    {change.note && (
                      <div className="mt-4 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">备注</p>
                          <p className="text-sm text-slate-700">{change.note}</p>
                        </div>
                      </div>
                    )}

                    {change.refundReason && (
                      <div className="mt-3 flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-danger-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500 mb-0.5">退款原因</p>
                          <p className="text-sm text-danger-600">{change.refundReason}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span>操作人: {change.changedByName}</span>
                        <span className="text-slate-300">|</span>
                        <span>类型: {change.changedBy}</span>
                      </div>
                      <button
                        onClick={() => setExpandedId(expandedId === change.id ? null : change.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        {expandedId === change.id ? (
                          <>
                            收起详情 <ChevronDown className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            查看详情 <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {expandedId === change.id && (
                      <div className="mt-4 pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">订阅 ID</p>
                          <p className="text-sm font-mono text-slate-700">{change.subscriptionId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">变更 ID</p>
                          <p className="text-sm font-mono text-slate-700">{change.id}</p>
                        </div>
                        {change.oldPlan && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">原套餐</p>
                            <p className="text-sm text-slate-700">{change.oldPlan}</p>
                          </div>
                        )}
                        {change.newPlan && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">新套餐</p>
                            <p className="text-sm text-slate-700">{change.newPlan}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
