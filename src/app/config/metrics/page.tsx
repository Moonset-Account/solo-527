'use client';

import { useState } from 'react';
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
import { getRoleColor, getStatusText } from '@/lib/utils';

const tabs = [
  { id: 'metrics', label: '指标口径', icon: BarChart3 },
  { id: 'permissions', label: '角色权限', icon: Shield },
  { id: 'users', label: '用户管理', icon: Users },
];

const metrics = [
  {
    id: '1',
    key: 'todayRevenue',
    name: '今日营收',
    description: '当日已完成订单的总金额',
    formula: 'SUM(orders.totalAmount) WHERE status = "completed" AND DATE(createdAt) = TODAY',
    unit: '元',
    category: '营收',
  },
  {
    id: '2',
    key: 'todayOrders',
    name: '今日订单',
    description: '当日创建的订单数量',
    formula: 'COUNT(orders) WHERE DATE(createdAt) = TODAY',
    unit: '单',
    category: '订单',
  },
  {
    id: '3',
    key: 'partTurnoverRate',
    name: '配件周转率',
    description: '平均每日配件周转次数',
    formula: 'SUM(stock_out.quantity) / 30 / AVG(parts.stock)',
    unit: '次/日',
    category: '库存',
  },
  {
    id: '4',
    key: 'qualityPassRate',
    name: '质检合格率',
    description: '质检通过数量占总质检数的比例',
    formula: 'COUNT(quality_checks WHERE result = "passed") / COUNT(quality_checks)',
    unit: '%',
    category: '质量',
  },
];

const roles = [
  { id: 'admin', name: '店长', description: '拥有系统全部权限', userCount: 2 },
  { id: 'reception', name: '前台接待', description: '客户接待、订单创建', userCount: 3 },
  { id: 'technician', name: '维修技师', description: '维修作业、质检提交', userCount: 5 },
  { id: 'storekeeper', name: '库管员', description: '配件管理、出入库', userCount: 2 },
  { id: 'accountant', name: '财务人员', description: '价格管理、数据导出', userCount: 1 },
];

const users = [
  { id: '1', name: '张店长', email: 'admin@example.com', role: 'admin', createdAt: '2024-01-15' },
  { id: '2', name: '李前台', email: 'reception@example.com', role: 'reception', createdAt: '2024-02-01' },
  { id: '3', name: '王技师', email: 'tech@example.com', role: 'technician', createdAt: '2024-02-15' },
  { id: '4', name: '赵库管', email: 'store@example.com', role: 'storekeeper', createdAt: '2024-03-01' },
  { id: '5', name: '陈财务', email: 'finance@example.com', role: 'accountant', createdAt: '2024-03-15' },
];

const rolePermissions = {
  admin: ['全部权限'],
  reception: ['订单管理', '客户管理', '车辆管理', '价目表查看'],
  technician: ['订单查看', '工艺查看', '质检管理'],
  storekeeper: ['配件管理', '库存管理', '出入库操作'],
  accountant: ['价目表管理', '数据导出', '财务报表'],
};

export default function ConfigMetricsPage() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

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
                          <div className="space-y-2">
                            <Textarea
                              label="计算公式"
                              defaultValue={metric.formula}
                              rows={3}
                              className="font-mono text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setEditingMetric(null)}>
                                <Save className="w-3 h-3 mr-1" />
                                保存
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMetric(editingMetric === metric.id ? null : metric.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
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
                {roles.map((role) => (
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
                      <span className="text-xs text-metal-400">{role.userCount} 用户</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-metal-200">
                      <p className="text-xs text-metal-500 mb-2">权限列表</p>
                      <div className="flex flex-wrap gap-1">
                        {rolePermissions[role.id as keyof typeof rolePermissions]?.map((perm) => (
                          <Badge key={perm} variant="secondary" size="sm">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Edit2 className="w-3 h-3 mr-1" />
                      编辑权限
                    </Button>
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
                    <Input label="姓名" placeholder="请输入姓名" />
                    <Input label="邮箱" type="email" placeholder="请输入邮箱" />
                    <Input label="密码" type="password" placeholder="请输入密码" />
                    <Select
                      label="角色"
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
                    <Button size="sm" onClick={() => setShowAddUser(false)}>
                      <Save className="w-3 h-3 mr-1" />
                      保存
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
                      <TableHead className="text-right">操作</TableHead>
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
                            {getStatusText(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-metal-500 text-sm">{user.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
