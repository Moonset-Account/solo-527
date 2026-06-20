'use client';

import { useState } from 'react';
import { Shield, Plus, Clock, AlertTriangle, Users, Edit, Trash2, Eye, History, ToggleLeft, ToggleRight, ChevronRight, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatMinutes, getStatusText } from '@/lib/utils';
import Link from 'next/link';

const mockSLARules = [
  {
    id: '1',
    name: '高优先级工单响应规则',
    description: '针对高优先级客户投诉工单的SLA响应和解决时效要求',
    category: '响应时效',
    isActive: true,
    version: 3,
    responseTime: 15,
    resolutionTime: 240,
    conditions: [
      { field: 'priority', operator: 'EQ', value: 'HIGH' },
      { field: 'category', operator: 'EQ', value: '投诉' },
    ],
    escalationLevels: [
      { level: 1, threshold: 30, notifyRoles: ['AGENT'], action: '提醒客服处理' },
      { level: 2, threshold: 60, notifyRoles: ['MANAGER'], action: '升级至售后经理' },
      { level: 3, threshold: 120, notifyRoles: ['ADMIN'], action: '升级至运营总监' },
    ],
    createdBy: '管理员',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
    applyCount: 1234,
    breachCount: 45,
    complianceRate: 96.3,
  },
  {
    id: '2',
    name: '退换货工单处理规则',
    description: '7天无理由退换货及质量问题退换货工单的处理时效要求',
    category: '退换货',
    isActive: true,
    version: 2,
    responseTime: 30,
    resolutionTime: 1440,
    conditions: [
      { field: 'category', operator: 'EQ', value: '退换货' },
    ],
    escalationLevels: [
      { level: 1, threshold: 120, notifyRoles: ['AGENT'], action: '提醒客服处理' },
      { level: 2, threshold: 720, notifyRoles: ['MANAGER'], action: '升级至售后经理' },
    ],
    createdBy: '管理员',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T11:20:00Z',
    applyCount: 3456,
    breachCount: 89,
    complianceRate: 97.4,
  },
  {
    id: '3',
    name: '物流异常工单规则',
    description: '物流丢失、破损、延迟等异常情况的处理时效要求',
    category: '物流',
    isActive: false,
    version: 1,
    responseTime: 60,
    resolutionTime: 2880,
    conditions: [
      { field: 'category', operator: 'EQ', value: '物流' },
    ],
    escalationLevels: [
      { level: 1, threshold: 240, notifyRoles: ['AGENT'], action: '提醒客服处理' },
      { level: 2, threshold: 1440, notifyRoles: ['MANAGER'], action: '升级至售后经理' },
    ],
    createdBy: '管理员',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    applyCount: 567,
    breachCount: 23,
    complianceRate: 95.9,
  },
  {
    id: '4',
    name: 'VIP客户专属规则',
    description: '针对VIP等级客户的特殊SLA保障，响应和解决时效均有提升',
    category: '客户等级',
    isActive: true,
    version: 5,
    responseTime: 10,
    resolutionTime: 120,
    conditions: [
      { field: 'customerLevel', operator: 'EQ', value: 'VIP' },
    ],
    escalationLevels: [
      { level: 1, threshold: 15, notifyRoles: ['MANAGER'], action: '售后经理关注' },
      { level: 2, threshold: 30, notifyRoles: ['ADMIN'], action: '升级至运营总监' },
      { level: 3, threshold: 60, notifyRoles: ['ADMIN'], action: '客服总监介入' },
    ],
    createdBy: '管理员',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-03-20T16:45:00Z',
    applyCount: 892,
    breachCount: 12,
    complianceRate: 98.7,
  },
];

const versionHistory = [
  {
    id: 'v3',
    version: 3,
    ruleName: '高优先级工单响应规则',
    changeReason: '根据Q1数据分析，高优先级工单解决时效需要从4小时缩短至2小时，以提升客户满意度',
    changedBy: '张经理',
    changedAt: '2024-03-15T14:30:00Z',
    changes: [
      { field: 'resolutionTime', before: 360, after: 240, type: '修改' },
      { field: 'escalationLevels[2].threshold', before: 180, after: 120, type: '修改' },
    ],
  },
  {
    id: 'v2',
    version: 2,
    ruleName: '高优先级工单响应规则',
    changeReason: '新增三级升级机制，确保严重问题能够及时上报到管理层',
    changedBy: '李总监',
    changedAt: '2024-02-10T10:15:00Z',
    changes: [
      { field: 'escalationLevels', before: '2级升级', after: '3级升级', type: '新增' },
    ],
  },
  {
    id: 'v1',
    version: 1,
    ruleName: '高优先级工单响应规则',
    changeReason: '初始版本创建，基于行业标准和公司实际情况制定',
    changedBy: '系统管理员',
    changedAt: '2024-01-10T09:00:00Z',
    changes: [
      { field: 'rule', before: '无', after: '规则创建', type: '创建' },
    ],
  },
];

