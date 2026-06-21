'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Filter,
  AlertCircle,
  Activity,
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
import AppLayout from '@/components/layout/AppLayout';
import { formatDate } from '@/lib/utils';

const mockQualityChecks = [
  {
    id: '1',
    orderNo: 'AP20240621002',
    customerName: '李四',
    plateNumber: '京B67890',
    vehicleModel: '奔驰E300L',
    result: 'passed',
    checkedBy: '张质检',
    checkedAt: '2024-06-21 14:30',
    failedCount: 0,
    remark: '各项指标正常，符合交付标准',
  },
  {
    id: '2',
    orderNo: 'AP20240621001',
    customerName: '张三',
    plateNumber: '京A12345',
    vehicleModel: '宝马530Li',
    result: 'failed',
    checkedBy: '张质检',
    checkedAt: '2024-06-21 11:00',
    failedCount: 2,
    failedItems: [
      {
        id: 'f1',
        name: '机油液位异常',
        description: '机油液位低于最低刻度线',
        impactScope: '发动机润滑系统',
        severity: 'high',
        action: '补充同型号机油至标准液位',
        nextStep: '重新检测机油压力',
        responsible: '李师傅',
        deadline: '2024-06-21 16:00',
        status: 'processing',
      },
      {
        id: 'f2',
        name: '空气滤芯安装不到位',
        description: '空气滤芯壳体密封不严',
        impactScope: '进气系统',
        severity: 'medium',
        action: '重新安装空气滤芯，确保密封',
        nextStep: '检查进气系统密封性',
        responsible: '王师傅',
        deadline: '2024-06-21 15:00',
        status: 'pending',
      },
    ],
  },
  {
    id: '3',
    orderNo: 'AP20240620002',
    customerName: '赵六',
    plateNumber: '京D22222',
    vehicleModel: '丰田凯美瑞',
    result: 'passed',
    checkedBy: '李质检',
    checkedAt: '2024-06-20 14:00',
    failedCount: 0,
    remark: '维修项目合格',
  },
  {
    id: '4',
    orderNo: 'AP20240620001',
    customerName: '钱七',
    plateNumber: '京E33333',
    vehicleModel: '本田雅阁',
    result: 'failed',
    checkedBy: '李质检',
    checkedAt: '2024-06-20 10:30',
    failedCount: 1,
    failedItems: [
      {
        id: 'f3',
        name: '气门室盖垫漏油',
        description: '气门室盖垫处有轻微渗漏',
        impactScope: '发动机上部',
        severity: 'low',
        action: '更换气门室盖垫',
        nextStep: '怠速运转30分钟复查',
        responsible: '张师傅',
        deadline: '2024-06-20 18:00',
        status: 'resolved',
      },
    ],
  },
];

const resultOptions = [
  { value: '', label: '全部结果' },
  { value: 'passed', label: '合格' },
  { value: 'failed', label: '不合格' },
];

