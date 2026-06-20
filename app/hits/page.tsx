'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Target, Bell, Download, Check, X, Filter, Search, Eye, Tag, Clock, User, ChevronDown, Trash2, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusText, getStatusColor, truncateText } from '@/lib/utils';
import Link from 'next/link';

const mockHits = [
  {
    id: '1',
    knowledgeId: '1',
    knowledgeTitle: '如何处理7天无理由退换货申请',
    knowledgeCategory: '退换货',
    ticketId: 'TK20240320001',
    ticketTitle: '客户申请退货但已超过7天',
    matchScore: 0.94,
    matchKeywords: ['退货', '7天', '退款'],
    status: 'PENDING',
    createdAt: '2024-03-20T10:30:00Z',
    customerId: 'C001',
    customerName: '王小明',
    screenedBy: null,
    screenedAt: null,
  },
  {
    id: '2',
    knowledgeId: '2',
    knowledgeTitle: '商品质量问题处理完整教程',
    knowledgeCategory: '质量问题',
    ticketId: 'TK20240320002',
    ticketTitle: '收到的商品有划痕，要求换货',
    matchScore: 0.89,
    matchKeywords: ['质量问题', '划痕', '换货'],
    status: 'VALID',
    createdAt: '2024-03-20T09:15:00Z',
    customerId: 'C002',
    customerName: '李小红',
    screenedBy: '张经理',
    screenedAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '3',
    knowledgeId: '3',
    knowledgeTitle: '物流异常处理指南',
    knowledgeCategory: '物流',
    ticketId: 'TK20240320003',
    ticketTitle: '快递显示已签收但未收到货',
    matchScore: 0.87,
    matchKeywords: ['物流', '签收', '异常'],
    status: 'PENDING',
    createdAt: '2024-03-20T08:45:00Z',
    customerId: 'C003',
    customerName: '赵小刚',
    screenedBy: null,
    screenedAt: null,
  },
  {
    id: '4',
    knowledgeId: '1',
    knowledgeTitle: '如何处理7天无理由退换货申请',
    knowledgeCategory: '退换货',
    ticketId: 'TK20240319008',
    ticketTitle: '商品不喜欢想要退货',
    matchScore: 0.75,
    matchKeywords: ['退货', '不喜欢'],
    status: 'FALSE_POSITIVE',
    createdAt: '2024-03-19T16:20:00Z',
    customerId: 'C004',
    customerName: '孙小美',
    screenedBy: '李主管',
    screenedAt: '2024-03-19T17:00:00Z',
  },
  {
    id: '5',
    knowledgeId: '4',
    knowledgeTitle: '客户投诉处理标准化流程',
    knowledgeCategory: '客户服务',
    ticketId: 'TK20240319005',
    ticketTitle: '客户对处理结果不满意，要求升级投诉',
    matchScore: 0.91,
    matchKeywords: ['投诉', '不满意', '升级'],
    status: 'VALID',
    createdAt: '2024-03-19T14:10:00Z',
    customerId: 'C005',
    customerName: '周大龙',
    screenedBy: '张经理',
    screenedAt: '2024-03-19T15:30:00Z',
  },
  {
    id: '6',
    knowledgeId: '5',
    knowledgeTitle: '优惠券使用规则说明',
    knowledgeCategory: '促销活动',
    ticketId: 'TK20240319003',
    ticketTitle: '优惠券不能使用',
    matchScore: 0.82,
    matchKeywords: ['优惠券', '不能使用'],
    status: 'PENDING',
    createdAt: '2024-03-19T11:30:00Z',
    customerId: 'C006',
    customerName: '吴小芳',
    screenedBy: null,
    screenedAt: null,
  },
  {
    id: '7',
    knowledgeId: '2',
    knowledgeTitle: '商品质量问题处理完整教程',
    knowledgeCategory: '质量问题',
    ticketId: 'TK20240318012',
    ticketTitle: '电子产品开不了机',
    matchScore: 0.93,
    matchKeywords: ['质量问题', '开不了机', '故障'],
    status: 'VALID',
    createdAt: '2024-03-18T09:45:00Z',
    customerId: 'C007',
    customerName: '郑小伟',
    screenedBy: '王组长',
    screenedAt: '2024-03-18T11:00:00Z',
  },
  {
    id: '8',
    knowledgeId: '6',
    knowledgeTitle: '大促期间客服话术培训',
    knowledgeCategory: '客户服务',
    ticketId: 'TK20240318009',
    ticketTitle: '大促期间发货太慢了',
    matchScore: 0.68,
    matchKeywords: ['大促', '发货'],
    status: 'FALSE_POSITIVE',
    createdAt: '2024-03-18T08:20:00Z',
    customerId: 'C008',
    customerName: '冯小丽',
    screenedBy: '李主管',
    screenedAt: '2024-03-18T09:00:00Z',
  },
];

const categories = ['全部分类', '退换货', '质量问题', '物流', '客户服务', '促销活动'];
const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'PENDING', label: '待处理' },
  { value: 'VALID', label: '有效命中' },
  { value: 'FALSE_POSITIVE', label: '误报' },
];

