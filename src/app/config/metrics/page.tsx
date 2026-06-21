'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Users,
  Shield,
  BarChart3,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Textarea } from '@/components/ui/Textarea';
import AppLayout from '@/components/layout/AppLayout';
import { getRoleColor } from '@/lib/utils';

const tabs = [
  { id: 'metrics', label: '指标口径', icon: BarChart3 },
  { id: 'permissions', label: '角色权限', icon: Shield },
  { id: 'users', label: '用户管理', icon: Users },
];

const defaultMetrics = [
  { id: '1', key: 'todayRevenue', name: '今日营收', description: '当日已完成订单的总金额', formula: 'SUM(orders.totalAmount) WHERE status="completed" AND DATE(createdAt)=TODAY', unit: '元', category: '营收' },
  { id: '2', key: 'todayOrders', name: '今日订单', description: '当日创建的订单数量', formula: 'COUNT(orders) WHERE DATE(createdAt)=TODAY', unit: '单', category: '订单' },
  { id: '3', key: 'partTurnoverRate', name: '配件周转率', description: '平均每日配件周转次数', formula: 'SUM(stock_out.quantity)/30/AVG(parts.stock)', unit: '次/日', category: '库存' },
  { id: '4', key: 'qualityPassRate', name: '质检合格率', description: '质检通过数量占总质检数的比例', formula: 'COUNT(quality_checks WHERE result="passed")/COUNT(quality_checks)', unit: '%', category: '质量' },
];

const roleList = [
  { id: 'admin', name: '店长', description: '拥有系统全部权限' },
  { id: 'reception', name: '前台接待', description: '客户接待、订单创建' },
  { id: 'technician', name: '维修技师', description: '维修作业、质检提交' },
  { id: 'storekeeper', name: '库管员', description: '配件管理、出入库' },
  { id: 'accountant', name: '财务人员', description: '价格管理、数据导出' },
];

const allResources = [
  { resource: 'orders', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'customers', actions: ['view', 'create', 'edit'] },
  { resource: 'vehicles', actions: ['view', 'create', 'edit'] },
  { resource: 'inventory', actions: ['view', 'edit', 'export'] },
  { resource: 'quality', actions: ['view', 'create', 'edit'] },
  { resource: 'config', actions: ['view', 'edit'] },
  { resource: 'parts', actions: ['view', 'create', 'edit'] },
  { resource: 'priceList', actions: ['view', 'edit'] },
];

interface MetricItem {
  id: string;
  key: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  category: string;
}

