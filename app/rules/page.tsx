'use client';

import { useState } from 'react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { mockReminderRules } from '@/lib/mockData';
import type { ReminderRule, ReminderRuleType, NotifyChannel, UserRole } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Plus, Edit2, Power, Clock, History } from 'lucide-react';
import Link from 'next/link';

const typeLabelMap: Record<ReminderRuleType, string> = {
  node_delay: '节点延期',
  inspection_due: '巡检到期',
  warranty_expire: '维保到期',
};

const channelLabelMap: Record<NotifyChannel, string> = {
  email: '邮件',
  sms: '短信',
  in_app: '站内信',
};

const roleLabelMap: Record<UserRole, string> = {
  admin: '管理员',
  project_manager: '项目经理',
  customer: '客户',
};

export default function RulesPage() {
  const [rules, setRules] = useState<ReminderRule[]>(mockReminderRules);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleToggleActive = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleEdit = (rule: ReminderRule) => {
    setEditingRule({ ...rule });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRule({
      id: 'r-new',
      name: '',
      type: 'node_delay',
      warning_days_before: 1,
      notify_channels: ['in_app'],
      notify_roles: ['project_manager'],
      is_active: true,
      created_at: new Date().toISOString(),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingRule) return;
    if (editingRule.id === 'r-new') {
      const newRule = { ...editingRule, id: `r-${Date.now()}` };
      setRules((prev) => [...prev, newRule]);
    } else {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? editingRule : r)));
    }
    setShowModal(false);
    setEditingRule(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const columns = [
    {
      key: 'name',
      title: '规则名称',
      width: '200px',
      render: (row: ReminderRule) => (
        <span className="font-medium text-zinc-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '120px',
      render: (row: ReminderRule) => (
        <StatusBadge status={row.type === 'node_delay' ? 'pending_confirm' : row.type === 'inspection_due' ? 'in_progress' : 'completed'}>
          {typeLabelMap[row.type]}
        </StatusBadge>
      ),
    },
    {
      key: 'warning_days_before',
      title: '预警提前天数',
      width: '120px',
      render: (row: ReminderRule) => (
        <div className="flex items-center gap-1 text-zinc-700">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          {row.warning_days_before === 0 ? '即时' : `${row.warning_days_before} 天`}
        </div>
      ),
    },
    {
      key: 'notify_channels',
      title: '通知渠道',
      width: '180px',
      render: (row: ReminderRule) => (
        <div className="flex flex-wrap gap-1">
          {row.notify_channels.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
            >
              {channelLabelMap[ch]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'notify_roles',
      title: '通知角色',
      width: '180px',
      render: (row: ReminderRule) => (
        <div className="flex flex-wrap gap-1">
          {row.notify_roles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
            >
              {roleLabelMap[role]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      title: '启用状态',
      width: '100px',
      render: (row: ReminderRule) => (
        <StatusBadge status={row.is_active ? 'in_progress' : 'closed'}>
          {row.is_active ? '已启用' : '已停用'}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      width: '160px',
      render: (row: ReminderRule) => (
        <span className="text-zinc-500">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      render: (row: ReminderRule) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit2 className="h-3.5 w-3.5" />
            编辑
          </Button>
          <Button
            size="sm"
            variant={row.is_active ? 'warn' : 'secondary'}
            onClick={() => handleToggleActive(row.id)}
          >
            <Power className="h-3.5 w-3.5" />
            {row.is_active ? '停用' : '启用'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">提醒规则配置</h1>
          <p className="mt-1 text-sm text-zinc-500">配置节点延期、巡检到期、维保到期的提醒规则</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rules/versions">
            <Button variant="secondary">
              <History className="h-4 w-4" />
              版本管理
            </Button>
          </Link>
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            新增规则
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            共 <span className="font-medium text-zinc-900">{rules.length}</span> 条规则
          </span>
        </div>
        <DataTable<ReminderRule>
          columns={columns}
          data={rules}
          rowKey={(row) => row.id}
        />
      </Card>

      {showModal && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-5 text-lg font-semibold text-zinc-900">
              {editingRule.id === 'r-new' ? '新增规则' : '编辑规则'}
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">规则名称</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="请输入规则名称"
                  className="h-9 rounded border border-zinc-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">规则类型</label>
                <select
                  value={editingRule.type}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, type: e.target.value as ReminderRuleType })
                  }
                  className="h-9 rounded border border-zinc-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="node_delay">节点延期</option>
                  <option value="inspection_due">巡检到期</option>
                  <option value="warranty_expire">维保到期</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">预警提前天数</label>
                <input
                  type="number"
                  min="0"
                  value={editingRule.warning_days_before}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      warning_days_before: Number(e.target.value),
                    })
                  }
                  className="h-9 w-32 rounded border border-zinc-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <p className="text-xs text-zinc-500">0 表示即时提醒</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">通知渠道</label>
                <div className="flex flex-wrap gap-2">
                  {(['email', 'sms', 'in_app'] as NotifyChannel[]).map((ch) => (
                    <label key={ch} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingRule.notify_channels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingRule({
                              ...editingRule,
                              notify_channels: [...editingRule.notify_channels, ch],
                            });
                          } else {
                            setEditingRule({
                              ...editingRule,
                              notify_channels: editingRule.notify_channels.filter(
                                (c) => c !== ch
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-zinc-600">{channelLabelMap[ch]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700">通知角色</label>
                <div className="flex flex-wrap gap-2">
                  {(['admin', 'project_manager', 'customer'] as UserRole[]).map((role) => (
                    <label key={role} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingRule.notify_roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingRule({
                              ...editingRule,
                              notify_roles: [...editingRule.notify_roles, role],
                            });
                          } else {
                            setEditingRule({
                              ...editingRule,
                              notify_roles: editingRule.notify_roles.filter(
                                (r) => r !== role
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-zinc-600">{roleLabelMap[role]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rule-active"
                  checked={editingRule.is_active}
                  onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="rule-active" className="text-sm text-zinc-700">
                  启用此规则
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={handleCancel}>
                取消
              </Button>
              <Button variant="primary" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
