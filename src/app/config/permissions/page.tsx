'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Save,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AppLayout from '@/components/layout/AppLayout';
import { getRoleColor } from '@/lib/utils';

const roleList = [
  { id: 'admin', name: '店长', description: '拥有系统全部权限' },
  { id: 'reception', name: '前台接待', description: '客户接待、订单创建' },
  { id: 'technician', name: '维修技师', description: '维修作业、质检提交' },
  { id: 'storekeeper', name: '库管员', description: '配件管理、出入库' },
  { id: 'accountant', name: '财务人员', description: '价格管理、数据导出' },
];

const allResources = [
  { resource: 'dashboard', label: '驾驶舱', actions: ['view'] },
  { resource: 'orders', label: '订单管理', actions: ['view', 'create', 'edit', 'delete'] },
  { resource: 'customers', label: '客户管理', actions: ['view', 'create', 'edit'] },
  { resource: 'vehicles', label: '车辆管理', actions: ['view', 'create', 'edit'] },
  { resource: 'parts', label: '配件管理', actions: ['view', 'create', 'edit'] },
  { resource: 'inventory', label: '库存管理', actions: ['view', 'edit', 'export'] },
  { resource: 'quality', label: '质检管理', actions: ['view', 'create', 'edit'] },
  { resource: 'price-list', label: '价目表', actions: ['view', 'edit'] },
  { resource: 'config', label: '系统配置', actions: ['view', 'edit'] },
  { resource: 'users', label: '用户管理', actions: ['view', 'create', 'edit'] },
];

const actionLabels: Record<string, string> = {
  view: '查看',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  export: '导出',
};

interface PermissionItem {
  id: string;
  role: string;
  resource: string;
  action: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('reception');
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const isPermissionEnabled = (role: string, resource: string, action: string) => {
    if (role === 'admin') return true;
    const key = `${role}:${resource}:${action}`;
    if (key in pendingChanges) return pendingChanges[key];
    return permissions.some(
      (p) => p.role === role && p.resource === resource && p.action === action
    );
  };

  const togglePermission = (role: string, resource: string, action: string) => {
    if (role === 'admin') return;
    const key = `${role}:${resource}:${action}`;
    const current = isPermissionEnabled(role, resource, action);
    setPendingChanges((prev) => ({ ...prev, [key]: !current }));
    setSaved(false);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const changes = Object.entries(pendingChanges);
      const promises = changes.map(([key, enabled]) => {
        const [role, resource, action] = key.split(':');
        return fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'permission',
            data: { role, resource, action, enabled },
          }),
        });
      });

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setPendingChanges({});
        setSaved(true);
        await loadPermissions();
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('部分权限保存失败，请重试');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-semibold text-metal-900">角色权限管理</h1>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-600">
                {Object.keys(pendingChanges).length} 项待保存
              </span>
              <Button variant="outline" size="sm" onClick={() => { setPendingChanges({}); setSaved(false); }}>
                <X className="w-3 h-3 mr-1" />
                撤销
              </Button>
              <Button size="sm" onClick={saveAll} disabled={saving}>
                <Save className="w-3 h-3 mr-1" />
                {saving ? '保存中...' : '保存所有'}
              </Button>
            </div>
          )}
          {saved && !hasChanges && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              已保存
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex border-b border-metal-200">
              {roleList.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role.id); setPendingChanges({}); }}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors text-sm ${
                    selectedRole === role.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-metal-600 hover:text-metal-900 hover:bg-metal-50'
                  }`}
                >
                  <Badge className={`${getRoleColor(role.id)} text-xs px-2 py-0.5`}>
                    {role.name}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {roleList.find((r) => r.id === selectedRole)?.name} 权限配置
              </CardTitle>
              {selectedRole === 'admin' && (
                <Badge variant="secondary">店长拥有全部权限，无需配置</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedRole === 'admin' ? (
              <div className="text-center py-12 text-metal-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>店长角色默认拥有所有权限</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-metal-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-metal-600 w-40">资源</th>
                      {allResources[0].actions.map((action) => (
                        <th key={action} className="text-center py-3 px-4 text-sm font-medium text-metal-600">
                          {actionLabels[action] || action}
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 text-sm font-medium text-metal-600 w-24">全选</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allResources.map((res) => {
                      const allChecked = res.actions.every((a) =>
                        isPermissionEnabled(selectedRole, res.resource, a)
                      );
                      return (
                        <tr key={res.resource} className="border-b border-metal-100 hover:bg-metal-50/50">
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-metal-900">{res.label}</span>
                            <span className="text-xs text-metal-400 ml-2">{res.resource}</span>
                          </td>
                          {res.actions.map((action) => {
                            const checked = isPermissionEnabled(selectedRole, res.resource, action);
                            const changed = `${selectedRole}:${res.resource}:${action}` in pendingChanges;
                            return (
                              <td key={action} className="text-center py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(selectedRole, res.resource, action)}
                                  className={`w-4 h-4 rounded border-metal-300 text-primary-600 focus:ring-primary-500 ${
                                    changed ? 'ring-2 ring-amber-400' : ''
                                  }`}
                                />
                              </td>
                            );
                          })}
                          <td className="text-center py-3 px-4">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={() => {
                                res.actions.forEach((action) => {
                                  const current = isPermissionEnabled(selectedRole, res.resource, action);
                                  if (current === allChecked) {
                                    togglePermission(selectedRole, res.resource, action);
                                  }
                                });
                              }}
                              className="w-4 h-4 rounded border-metal-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">权限说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-metal-600">
              <div>
                <p className="font-medium text-metal-900 mb-1">权限生效范围</p>
                <ul className="space-y-1 list-disc list-inside text-metal-500">
                  <li>菜单可见性 — 无查看权限的菜单项将自动隐藏</li>
                  <li>API 访问控制 — 后端接口根据权限拒绝未授权请求</li>
                  <li>操作按钮 — 编辑/删除等按钮根据权限显示或隐藏</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-metal-900 mb-1">变更生效方式</p>
                <ul className="space-y-1 list-disc list-inside text-metal-500">
                  <li>保存后立即生效，对应角色用户需刷新页面</li>
                  <li>店长角色始终拥有全部权限，无法修改</li>
                  <li>权限变更会同步影响侧边栏菜单和 API 接口</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
