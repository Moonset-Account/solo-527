'use client';

import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Clock, User, Eye, CheckCircle, XCircle, Star, TrendingUp, MessageSquare, Search, Filter, Download, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusText, getStatusColor, truncateText } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const mockInvalidKnowledge = [
  {
    id: '5',
    title: '优惠券使用规则说明',
    category: '促销活动',
    type: 'ANSWER',
    status: 'PENDING_INVALID',
    viewCount: 987,
    usefulCount: 45,
    version: 1,
    createdBy: '钱七',
    createdAt: '2024-02-15T16:30:00Z',
    updatedAt: '2024-03-05T11:00:00Z',
    invalidNote: null,
    invalidResult: null,
    suggestedBy: '系统自动检测',
    suggestedReason: '近30天浏览量下降70%，且有用率低于30%',
    suggestedAt: '2024-03-20T10:00:00Z',
    satisfactionStats: {
      avgScore: 3.2,
      totalFeedbacks: 23,
      trend: 'down',
    },
  },
  {
    id: '7',
    title: '旧版会员体系说明（已失效）',
    category: '会员',
    type: 'ANSWER',
    status: 'INVALID',
    viewCount: 456,
    usefulCount: 12,
    version: 1,
    createdBy: '周九',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-02-28T17:00:00Z',
    invalidNote: '会员体系已全面升级，此文档已不适用。2024年1月起新会员体系上线，旧版规则仅作历史查询。',
    invalidResult: '已创建新版会员体系文档，链接：/knowledge/8。已在文档顶部添加失效提醒，并将搜索权重调整为0。',
    processedBy: '管理员',
    processedAt: '2024-02-28T17:00:00Z',
    satisfactionStats: {
      avgScore: 2.1,
      totalFeedbacks: 45,
      trend: 'down',
    },
  },
  {
    id: '8',
    title: '2023年双11活动规则',
    category: '促销活动',
    type: 'ANSWER',
    status: 'PENDING_INVALID',
    viewCount: 2341,
    usefulCount: 156,
    version: 2,
    createdBy: '吴十',
    createdAt: '2023-10-25T09:00:00Z',
    updatedAt: '2023-11-10T16:00:00Z',
    invalidNote: null,
    invalidResult: null,
    suggestedBy: '系统自动检测',
    suggestedReason: '活动已结束超过90天，且为时效性较强的活动规则',
    suggestedAt: '2024-03-18T08:00:00Z',
    satisfactionStats: {
      avgScore: 4.5,
      totalFeedbacks: 123,
      trend: 'stable',
    },
  },
];

const satisfactionTrendData = [
  { date: '3/14', score: 4.3, count: 45 },
  { date: '3/15', score: 4.5, count: 52 },
  { date: '3/16', score: 4.2, count: 38 },
  { date: '3/17', score: 4.6, count: 61 },
  { date: '3/18', score: 4.4, count: 55 },
  { date: '3/19', score: 4.7, count: 67 },
  { date: '3/20', score: 4.6, count: 58 },
];

const satisfactionDistribution = [
  { name: '非常满意', value: 156, color: '#10b981' },
  { name: '满意', value: 87, color: '#6366f1' },
  { name: '一般', value: 34, color: '#f59e0b' },
  { name: '不满意', value: 12, color: '#ef4444' },
  { name: '非常不满意', value: 5, color: '#991b1b' },
];

const categorySatisfaction = [
  { name: '退换货', score: 4.6, count: 89 },
  { name: '质量问题', score: 4.3, count: 112 },
  { name: '物流', score: 4.1, count: 67 },
  { name: '客户服务', score: 4.7, count: 95 },
  { name: '促销活动', score: 4.4, count: 45 },
];

