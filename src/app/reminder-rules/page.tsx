'use client';

import { useState } from 'react';
import {
  Settings,
  Bell,
  Clock,
  AlertTriangle,
  FileWarning,
  Plus,
  Switch,
  Edit,
  Trash2,
  Gauge,
  Save,
} from 'lucide-react';
import { db } from '@/lib/mock-db';
import { reminderTypeLabels, formatDate, cn } from '@/lib/utils';
import { ReminderType, ReminderChannel } from '@prisma/client';

export default function ReminderRulesPage() {
  const rules = db.reminderRules.findMany();
  const [editingRule, setEditingRule] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  function getTypeIcon(type: string) {
    switch (type) {
      case ReminderType.RISK_ALERT:
        return <AlertTriangle className="h-5 w-5" />;
      case ReminderType.MATERIAL_INCOMPLETE:
        return <FileWarning className="h-5 w-5" />;
      case ReminderType.REVIEW_DEADLINE:
      case ReminderType.STAMP_DEADLINE:
        return <Clock className="h-5 w-5" />;
      case ReminderType.EFFICIENCY_REMINDER:
        return <Gauge className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case ReminderType.RISK_ALERT:
        return 'bg-danger-100 text-danger-600';
      case ReminderType.MATERIAL_INCOMPLETE:
        return 'bg-warning-100 text-warning-600';
      case ReminderType.REVIEW_DEADLINE:
        return 'bg-primary-100 text-primary-600';
      case ReminderType.STAMP_DEADLINE:
        return 'bg-purple-100 text-purple-600';
      case ReminderType.EFFICIENCY_REMINDER:
        return 'bg-success-100 text-success-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function toggleRule(ruleId: string) {
    const rule = rules.find((r: any) => r.id === ruleId);
    if (rule) {
      db.reminderRules.update({
        where: { id: ruleId },
        data: { isEnabled: !rule.isEnabled },
      });
    }
  }

  const channelLabels: Record<string, string> = {
    [ReminderChannel.SYSTEM]: '系统通知',
    [ReminderChannel.EMAIL]: '邮件',
    [ReminderChannel.SMS]: '短信',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒规则设置</h1>
          <p className="mt-1 text-sm text-gray-500">配置合同审查各节点的提醒规则和通知方式</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建规则
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
              <p className="text-sm text-gray-500">总规则数</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <Switch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rules.filter((r: any) => r.isEnabled).length}
              </p>
              <p className="text-sm text-gray-500">已启用</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {rules.filter((r: any) => !r.isEnabled).length}
              </p>
              <p className="text-sm text-gray-500">已停用</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                规则名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                类型
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                提醒时机
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                通知方式
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                状态
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rules.map((rule: any) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', getTypeColor(rule.type))}>
                      {getTypeIcon(rule.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                      {rule.description && (
                        <p className="text-xs text-gray-500">{rule.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {reminderTypeLabels[rule.type]}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {rule.beforeHours > 0 ? `提前 ${rule.beforeHours} 小时` : '即时'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {channelLabels[rule.channel] || rule.channel}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      rule.isEnabled ? 'bg-primary-600' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        rule.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </td>
                <td className="px-4 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="text-gray-500 hover:text-primary-600 p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-gray-500 hover:text-danger-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editingRule || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRule ? '编辑提醒规则' : '新建提醒规则'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">规则名称</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={editingRule?.name || ''}
                  placeholder="请输入规则名称"
                />
              </div>
              <div>
                <label className="label">提醒类型</label>
                <select className="input" defaultValue={editingRule?.type || ''}>
                  <option value="">请选择类型</option>
                  <option value={ReminderType.REVIEW_DEADLINE}>审阅截止提醒</option>
                  <option value={ReminderType.STAMP_DEADLINE}>盖章节点提醒</option>
                  <option value={ReminderType.MATERIAL_INCOMPLETE}>材料不完整提醒</option>
                  <option value={ReminderType.RISK_ALERT}>风险预警</option>
                  <option value={ReminderType.EFFICIENCY_REMINDER}>审阅效率提醒</option>
                </select>
              </div>
              <div>
                <label className="label">通知方式</label>
                <select className="input" defaultValue={editingRule?.channel || 'SYSTEM'}>
                  <option value="SYSTEM">系统通知</option>
                  <option value="EMAIL">邮件</option>
                  <option value="SMS">短信</option>
                </select>
              </div>
              <div>
                <label className="label">提前时间（小时）</label>
                <input
                  type="number"
                  className="input"
                  defaultValue={editingRule?.beforeHours || 24}
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">设置为 0 表示即时提醒</p>
              </div>
              <div>
                <label className="label">消息模板</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  defaultValue={editingRule?.template || ''}
                  placeholder="请输入提醒消息模板"
                />
              </div>
              <div>
                <label className="label">规则描述</label>
                <textarea
                  className="input min-h-[60px] resize-none"
                  defaultValue={editingRule?.description || ''}
                  placeholder="请输入规则描述"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingRule(null);
                  setShowAddModal(false);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button className="btn-primary">
                <Save className="mr-2 h-4 w-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