export default function HitsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHits, setSelectedHits] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredHits = useMemo(() => {
    return mockHits.filter(hit => {
      const matchesSearch = !searchQuery ||
        hit.knowledgeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hit.ticketTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hit.matchKeywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === '全部分类' || hit.knowledgeCategory === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || hit.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const pendingCount = filteredHits.filter(h => h.status === 'PENDING').length;
  const validCount = filteredHits.filter(h => h.status === 'VALID').length;
  const falsePositiveCount = filteredHits.filter(h => h.status === 'FALSE_POSITIVE').length;
  const accuracy = validCount + falsePositiveCount > 0
    ? Math.round((validCount / (validCount + falsePositiveCount)) * 100)
    : 0;

  const handleSelectAll = () => {
    if (selectedHits.length === filteredHits.length) {
      setSelectedHits([]);
    } else {
      setSelectedHits(filteredHits.map(h => h.id));
    }
  };

  const handleSelectHit = (id: string) => {
    if (selectedHits.includes(id)) {
      setSelectedHits(selectedHits.filter(h => h !== id));
    } else {
      setSelectedHits([...selectedHits, id]);
    }
  };

  const screenMutation = useMutation({
    mutationFn: async (status: 'VALID' | 'FALSE_POSITIVE') => {
      const response = await fetch('/api/hits/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hitIds: selectedHits,
          status,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '筛查失败');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      setToast({
        type: 'success',
        message: `已成功将 ${data.data.updatedCount} 条记录标记为 ${getStatusText(variables)}`,
      });
      setSelectedHits([]);
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: Error) => {
      setToast({
        type: 'error',
        message: error.message,
      });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'xlsx' | 'csv') => {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hits',
          format,
          filters: {
            category: selectedCategory === '全部分类' ? undefined : selectedCategory,
            status: selectedStatus === 'all' ? undefined : selectedStatus,
            search: searchQuery || undefined,
          },
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `知识命中记录_${timestamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    },
    onSuccess: () => {
      setToast({
        type: 'success',
        message: '导出成功！文件已下载',
      });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error: Error) => {
      setToast({
        type: 'error',
        message: error.message,
      });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const handleBatchScreen = (status: 'VALID' | 'FALSE_POSITIVE') => {
    if (selectedHits.length === 0) return;
    screenMutation.mutate(status);
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    exportMutation.mutate(format);
  };

  return (
    <PageWrapper title="知识命中管理" description="管理知识命中记录，筛查审核后批量导出">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {toast.message}
          </span>
        </div>
      )}
      <div className="space-y-6">
        {showNotification && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">
                    有 <span className="font-bold">{pendingCount}</span> 条知识命中待筛查
                  </p>
                  <p className="text-sm text-amber-700">请及时审核，确保知识库准确度</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowNotification(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">知识命中管理</h1>
            <p className="text-slate-500 mt-1">管理系统自动命中的知识记录，筛查审核后可导出分析</p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="xlsx" onValueChange={(v) => handleExport(v as 'xlsx' | 'csv')}>
              <SelectTrigger className="w-[140px]">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  导出
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredHits.length}</p>
                  <p className="text-xs text-slate-500">命中总数</p>
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
                  <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                  <p className="text-xs text-slate-500">待筛查</p>
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
                  <p className="text-2xl font-bold text-slate-900">{validCount}</p>
                  <p className="text-xs text-slate-500">有效命中</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{accuracy}%</p>
                  <p className="text-xs text-slate-500">准确率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="搜索知识标题、工单内容或关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <div className="w-full sm:w-40">
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
          <div className="w-full sm:w-40">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedHits.length > 0 && (
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-indigo-900">
                    已选择 <span className="font-bold">{selectedHits.length}</span> 条记录
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleBatchScreen('VALID')}
                  disabled={screenMutation.isPending}
                >
                  {screenMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  标记有效
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-red-600 hover:bg-red-700"
                  onClick={() => handleBatchScreen('FALSE_POSITIVE')}
                  disabled={screenMutation.isPending}
                >
                  {screenMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  标记误报
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedHits([])} disabled={screenMutation.isPending}>
                  取消选择
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">命中记录列表</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedHits.length === filteredHits.length && filteredHits.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-slate-600 cursor-pointer">
                  全选
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filteredHits.length === 0 ? (
                <div className="py-12 text-center">
                  <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">没有找到匹配的命中记录</p>
                  <p className="text-sm text-slate-400 mt-1">请尝试调整搜索条件</p>
                </div>
              ) : (
                filteredHits.map(hit => (
                  <div key={hit.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedHits.includes(hit.id)}
                        onCheckedChange={() => handleSelectHit(hit.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(hit.status)}>
                                {getStatusText(hit.status)}
                              </Badge>
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {hit.knowledgeCategory}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-100 text-slate-600">
                                匹配度 {Math.round(hit.matchScore * 100)}%
                              </Badge>
                            </div>
                            <Link href={`/knowledge/${hit.knowledgeId}`} className="hover:text-indigo-600">
                              <h4 className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                                {hit.knowledgeTitle}
                              </h4>
                            </Link>
                            <p className="text-sm text-slate-500 mt-1">
                              关联工单：<span className="text-slate-700">{hit.ticketTitle}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {hit.matchKeywords.map(kw => (
                                <Badge key={kw} variant="secondary" className="gap-1 bg-slate-100 text-slate-600">
                                  <Tag className="h-3 w-3" />
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button variant="ghost" size="sm" className="gap-1 h-8">
                              <Eye className="h-4 w-4" />
                              详情
                            </Button>
                            {hit.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <Button variant="default" size="sm" className="gap-1 h-7 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleBatchScreen('VALID')}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button variant="default" size="sm" className="gap-1 h-7 px-2 bg-red-600 hover:bg-red-700" onClick={() => handleBatchScreen('FALSE_POSITIVE')}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {hit.customerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(hit.createdAt)}
                          </span>
                          {hit.screenedBy && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span>
                                由 <span className="text-slate-700">{hit.screenedBy}</span> 于 {formatDate(hit.screenedAt)} 筛查
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
