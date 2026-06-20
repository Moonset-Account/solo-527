'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const categories = ['全部分类', '退换货', '质量问题', '物流', '客户服务', '促销活动', '会员'];
const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'PENDING_INVALID', label: '待失效' },
  { value: 'INVALID', label: '已失效' },
];

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  type: string;
  status: string;
  viewCount: number;
  usefulCount: number;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  invalidNote: string | null;
  invalidResult: string | null;
  processedBy: string | null;
  processedAt: string | null;
  creator?: { name: string };
  satisfactions?: { score: number; feedback: string | null; createdAt: string }[];
}

interface KnowledgeSearchResponse {
  items: KnowledgeItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  highlights?: Record<string, string>;
}

interface SatisfactionStats {
  stats: {
    avgScore: number;
    totalCount: number;
    distribution: { score: number; count: number }[];
  };
  list: {
    id: string;
    score: number;
    feedback: string | null;
    keywords: string[];
    createdAt: string;
    knowledge?: { id: string; title: string };
  }[];
}

async function fetchInvalidKnowledge(status: string, searchQuery: string, page: number, pageSize: number): Promise<KnowledgeSearchResponse> {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (searchQuery) params.set('q', searchQuery);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const response = await fetch(`/api/knowledge/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('获取知识列表失败');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '获取知识列表失败');
  }
  return result.data;
}

async function fetchSatisfactionStats(): Promise<SatisfactionStats> {
  const response = await fetch('/api/satisfaction');
  if (!response.ok) {
    throw new Error('获取满意度统计失败');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '获取满意度统计失败');
  }
  return result.data;
}

export default function InvalidKnowledgePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('invalid');
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [invalidNote, setInvalidNote] = useState('');
  const [invalidResult, setInvalidResult] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const page = 1;
  const pageSize = 50;

  const { data: knowledgeData, isLoading: knowledgeLoading, error: knowledgeError } = useQuery({
    queryKey: ['knowledge-invalid', selectedStatus, searchQuery, page, pageSize],
    queryFn: () => fetchInvalidKnowledge(selectedStatus, searchQuery, page, pageSize),
  });

  const { data: satisfactionData, isLoading: satisfactionLoading, error: satisfactionError } = useQuery({
    queryKey: ['satisfaction-stats'],
    queryFn: fetchSatisfactionStats,
  });

  const filteredKnowledge = useMemo(() => {
    if (!knowledgeData?.items) return [];
    return knowledgeData.items.filter(item => {
      const matchesCategory = selectedCategory === '全部分类' || item.category === selectedCategory;
      return matchesCategory;
    });
  }, [knowledgeData, selectedCategory]);

  const pendingCount = filteredKnowledge.filter(k => k.status === 'PENDING_INVALID').length;
  const invalidCount = filteredKnowledge.filter(k => k.status === 'INVALID').length;

  const avgSatisfaction = satisfactionData?.stats?.avgScore ? satisfactionData.stats.avgScore.toFixed(1) : '0.0';
  const totalFeedbacks = satisfactionData?.stats?.totalCount || 0;

  const satisfactionDistribution = useMemo(() => {
    if (!satisfactionData?.stats?.distribution) return [];
    const labels: Record<number, string> = {
      1: '非常不满意',
      2: '不满意',
      3: '一般',
      4: '满意',
      5: '非常满意',
    };
    const colors: Record<number, string> = {
      1: '#991b1b',
      2: '#ef4444',
      3: '#f59e0b',
      4: '#6366f1',
      5: '#10b981',
    };
    return satisfactionData.stats.distribution.map(d => ({
      name: labels[d.score] || `${d.score}星`,
      value: d.count,
      color: colors[d.score] || '#6b7280',
    }));
  }, [satisfactionData]);

  const satisfactionTrendData = useMemo(() => {
    if (!satisfactionData?.list) return [];
    const dayMap = new Map<string, { totalScore: number; count: number }>();
    satisfactionData.list.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      if (!dayMap.has(date)) {
        dayMap.set(date, { totalScore: 0, count: 0 });
      }
      const d = dayMap.get(date)!;
      d.totalScore += item.score;
      d.count += 1;
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        score: parseFloat((data.totalScore / data.count).toFixed(1)),
        count: data.count,
      }))
      .slice(-7);
  }, [satisfactionData]);

  const recentFeedbacks = useMemo(() => {
    if (!satisfactionData?.list) return [];
    return satisfactionData.list.slice(0, 5).map(item => ({
      id: item.id,
      knowledgeTitle: item.knowledge?.title || '未知知识',
      knowledgeId: item.knowledge?.id || '',
      user: '用户评价',
      score: item.score,
      comment: item.feedback || '（无文字评价）',
      date: item.createdAt,
      keywords: item.keywords,
    }));
  }, [satisfactionData]);

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
      queryClient.invalidateQueries({ queryKey: ['knowledge-invalid'] });
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
      queryClient.invalidateQueries({ queryKey: ['knowledge-invalid'] });
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

  if (knowledgeLoading && activeTab === 'invalid') {
    return (
      <PageWrapper title="知识失效管理" description="管理失效知识，分析客户满意度">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-slate-600">加载中...</span>
        </div>
      </PageWrapper>
    );
  }

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
                  filteredKnowledge.map(item => {
                    const creatorName = item.creator?.name || item.createdBy || '未知';
                    const feedbackCount = item.satisfactions?.length || 0;
                    const avgScore = feedbackCount > 0
                      ? (item.satisfactions!.reduce((sum, s) => sum + s.score, 0) / feedbackCount).toFixed(1)
                      : '0.0';

                    return (
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
                              <span className="text-sm font-medium">{avgScore}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
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
                            <span>评价 {feedbackCount} 条</span>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4 flex items-center justify-between text-sm text-slate-500">
                          <span>更新于 {formatDate(item.updatedAt)}</span>
                          <span>由 {creatorName} 创建</span>
                        </CardFooter>
                      </Card>
                    );
                  })
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
                            满意度 {selectedKnowledge.satisfactions && selectedKnowledge.satisfactions.length > 0
                              ? (selectedKnowledge.satisfactions.reduce((sum, s) => sum + s.score, 0) / selectedKnowledge.satisfactions.length).toFixed(1)
                              : '0.0'}
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
                              {selectedKnowledge.invalidNote || '暂无'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-1 block">处理结果</Label>
                            <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border">
                              {selectedKnowledge.invalidResult || '暂无'}
                            </p>
                          </div>
                          {(selectedKnowledge.processedBy || selectedKnowledge.processedAt) && (
                            <div className="text-sm text-slate-500">
                              由 {selectedKnowledge.processedBy || '未知'} 于 {formatDate(selectedKnowledge.processedAt || null)} 处理
                            </div>
                          )}
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
            {satisfactionLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-slate-600">加载中...</span>
              </div>
            ) : satisfactionError ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-slate-700 font-medium">加载失败</p>
                  <p className="text-sm text-slate-500 mt-1">{(satisfactionError as Error).message}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        满意度趋势
                      </CardTitle>
                      <CardDescription>近期平均满意度变化</CardDescription>
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
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      最新用户评价
                    </CardTitle>
                    <CardDescription>用户对知识库内容的反馈</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentFeedbacks.length === 0 ? (
                      <div className="py-8 text-center">
                        <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">暂无评价数据</p>
                      </div>
                    ) : (
                      recentFeedbacks.map(feedback => (
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
                          {feedback.keywords && feedback.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {feedback.keywords.map(kw => (
                                <Badge key={kw} variant="secondary" className="text-xs bg-slate-200 text-slate-700">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