const recentFeedbacks = [
  {
    id: 1,
    knowledgeTitle: '如何处理7天无理由退换货申请',
    knowledgeId: '1',
    user: '客服小明',
    score: 5,
    comment: '步骤很清晰，按照这个处理了一个客户的退款，很顺利！建议增加更多特殊情况的案例。',
    date: '2024-03-20T10:30:00Z',
    keywords: ['清晰', '实用', '建议补充'],
  },
  {
    id: 2,
    knowledgeTitle: '商品质量问题处理完整教程',
    knowledgeId: '2',
    user: '客服小红',
    score: 4,
    comment: '内容很详细，希望能增加更多图片说明。',
    date: '2024-03-20T09:15:00Z',
    keywords: ['详细', '需要图片'],
  },
  {
    id: 3,
    knowledgeTitle: '物流异常处理指南',
    knowledgeId: '3',
    user: '客服小李',
    score: 5,
    comment: '表格整理得很好，查运费规则很方便。',
    date: '2024-03-20T08:45:00Z',
    keywords: ['表格清晰', '方便'],
  },
  {
    id: 4,
    knowledgeTitle: '客户投诉处理标准化流程',
    knowledgeId: '4',
    user: '客服小张',
    score: 3,
    comment: '有些话术不够灵活，需要根据实际情况调整。',
    date: '2024-03-19T16:20:00Z',
    keywords: ['不够灵活'],
  },
  {
    id: 5,
    knowledgeTitle: '优惠券使用规则说明',
    knowledgeId: '5',
    user: '客服小王',
    score: 2,
    comment: '规则已经过时了，很多客户问的问题这里面没有。',
    date: '2024-03-19T14:10:00Z',
    keywords: ['过时', '需要更新'],
  },
];

const categories = ['全部分类', '退换货', '质量问题', '物流', '客户服务', '促销活动', '会员'];
const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'PENDING_INVALID', label: '待失效' },
  { value: 'INVALID', label: '已失效' },
];

