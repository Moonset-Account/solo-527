'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import {
  Clock,
  Calendar,
  Shield,
  RefreshCw,
  Edit2,
  Save,
  X,
  Info,
} from 'lucide-react';

const initialRules = [
  { id: 'trial_days', key: '试用天数', value: '14', type: 'system', description: '新用户默认试用天数', editable: true, unit: '天' },
  { id: 'grace_period', key: '宽限期', value: '3', type: 'system', description: '账单逾期后的宽限期', editable: true, unit: '天' },
  { id: 'auto_renew', key: '自动续费', value: '开启', type: 'feature', description: '订阅到期自动续费', editable: true, unit: '' },
  { id: 'invoice_due_days', key: '账单到期天数', value: '15', type: 'billing', description: '账单生成后多少天到期', editable: true, unit: '天' },
  { id: 'refund_max_days', key: '退款期限', value: '30', type: 'billing', description: '支付后可申请退款的最大天数', editable: true, unit: '天' },
  { id: 'proration_mode', key: '升级计费方式', value: '按比例', type: 'billing', description: '套餐升级时的费用计算方式', editable: true, unit: '' },
  { id: 'min_invoice_amount', key: '最低账单金额', value: '0', type: 'billing', description: '生成账单的最低金额', editable: true, unit: '元' },
  { id: 'retry_attempts', key: '支付重试次数', value: '3', type: 'system', description: '支付失败后的重试次数', editable: true, unit: '次' },
];

export default function BillingRulesPage() {
  const [rules, setRules] = useState(initialRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (rule: typeof initialRules[0]) => {
    setEditingId(rule.id);
    setEditValue(rule.value);
  };

  const saveEdit = () => {
    if (editingId) {
      setRules(rules.map((r) => (r.id === editingId ? { ...r, value: editValue } : r)));
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const typeLabels: Record<string, string> = {
    system: '系统配置',
    feature: '功能开关',
    billing: '计费规则',
  };

  const typeColors: Record<string, string> = {
    system: 'bg-primary-50 text-primary-700',
    feature: 'bg-success-50 text-success-700',
    billing: 'bg-warning-50 text-warning-700',
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">账期规则</h1>
          <p className="mt-2 text-slate-500">配置计费周期、试用规则和账单相关设置</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">计费周期</p>
                <p className="font-display text-xl font-bold text-slate-900">月度/年度</p>
              </div>
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">试用期限</p>
                <p className="font-display text-xl font-bold text-slate-900">14 天</p>
              </div>
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <Shield className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">宽限期</p>
                <p className="font-display text-xl font-bold text-slate-900">3 天</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-display text-lg font-bold text-slate-900">规则列表</h2>
            <p className="text-sm text-slate-500 mt-1">点击编辑图标修改配置项</p>
          </div>
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-slate-900">{rule.key}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[rule.type]}`}>
                        {typeLabels[rule.type]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingId === rule.id ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            autoFocus
                          />
                          {rule.unit && <span className="text-sm text-slate-500">{rule.unit}</span>}
                        </div>
                        <button
                          onClick={saveEdit}
                          className="p-1.5 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="保存"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                          title="取消"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-slate-900">
                          {rule.value}
                          {rule.unit && <span className="text-sm font-normal text-slate-500 ml-1">{rule.unit}</span>}
                        </span>
                        {rule.editable && (
                          <button
                            onClick={() => startEdit(rule)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-xl p-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary-900">计费规则说明</h4>
              <p className="text-sm text-primary-700 mt-1">
                修改计费规则将立即生效，并应用于所有新订阅。已有订阅的计费周期不受影响。
                建议在业务低峰期调整关键规则。
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