const categories = ['全部分类', '响应时效', '退换货', '物流', '客户等级', '促销活动', '其他'];

export default function SLAPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredRules = mockSLARules.filter(rule => {
    const matchesSearch = !searchQuery ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '全部分类' || rule.category === selectedCategory;
    const matchesActive = !showActiveOnly || rule.isActive;
    return matchesSearch && matchesCategory && matchesActive;
  });

  const activeRules = filteredRules.filter(r => r.isActive).length;
  const avgCompliance = filteredRules.length > 0
    ? (filteredRules.reduce((sum, r) => sum + r.complianceRate, 0) / filteredRules.length).toFixed(1)
    : 0;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SLA 规则管理</h1>
            <p className="text-slate-500 mt-1">配置和管理售后服务的SLA规则，确保服务质量达标</p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
            <Plus className="h-4 w-4" />
            新建规则
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredRules.length}</p>
                  <p className="text-xs text-slate-500">规则总数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeRules}</p>
                  <p className="text-xs text-slate-500">已启用</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{avgCompliance}%</p>
                  <p className="text-xs text-slate-500">平均达标率</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredRules.reduce((sum, r) => sum + r.breachCount, 0)}</p>
                  <p className="text-xs text-slate-500">违规次数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="搜索规则名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
            <Switch id="active-only" checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
            <label htmlFor="active-only" className="text-sm text-slate-600 cursor-pointer">
              仅显示启用
            </label>
          </div>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules">规则列表</TabsTrigger>
            <TabsTrigger value="history">版本历史</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {filteredRules.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">没有找到匹配的SLA规则</p>
                  <p className="text-sm text-slate-400 mt-1">请尝试调整搜索条件</p>
                </CardContent>
              </Card>
            ) : (
              filteredRules.map(rule => (
                <Card key={rule.id} className="hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-indigo-200">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                            {rule.category}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-100 text-slate-600">
                            v{rule.version}
                          </Badge>
                          {rule.isActive ? (
                            <Badge variant="success">已启用</Badge>
                          ) : (
                            <Badge variant="secondary">已停用</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg hover:text-indigo-600 transition-colors cursor-pointer">
                          {rule.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {rule.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                          <Clock className="h-4 w-4" />
                          响应时效
                        </div>
                        <p className="text-xl font-bold text-slate-900">{formatMinutes(rule.responseTime)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                          <Clock className="h-4 w-4" />
                          解决时效
                        </div>
                        <p className="text-xl font-bold text-slate-900">{formatMinutes(rule.resolutionTime)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                          <Users className="h-4 w-4" />
                          适用工单
                        </div>
                        <p className="text-xl font-bold text-slate-900">{rule.applyCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                          <Shield className="h-4 w-4" />
                          达标率
                        </div>
                        <p className={`text-xl font-bold ${rule.complianceRate >= 97 ? 'text-green-600' : rule.complianceRate >= 95 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rule.complianceRate}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-indigo-50/30 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">触发条件</p>
                      <div className="flex flex-wrap gap-2">
                        {rule.conditions.map((cond, i) => (
                          <Badge key={i} variant="outline" className="bg-white text-slate-700">
                            {cond.field} {cond.operator} {cond.value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">升级机制</p>
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                        <div className="space-y-3">
                          {rule.escalationLevels.map((level, i) => (
                            <div key={i} className="flex items-start gap-4 pl-10 relative">
                              <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                i === 0 ? 'bg-amber-100 text-amber-700' :
                                i === 1 ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {level.level}
                              </div>
                              <div className="flex-1 bg-white border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-slate-800">第{level.level}级升级</span>
                                  <Badge variant="outline" className="text-xs">
                                    {formatMinutes(level.threshold)} 后触发
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">{level.action}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  通知：{level.notifyRoles.map(r => getStatusText(r)).join(', ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>更新于 {formatDate(rule.updatedAt)}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>由 {rule.createdBy} 创建</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        查看详情
                      </Button>
                      <Button
                        variant={rule.isActive ? 'outline' : 'default'}
                        size="sm"
                        className="gap-2"
                      >
                        {rule.isActive ? (
                          <><ToggleRight className="h-4 w-4" /> 停用</>
                        ) : (
                          <><ToggleLeft className="h-4 w-4" /> 启用</>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {versionHistory.map(version => (
              <Card key={version.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          v{version.version}
                        </Badge>
                        <CardTitle className="text-base">{version.ruleName}</CardTitle>
                      </div>
                      <CardDescription>
                        {version.changeReason}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {version.changes.map((change, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                        <Badge variant={change.type === '修改' ? 'warning' : change.type === '新增' ? 'success' : 'info'}>
                          {change.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{change.field}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <span className="text-red-600 line-through">{change.before}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-green-600">{change.after}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {version.changedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(version.changedAt)}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
