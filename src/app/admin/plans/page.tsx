'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Eye,
  EyeOff,
  GripVertical,
  Crown,
  Zap,
  Sparkles,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const mockPlans = [
  { id: 'plan_free', name: '免费版', description: '适合个人开发者体验产品', price: 0, interval: 'MONTHLY', seatLimit: 1, trialDays: 0, status: 'ACTIVE', isPopular: false, sortOrder: 1, features: ['1 个席位', '基础 API 调用', '社区支持', '5GB 存储'], icon: 'Sparkles' },
  { id: 'plan_starter', name: '入门版', description: '适合小型团队快速启动', price: 99, interval: 'MONTHLY', seatLimit: 5, trialDays: 14, status: 'ACTIVE', isPopular: false, sortOrder: 2, features: ['5 个席位', '高级 API 调用', '邮件支持', '50GB 存储'], icon: 'Zap' },
  { id: 'plan_pro', name: '专业版', description: '适合成长型团队深度使用', price: 299, interval: 'MONTHLY', seatLimit: 20, trialDays: 14, status: 'ACTIVE', isPopular: true, sortOrder: 3, features: ['20 个席位', '无限 API 调用', '优先支持', '500GB 存储'], icon: 'Crown' },
  { id: 'plan_enterprise', name: '企业版', description: '适合大型企业定制化需求', price: 999, interval: 'MONTHLY', seatLimit: 100, trialDays: 30, status: 'ACTIVE', isPopular: false, sortOrder: 4, features: ['100 个席位', '无限 API 调用', '专属经理', '无限存储'], icon: 'Building2' },
  { id: 'plan_legacy', name: '旧版基础版', description: '已停售的旧版套餐', price: 49, interval: 'MONTHLY', seatLimit: 2, trialDays: 7, status: 'ARCHIVED', isPopular: false, sortOrder: 5, features: ['2 个席位', '基础功能'], icon: 'Package' },
];

export default function AdminPlansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredPlans = mockPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Building2': return <Building2 className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">套餐配置</h1>
            <p className="mt-2 text-slate-500">管理您的订阅套餐和定价</p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            新建套餐
          </Button>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索套餐..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部状态</option>
                <option value="ACTIVE">启用中</option>
                <option value="INACTIVE">未启用</option>
                <option value="ARCHIVED">已归档</option>
              </select>
            </div>
            <div className="text-sm text-slate-500">
              共 <span className="font-medium text-slate-700">{filteredPlans.length}</span> 个套餐
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan, index) => (
            <div
              key={plan.id}
              className="card p-6 relative animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {plan.isPopular && (
                <div className="absolute -top-2 right-4 px-3 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold rounded-full shadow-md">
                  热门
                </div>
              )}
              {plan.status === 'ARCHIVED' && (
                <div className="absolute inset-0 bg-slate-900/5 rounded-2xl pointer-events-none"></div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  plan.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-400' :
                  plan.isPopular ? 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-600' :
                  'bg-primary-50 text-primary-600'
                }`}>
                  {getIcon(plan.icon)}
                </div>
                <div className="relative">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="font-display text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-3xl font-bold text-slate-900">
                  {plan.price === 0 ? '免费' : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-sm text-slate-500">/月</span>}
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {plan.seatLimit} 席位
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {plan.trialDays > 0 ? `${plan.trialDays}天试用` : '无试用'}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 mb-4">
                <p className="text-xs text-slate-500 mb-2">包含功能</p>
                <div className="space-y-1.5">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-success-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-slate-400 pl-6">还有 {plan.features.length - 4} 项功能</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <StatusBadge status={plan.status} />
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="编辑">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="切换状态">
                    {plan.status === 'ACTIVE' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button className="p-2 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-display text-xl font-bold text-slate-900">新建套餐</h3>
                <p className="text-sm text-slate-500 mt-1">创建新的订阅套餐</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">套餐名称</label>
                  <input type="text" placeholder="输入套餐名称" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">套餐描述</label>
                  <textarea rows={3} placeholder="简要描述套餐内容" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">价格 (元/月)</label>
                    <input type="number" placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">席位限制</label>
                    <input type="number" placeholder="5" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">试用天数</label>
                    <input type="number" placeholder="14" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">排序</label>
                    <input type="number" placeholder="1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="popular" className="w-4 h-4 text-primary-600 rounded" />
                  <label htmlFor="popular" className="text-sm text-slate-700">设为热门推荐</label>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
                <Button variant="primary" onClick={() => setShowCreateModal(false)}>创建套餐</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
