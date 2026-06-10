'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import {
  Gauge,
  Bell,
  Edit2,
  Plus,
  Trash2,
  Mail,
  Smartphone,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';

const initialThresholds = [
  { id: 'thresh_001', plan: '入门版', metric: 'API 调用', threshold: 10000, warningPercent: 80, notificationType: 'IN_APP', isEnabled: true, unit: '次' },
  { id: 'thresh_002', plan: '入门版', metric: '存储空间', threshold: 50, warningPercent: 80, notificationType: 'EMAIL', isEnabled: true, unit: 'GB' },
  { id: 'thresh_003', plan: '专业版', metric: 'API 调用', threshold: 100000, warningPercent: 80, notificationType: 'BOTH', isEnabled: true, unit: '次' },
  { id: 'thresh_004', plan: '专业版', metric: '存储空间', threshold: 500, warningPercent: 80, notificationType: 'IN_APP', isEnabled: true, unit: 'GB' },
  { id: 'thresh_005', plan: '专业版', metric: '席位数量', threshold: 20, warningPercent: 90, notificationType: 'EMAIL', isEnabled: false, unit: '个' },
  { id: 'thresh_006', plan: '企业版', metric: 'API 调用', threshold: 1000000, warningPercent: 70, notificationType: 'BOTH', isEnabled: true, unit: '次' },
];

export default function AdminThresholdsPage() {
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ threshold: 0, warningPercent: 80, notificationType: 'IN_APP' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const startEdit = (t: typeof initialThresholds[0]) => {
    setEditingId(t.id);
    setEditValues({
      threshold: t.threshold,
      warningPercent: t.warningPercent,
      notificationType: t.notificationType,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      setThresholds(thresholds.map((t) =>
        t.id === editingId
          ? { ...t, ...editValues }
          : t
      ));
      setEditingId(null);
    }
  };

  const toggleEnabled = (id: string) => {
    setThresholds(thresholds.map((t) =>
      t.id === id ? { ...t, isEnabled: !t.isEnabled } : t
    ));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="w-4 h-4" />;
      case 'IN_APP': return <Smartphone className="w-4 h-4" />;
      case 'BOTH': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case 'EMAIL': return '邮件';
      case 'IN_APP': return '站内信';
      case 'BOTH': return '邮件+站内信';
      default: return '未知';
    }
  };

  const plans = [...new Set(thresholds.map((t) => t.plan))];

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">用量阈值</h1>
            <p className="mt-2 text-slate-500">配置各套餐的用量告警阈值和通知方式</p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            新增阈值
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <Gauge className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">阈值规则</p>
                <p className="font-display text-xl font-bold text-slate-900">{thresholds.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <Bell className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">已启用</p>
                <p className="font-display text-xl font-bold text-success-600">
                  {thresholds.filter((t) => t.isEnabled).length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-warning-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">触发告警</p>
                <p className="font-display text-xl font-bold text-warning-600">12</p>
                <p className="text-xs text-slate-400">本周</p>
              </div>
            </div>
          </div>
        </div>

        {plans.map((plan) => (
          <div key={plan} className="card p-6 mb-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Gauge className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">{plan}</h2>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">指标</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">阈值</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">告警百分比</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">通知方式</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {thresholds
                    .filter((t) => t.plan === plan)
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-900">{t.metric}</span>
                        </td>
                        <td className="px-4 py-4">
                          {editingId === t.id ? (
                            <input
                              type="number"
                              value={editValues.threshold}
                              onChange={(e) => setEditValues({ ...editValues, threshold: parseInt(e.target.value) })}
                              className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          ) : (
                            <span className="text-slate-700">
                              {t.threshold.toLocaleString()} {t.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editingId === t.id ? (
                            <input
                              type="number"
                              value={editValues.warningPercent}
                              onChange={(e) => setEditValues({ ...editValues, warningPercent: parseInt(e.target.value) })}
                              className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          ) : (
                            <span className="text-slate-700">{t.warningPercent}%</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editingId === t.id ? (
                            <select
                              value={editValues.notificationType}
                              onChange={(e) => setEditValues({ ...editValues, notificationType: e.target.value })}
                              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                              <option value="IN_APP">站内信</option>
                              <option value="EMAIL">邮件</option>
                              <option value="BOTH">邮件+站内信</option>
                            </select>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                              {getNotificationIcon(t.notificationType)}
                              {getNotificationLabel(t.notificationType)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleEnabled(t.id)}
                            className="text-slate-400 hover:text-primary-600 transition-colors"
                          >
                            {t.isEnabled ? (
                              <ToggleRight className="w-7 h-7 text-success-500" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {editingId === t.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={saveEdit}
                                className="p-1.5 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEdit(t)}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-display text-xl font-bold text-slate-900">新增阈值规则</h3>
                <p className="text-sm text-slate-500 mt-1">配置用量告警规则</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">所属套餐</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                    {plans.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">指标名称</label>
                  <input type="text" placeholder="例如：API 调用" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">阈值</label>
                    <input type="number" placeholder="10000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">单位</label>
                    <input type="text" placeholder="次/GB" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">告警百分比</label>
                  <input type="number" placeholder="80" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                  <p className="text-xs text-slate-400 mt-1">当用量达到阈值的该百分比时发送提醒</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">通知方式</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                    <option value="IN_APP">站内信</option>
                    <option value="EMAIL">邮件</option>
                    <option value="BOTH">邮件+站内信</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
                <Button variant="primary" onClick={() => setShowCreateModal(false)}>创建</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
