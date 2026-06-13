'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import { ReminderRule } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  Settings,
  Save,
  Clock,
  Mail,
  Power,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';

export default function ReminderRulesPage() {
  const currentUser = useStore((state) => state.currentUser);
  const departments = useStore((state) => state.departments);
  const reminderRules = useStore((state) => state.getReminderRules());
  const updateReminderRule = useStore((state) => state.updateReminderRule);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const visibleRules = isAdmin
    ? reminderRules
    : reminderRules.filter(r => r.department_id === currentUser?.department_id);

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '全局规则';
    return departments.find(d => d.id === deptId)?.name || '未知部门';
  };

  const handleToggle = async (rule: ReminderRule) => {
    setIsSaving(rule.id);
    try {
      await updateReminderRule(rule.id, { enabled: !rule.enabled });
    } finally {
      setIsSaving(null);
    }
  };

  const handleUpdate = async (ruleId: string, updates: Partial<ReminderRule>) => {
    setIsSaving(ruleId);
    try {
      await updateReminderRule(ruleId, updates);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Bell className="w-7 h-7 text-primary-900" />
          催办规则配置
        </h1>
        <p className="text-gray-500">设置事项截止前的自动催办提醒规则</p>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4 p-4 bg-primary-50 rounded-lg">
          <div className="bg-primary-100 p-2 rounded-lg">
            <Settings className="w-5 h-5 text-primary-900" />
          </div>
          <div>
            <p className="font-medium text-gray-900">规则说明</p>
            <p className="text-sm text-gray-600">
              系统将根据配置的规则，在事项截止前自动发送催办通知给责任人。部门规则优先级高于全局规则。
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {visibleRules.map((rule) => (
          <div key={rule.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-success-100' : 'bg-gray-100'}`}>
                  <Building2 className={`w-5 h-5 ${rule.enabled ? 'text-success-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getDepartmentName(rule.department_id)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    创建于 {formatDate(rule.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(rule)}
                disabled={isSaving === rule.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  rule.enabled ? 'bg-success-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rule.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  提前提醒天数
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={rule.days_before}
                    onChange={(e) => handleUpdate(rule.id, { days_before: parseInt(e.target.value) })}
                    className="input"
                    disabled={isSaving === rule.id || !rule.enabled}
                  />
                  <span className="text-gray-500">天</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Bell className="w-4 h-4" />
                  重复催办间隔
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={rule.repeat_interval}
                    onChange={(e) => handleUpdate(rule.id, { repeat_interval: parseInt(e.target.value) })}
                    className="select"
                    disabled={isSaving === rule.id || !rule.enabled}
                  >
                    <option value="6">每 6 小时</option>
                    <option value="12">每 12 小时</option>
                    <option value="24">每 24 小时</option>
                    <option value="48">每 48 小时</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  通知方式
                </label>
                <div className="flex items-center gap-3 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.notify_email}
                      onChange={(e) => handleUpdate(rule.id, { notify_email: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      disabled={isSaving === rule.id || !rule.enabled}
                    />
                    <span className="text-sm text-gray-600">邮件通知</span>
                  </label>
                </div>
              </div>
            </div>

            {rule.department_id && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Power className="w-4 h-4" />
                  <span>规则状态：{rule.enabled ? '运行中' : '已停用'}</span>
                </div>
                {isSaving === rule.id && (
                  <div className="flex items-center gap-2 text-sm text-primary-600">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    保存中...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-6 card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-900" />
            添加自定义规则
          </h3>
          <p className="text-sm text-gray-500">
            管理员可以为特定部门创建自定义催办规则
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-400">
              在实际部署时，此功能将允许创建新的催办规则。
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