export default function QualityPage() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState('');
  const [selectedCheck, setSelectedCheck] = useState<string | null>('2');

  const filteredChecks = mockQualityChecks.filter((check) => {
    const matchesSearch = !search ||
      check.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      check.customerName.includes(search) ||
      check.plateNumber.includes(search);
    const matchesResult = !result || check.result === result;
    return matchesSearch && matchesResult;
  });

  const selected = mockQualityChecks.find((c) => c.id === selectedCheck);

  const severityColors = {
    low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  };

  const statusColors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待处理' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: '处理中' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', label: '已解决' },
  };

  const stats = {
    total: mockQualityChecks.length,
    passed: mockQualityChecks.filter((c) => c.result === 'passed').length,
    failed: mockQualityChecks.filter((c) => c.result === 'failed').length,
    passRate: (mockQualityChecks.filter((c) => c.result === 'passed').length / mockQualityChecks.length * 100).toFixed(1),
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-metal-900">{stats.total}</p>
                  <p className="text-sm text-metal-600">总质检数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                  <p className="text-sm text-metal-600">合格</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-metal-600">不合格</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.passRate}%</p>
                  <p className="text-sm text-metal-600">合格率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>质检记录</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索订单号、客户、车牌号..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                    size="sm"
                  />
                </div>
                <Select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  options={resultOptions}
                  className="w-32"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {filteredChecks.map((check) => (
                  <button
                    key={check.id}
                    onClick={() => setSelectedCheck(check.id)}
                    className={`w-full p-4 text-left rounded-xl border transition-all ${
                      selectedCheck === check.id
                        ? 'border-primary-500 bg-primary-50/50 shadow-md'
                        : 'border-metal-200 hover:border-metal-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-metal-900">{check.orderNo}</span>
                          <Badge variant={check.result === 'passed' ? 'success' : 'danger'}>
                            {check.result === 'passed' ? '合格' : '不合格'}
                          </Badge>
                        </div>
                        <p className="text-sm text-metal-600">
                          {check.customerName} · {check.plateNumber} · {check.vehicleModel}
                        </p>
                        <p className="text-xs text-metal-400 mt-1">
                          {check.checkedBy} · {formatDate(check.checkedAt)}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-colors ${
                        selectedCheck === check.id ? 'text-primary-500' : 'text-metal-300'
                      }`} />
                    </div>
                    {check.result === 'failed' && check.failedCount > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {check.failedCount} 项不合格
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>质检详情</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-metal-900">{selected.orderNo}</h3>
                      <p className="text-sm text-metal-500">
                        {selected.customerName} · {selected.plateNumber} · {selected.vehicleModel}
                      </p>
                    </div>
                    <Badge variant={selected.result === 'passed' ? 'success' : 'danger'} size="md">
                      {selected.result === 'passed' ? '质检合格' : '质检不合格'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-metal-50 rounded-xl">
                    <div>
                      <p className="text-xs text-metal-500">质检人</p>
                      <p className="font-medium text-metal-900">{selected.checkedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-metal-500">质检时间</p>
                      <p className="font-medium text-metal-900">{formatDate(selected.checkedAt)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-metal-500">质检备注</p>
                      <p className="font-medium text-metal-900">{selected.remark || '无'}</p>
                    </div>
                  </div>

                  {selected.failedItems && selected.failedItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        不合格项 ({selected.failedItems.length})
                      </h4>

                      <div className="space-y-4">
                        {selected.failedItems.map((item) => {
                          const severity = severityColors[item.severity as keyof typeof severityColors];
                          const status = statusColors[item.status as keyof typeof statusColors];
                          return (
                            <div
                              key={item.id}
                              className={`p-4 rounded-xl border ${severity.border} ${severity.bg}/30`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h5 className={`font-semibold ${severity.text}`}>{item.name}</h5>
                                  <Badge className={status.bg + ' ' + status.text}>
                                    {status.label}
                                  </Badge>
                                </div>
                                <Badge className={severity.bg + ' ' + severity.text}>
                                  {item.severity === 'high' ? '严重' : item.severity === 'medium' ? '中等' : '轻微'}
                                </Badge>
                              </div>

                              <p className="text-sm text-metal-700 mb-3">{item.description}</p>

                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="p-3 bg-white rounded-lg border border-metal-200">
                                  <p className="text-xs text-metal-500 mb-1">影响范围</p>
                                  <p className="text-sm font-medium text-metal-800">{item.impactScope}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-metal-200">
                                  <p className="text-xs text-metal-500 mb-1">责任人</p>
                                  <p className="text-sm font-medium text-metal-800">{item.responsible}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="p-3 bg-white rounded-lg border border-metal-200">
                                  <p className="text-xs text-metal-500 mb-1">处理动作</p>
                                  <p className="text-sm text-metal-800">{item.action}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-metal-200">
                                  <p className="text-xs text-metal-500 mb-1">下一步</p>
                                  <p className="text-sm text-metal-800">{item.nextStep}</p>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-metal-200">
                                  <Clock className="w-4 h-4 text-metal-400" />
                                  <p className="text-xs text-metal-500">截止期限：</p>
                                  <p className="text-sm font-medium text-metal-800">{item.deadline}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selected.result === 'passed' && (
                    <div className="p-8 bg-green-50 rounded-xl text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-green-800">质检合格</h4>
                      <p className="text-sm text-green-600 mt-1">所有检查项均符合标准，可交付客户</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-metal-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>请选择一条质检记录查看详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