interface PermissionItem {
  id: string;
  role: string;
  resource: string;
  action: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ConfigMetricsPage() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [metrics, setMetrics] = useState<MetricItem[]>(defaultMetrics);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', formula: '', unit: '', category: '', description: '' });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: '' });

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics && data.metrics.length > 0) {
          setMetrics(data.metrics);
        }
        if (data.permissions) {
          setPermissions(data.permissions);
        }
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const startEditMetric = (metric: MetricItem) => {
    setEditingMetric(metric.id);
    setEditForm({
      name: metric.name,
      formula: metric.formula,
      unit: metric.unit,
      category: metric.category,
      description: metric.description,
    });
  };

  const saveMetric = async (metric: MetricItem) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'metric',
          data: {
            key: metric.key,
            name: editForm.name,
            formula: editForm.formula,
            unit: editForm.unit,
            category: editForm.category,
            description: editForm.description,
          },
        }),
      });
      if (res.ok) {
        setMetrics(metrics.map((m) =>
          m.key === metric.key ? { ...m, ...editForm } : m
        ));
        setEditingMetric(null);
      } else {
        const err = await res.json();
        alert(err.error || '保存失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = async (role: string, resource: string, action: string) => {
    const exists = permissions.some(
      (p) => p.role === role && p.resource === resource && p.action === action
    );
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'permission',
          data: { role, resource, action, enabled: !exists },
        }),
      });
      if (res.ok) {
        if (exists) {
          setPermissions(permissions.filter(
            (p) => !(p.role === role && p.resource === resource && p.action === action)
          ));
        } else {
          const result = await res.json();
          setPermissions([...permissions, result]);
        }
      }
    } catch {
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      alert('请填写完整用户信息');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          data: newUser,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setUsers([created, ...users]);
        setShowAddUser(false);
        setNewUser({ name: '', email: '', password: '', role: '' });
      } else {
        const err = await res.json();
        alert(err.error || '创建用户失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const getRoleUserCount = (roleId: string) => {
    return users.filter((u) => u.role === roleId).length;
  };

  const isPermissionEnabled = (role: string, resource: string, action: string) => {
    return permissions.some(
      (p) => p.role === role && p.resource === resource && p.action === action
    ) || role === 'admin';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <div className="flex border-b border-metal-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                        : 'border-transparent text-metal-600 hover:text-metal-900 hover:bg-metal-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {activeTab === 'metrics' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>指标口径配置</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  新增指标
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className="p-4 bg-metal-50 rounded-xl hover:bg-metal-100/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-metal-900">{metric.name}</h4>
                          <Badge variant="secondary">{metric.category}</Badge>
                          <span className="text-xs text-metal-500 font-mono">{metric.key}</span>
                        </div>
                        <p className="text-sm text-metal-600 mb-3">{metric.description}</p>
                        {editingMetric === metric.id ? (
                          <div className="space-y-3">
                            <Input
                              label="指标名称"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                            <Input
                              label="单位"
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                            />
                            <Input
                              label="分类"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            />
                            <Textarea
                              label="计算公式"
                              value={editForm.formula}
                              onChange={(e) => setEditForm({ ...editForm, formula: e.target.value })}
                              rows={3}
                              className="font-mono text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveMetric(metric)} disabled={saving}>
                                <Save className="w-3 h-3 mr-1" />
                                {saving ? '保存中...' : '保存'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingMetric(null)}>
                                <X className="w-3 h-3 mr-1" />
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-3 rounded-lg border border-metal-200">
                            <p className="text-xs text-metal-500 mb-1">计算公式</p>
                            <code className="text-sm text-metal-700 font-mono break-all">
                              {metric.formula}
                            </code>
                          </div>
                        )}
                        <p className="text-xs text-metal-400 mt-2">单位: {metric.unit}</p>
                      </div>
                      {editingMetric !== metric.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditMetric(metric)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'permissions' && (
          <Card>
            <CardHeader>
              <CardTitle>角色权限管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleList.map((role) => (
                  <div
                    key={role.id}
                    className="p-5 bg-metal-50 rounded-xl border border-metal-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className={getRoleColor(role.id)}>
                          {role.name}
                        </Badge>
                        <p className="text-sm text-metal-500 mt-2">{role.description}</p>
                      </div>
                      <span className="text-xs text-metal-400">{getRoleUserCount(role.id)} 用户</span>
                    </div>
                    {editingRole === role.id ? (
                      <div className="mt-3 pt-3 border-t border-metal-200 space-y-2">
                        {allResources.map((res) => (
                          <div key={res.resource} className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-metal-600 w-16">{res.resource}</span>
                            {res.actions.map((action) => (
                              <label key={action} className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={isPermissionEnabled(role.id, res.resource, action)}
                                  onChange={() => togglePermission(role.id, res.resource, action)}
                                  disabled={role.id === 'admin' || saving}
                                  className="rounded border-metal-300"
                                />
                                {action}
                              </label>
                            ))}
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" onClick={() => setEditingRole(null)} className="mt-2">
                          <X className="w-3 h-3 mr-1" />
                          关闭
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-metal-200">
                        <p className="text-xs text-metal-500 mb-2">权限列表</p>
                        <div className="flex flex-wrap gap-1">
                          {role.id === 'admin' ? (
                            <Badge variant="secondary" size="sm">全部权限</Badge>
                          ) : (
                            allResources
                              .filter((res) => res.actions.some((a) => isPermissionEnabled(role.id, res.resource, a)))
                              .map((res) => (
                                <Badge key={res.resource} variant="secondary" size="sm">
                                  {res.resource}
                                </Badge>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                    {editingRole !== role.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setEditingRole(role.id)}
                        disabled={role.id === 'admin'}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        编辑权限
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>用户管理</CardTitle>
                <Button size="sm" onClick={() => setShowAddUser(!showAddUser)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新增用户
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddUser && (
                <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <h4 className="font-medium text-primary-900 mb-4">新增用户</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Input label="姓名" placeholder="请输入姓名" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                    <Input label="邮箱" type="email" placeholder="请输入邮箱" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                    <Input label="密码" type="password" placeholder="请输入密码" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    <Select
                      label="角色"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      options={[
                        { value: '', label: '请选择角色' },
                        { value: 'reception', label: '前台接待' },
                        { value: 'technician', label: '维修技师' },
                        { value: 'storekeeper', label: '库管员' },
                        { value: 'accountant', label: '财务人员' },
                      ]}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowAddUser(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleAddUser} disabled={saving}>
                      <Save className="w-3 h-3 mr-1" />
                      {saving ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-metal-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>创建时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-metal-900">{user.name}</div>
                        </TableCell>
                        <TableCell className="text-metal-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {roleList.find((r) => r.id === user.role)?.name || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-metal-500 text-sm">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