export default function InvalidKnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('invalid');
  const [selectedKnowledge, setSelectedKnowledge] = useState<typeof mockInvalidKnowledge[0] | null>(null);
  const [invalidNote, setInvalidNote] = useState('');
  const [invalidResult, setInvalidResult] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredKnowledge = useMemo(() => {
    return mockInvalidKnowledge.filter(item => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '全部分类' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const pendingCount = mockInvalidKnowledge.filter(k => k.status === 'PENDING_INVALID').length;
  const invalidCount = mockInvalidKnowledge.filter(k => k.status === 'INVALID').length;

  const avgSatisfaction = 4.5;
  const totalFeedbacks = 294;

  const confirmInvalidMutation = useMutation({
    mutationFn: async () => {
      if (!invalidNote || !invalidResult || !selectedKnowledge) {
        throw new Error('请填写失效备注和处理结果');
      }
      const response = await fetch('/api/knowledge/invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeId: selectedKnowledge.id,
          invalidNote,
          invalidResult,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '标记失效失败');
      }
      return response.json();
    },
    onSuccess: () => {
      setToast({
        type: 'success',
        message: `已成功标记失效：${selectedKnowledge?.title}`,
      });
      setSelectedKnowledge(null);
      setInvalidNote('');
      setInvalidResult('');
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

  const keepActiveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedKnowledge) return null;
      const response = await fetch(`/api/knowledge/${selectedKnowledge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保留失败');
      }
      return response.json();
    },
    onSuccess: () => {
      setToast({
        type: 'success',
        message: `已保留：${selectedKnowledge?.title}`,
      });
      setSelectedKnowledge(null);
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

  const handleConfirmInvalid = () => {
    confirmInvalidMutation.mutate();
  };

  const handleKeepActive = () => {
    keepActiveMutation.mutate();
  };

  return (
    <PageWrapper title="知识失效管理" description="管理失效知识，分析客户满意度">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">知识失效管理与满意度统计</h1>
            <p className="text-slate-500 mt-1">管理失效知识，分析客户满意度，持续优化知识库质量</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报告
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                  <p className="text-xs text-slate-500">待失效</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{invalidCount}</p>
                  <p className="text-xs text-slate-500">已失效</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{avgSatisfaction}</p>
                  <p className="text-xs text-slate-500">平均满意度</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalFeedbacks}</p>
                  <p className="text-xs text-slate-500">评价总数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invalid" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invalid">知识失效管理</TabsTrigger>
            <TabsTrigger value="satisfaction">客户满意度统计</TabsTrigger>
          </TabsList>

          <TabsContent value="invalid" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="搜索知识标题..."
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {filteredKnowledge.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">没有找到匹配的知识记录</p>
                      <p className="text-sm text-slate-400 mt-1">请尝试调整搜索条件</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredKnowledge.map(item => (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all ${
                        selectedKnowledge?.id === item.id
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-indigo-200'
                      }`}
                      onClick={() => setSelectedKnowledge(item)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(item.status)}>
                                {getStatusText(item.status)}
                              </Badge>
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {item.category}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-100 text-slate-600">
                                v{item.version}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">{item.satisfactionStats.avgScore}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {item.status === 'PENDING_INVALID' && item.suggestedReason && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">失效建议原因</p>
                                <p className="text-sm text-amber-700">{item.suggestedReason}</p>
                                <p className="text-xs text-amber-600 mt-1">
                                  由 {item.suggestedBy} 于 {formatDate(item.suggestedAt)} 提出
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {item.status === 'INVALID' && item.invalidNote && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-red-800">失效备注</p>
                                <p className="text-sm text-red-700">{item.invalidNote}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>浏览 {item.viewCount.toLocaleString()}</span>
                          <span>有用 {item.usefulCount}</span>
                          <span>评价 {item.satisfactionStats.totalFeedbacks} 条</span>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-4 flex items-center justify-between text-sm text-slate-500">
                        <span>更新于 {formatDate(item.updatedAt)}</span>
                        <span>由 {item.createdBy} 创建</span>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>

              <div className="space-y-4">
                {selectedKnowledge ? (
                  <Card className="border-indigo-200 bg-indigo-50/30 sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-base">处理操作</CardTitle>
                      <CardDescription>
                        {selectedKnowledge.status === 'PENDING_INVALID'
                          ? '确认失效或保留该知识'
                          : '查看已失效知识详情'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">{selectedKnowledge.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(selectedKnowledge.status)}>
                            {getStatusText(selectedKnowledge.status)}
                          </Badge>
                          <Badge variant="outline">
                            满意度 {selectedKnowledge.satisfactionStats.avgScore}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      {selectedKnowledge.status === 'PENDING_INVALID' && (
                        <>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-1 block">
                                失效备注 <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                placeholder="请输入失效原因说明..."
                                value={invalidNote}
                                onChange={(e) => setInvalidNote(e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-1 block">
                                处理结果 <span className="text-red-500">*</span>
                              </Label>
                              <Textarea
                                placeholder="请输入处理结果，如是否已创建替代文档等..."
                                value={invalidResult}
                                onChange={(e) => setInvalidResult(e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-full gap-2 bg-red-600 hover:bg-red-700"
                              onClick={handleConfirmInvalid}
                              disabled={!invalidNote || !invalidResult || confirmInvalidMutation.isPending || keepActiveMutation.isPending}
                            >
                              {confirmInvalidMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              确认失效
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              onClick={handleKeepActive}
                              disabled={confirmInvalidMutation.isPending || keepActiveMutation.isPending}
                            >
                              {keepActiveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              保留继续使用
                            </Button>
                          </div>
                        </>
                      )}

                      {selectedKnowledge.status === 'INVALID' && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-1 block">失效备注</Label>
                            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border">
                              {selectedKnowledge.invalidNote}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-1 block">处理结果</Label>
                            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border">
                              {selectedKnowledge.invalidResult}
                            </p>
                          </div>
                          <div className="text-sm text-slate-500">
                            由 {selectedKnowledge.processedBy} 于 {formatDate(selectedKnowledge.processedAt || null)} 处理
                          </div>
                        </div>
                      )}

                      <Link href={`/knowledge/${selectedKnowledge.id}`}>
                        <Button variant="ghost" className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          查看完整知识
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">请选择一条知识记录</p>
                      <p className="text-sm text-slate-400 mt-1">查看详情并进行处理</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    满意度趋势
                  </CardTitle>
                  <CardDescription>近7天平均满意度变化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={satisfactionTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis domain={[0, 5]} fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    满意度分布
                  </CardTitle>
                  <CardDescription>各评分等级的评价数量</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="80%" height="100%">
                      <PieChart>
                        <Pie
                          data={satisfactionDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {satisfactionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 ml-4">
                      {satisfactionDistribution.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-slate-600">{item.name}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  各分类满意度对比
                </CardTitle>
                <CardDescription>按知识分类统计的平均满意度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySatisfaction}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={[0, 5]} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  最新用户评价
                </CardTitle>
                <CardDescription>用户对知识库内容的反馈</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentFeedbacks.map(feedback => (
                  <div key={feedback.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link href={`/knowledge/${feedback.knowledgeId}`} className="text-sm font-medium text-indigo-600 hover:underline">
                          {feedback.knowledgeTitle}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-600">{feedback.user}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= feedback.score ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(feedback.date)}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{feedback.comment}</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.keywords.map(kw => (
                        <Badge key={kw} variant="secondary" className="text-xs bg-slate-200 text-slate-700">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
