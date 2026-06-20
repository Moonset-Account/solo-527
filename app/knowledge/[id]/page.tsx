'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, FileText, Tag, Eye, ThumbsUp, Clock, User, AlertTriangle, CheckCircle, Star, MessageSquare, Share2, Loader2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDate, getStatusText, getStatusColor, truncateText } from '@/lib/utils';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface KnowledgeDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: string;
  status: string;
  viewCount: number;
  usefulCount: number;
  version: number;
  invalidNote: string | null;
  invalidResult: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; name: string; email: string };
  satisfactions?: {
    id: string;
    score: number;
    feedback: string | null;
    keywords: string[];
    createdAt: string;
  }[];
  hits?: { id: string; matchScore: number; ticketId: string; createdAt: string }[];
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

interface RelatedKnowledge {
  id: string;
  title: string;
  category: string;
  type: string;
  status: string;
}

async function fetchKnowledgeDetail(id: string): Promise<KnowledgeDetail> {
  const response = await fetch(`/api/knowledge/${id}`);
  if (!response.ok) {
    throw new Error('获取知识详情失败');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '获取知识详情失败');
  }
  return result.data;
}

async function fetchSatisfactionStats(knowledgeId: string): Promise<SatisfactionStats> {
  const response = await fetch(`/api/satisfaction?knowledgeId=${knowledgeId}`);
  if (!response.ok) {
    throw new Error('获取满意度统计失败');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '获取满意度统计失败');
  }
  return result.data;
}

async function fetchRelatedKnowledge(category: string, currentId: string): Promise<RelatedKnowledge[]> {
  const response = await fetch(`/api/knowledge/search?category=${category}&pageSize=5`);
  if (!response.ok) {
    return [];
  }
  const result = await response.json();
  if (!result.success) {
    return [];
  }
  return (result.data.list || []).filter((item: RelatedKnowledge) => item.id !== currentId).slice(0, 3);
}

export default function KnowledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const knowledgeId = params.id as string;

  const { data: knowledge, isLoading: knowledgeLoading, error: knowledgeError } = useQuery({
    queryKey: ['knowledge-detail', knowledgeId],
    queryFn: () => fetchKnowledgeDetail(knowledgeId),
  });

  const { data: satisfactionData, isLoading: satisfactionLoading } = useQuery({
    queryKey: ['satisfaction-knowledge', knowledgeId],
    queryFn: () => fetchSatisfactionStats(knowledgeId),
    enabled: !!knowledgeId,
  });

  const { data: relatedKnowledge } = useQuery({
    queryKey: ['related-knowledge', knowledge?.category, knowledgeId],
    queryFn: () => fetchRelatedKnowledge(knowledge?.category || '', knowledgeId),
    enabled: !!knowledge?.category,
  });

  const satisfactionDistribution = useMemo(() => {
    if (!satisfactionData?.stats?.distribution) return [];
    const labels: Record<number, string> = {
      1: '非常不满意',
      2: '不满意',
      3: '一般',
      4: '满意',
      5: '非常满意',
    };
    return satisfactionData.stats.distribution
      .sort((a, b) => a.score - b.score)
      .map(d => ({
        name: labels[d.score] || `${d.score}星`,
        count: d.count,
      }));
  }, [satisfactionData]);

  const feedbackList = useMemo(() => {
    if (!satisfactionData?.list) return [];
    return satisfactionData.list.slice(0, 5).map(item => ({
      id: item.id,
      user: '用户评价',
      score: item.score,
      comment: item.feedback || '（无文字评价）',
      date: item.createdAt,
    }));
  }, [satisfactionData]);

  const avgScore = satisfactionData?.stats?.avgScore ? satisfactionData.stats.avgScore.toFixed(1) : '0.0';
  const totalFeedbacks = satisfactionData?.stats?.totalCount || 0;
  const creatorName = knowledge?.creator?.name || knowledge?.createdBy || '未知';

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (userRating <= 0) {
        throw new Error('请先选择评分');
      }
      const keywords = feedback
        .split(/[，。！？、\s]+/)
        .filter(word => word.length >= 2)
        .slice(0, 5);

      const response = await fetch('/api/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeId,
          ticketId: 'TK000000',
          score: userRating,
          feedback: feedback || undefined,
          keywords,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '提交失败');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsFeedbackSubmitted(true);
      setToast({
        type: 'success',
        message: '感谢您的评价！您的反馈将帮助我们不断改进知识库质量。',
      });
      queryClient.invalidateQueries({ queryKey: ['satisfaction-knowledge', knowledgeId] });
      queryClient.invalidateQueries({ queryKey: ['satisfaction-stats'] });
      setTimeout(() => {
        setIsFeedbackSubmitted(false);
        setFeedback('');
        setUserRating(0);
        setToast(null);
      }, 2000);
    },
    onError: (error: Error) => {
      setToast({
        type: 'error',
        message: error.message,
      });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const handleSubmitFeedback = () => {
    submitFeedbackMutation.mutate();
  };

  if (knowledgeLoading) {
    return (
      <PageWrapper title="知识详情" description="查看知识内容并提交满意度评价">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-slate-600">加载中...</span>
        </div>
      </PageWrapper>
    );
  }

  if (knowledgeError || !knowledge) {
    return (
      <PageWrapper title="知识详情" description="查看知识内容并提交满意度评价">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-700 font-medium">加载失败</p>
            <p className="text-sm text-slate-500 mt-1">
              {(knowledgeError as Error)?.message || '知识不存在或已被删除'}
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="知识详情" description="查看知识内容并提交满意度评价">
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {knowledge.category}
              </Badge>
              {knowledge.type === 'ANSWER' ? (
                <Badge variant="info" className="gap-1">
                  <FileText className="h-3 w-3" />
                  答案
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  教程
                </Badge>
              )}
              <Badge className={getStatusColor(knowledge.status)}>
                {getStatusText(knowledge.status)}
              </Badge>
              <span className="text-sm text-slate-400">v{knowledge.version}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            分享
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">{knowledge.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {creatorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    更新于 {formatDate(knowledge.updatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {knowledge.viewCount.toLocaleString()} 次浏览
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {knowledge.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 bg-slate-100 text-slate-600">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="prose prose-slate max-w-none">
                  {knowledge.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-3">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('**Q：')) {
                      return <p key={i} className="font-semibold text-slate-800 mt-4">{line}</p>;
                    }
                    if (line.startsWith('**A：')) {
                      return <p key={i} className="text-slate-700 ml-4">{line}</p>;
                    }
                    if (line.startsWith('| ')) {
                      return null;
                    }
                    if (line.match(/^\d+\./)) {
                      return <p key={i} className="text-slate-700 ml-4">{line}</p>;
                    }
                    if (line.startsWith('- ')) {
                      return <p key={i} className="text-slate-700 ml-4">{line}</p>;
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return <p key={i} className="text-slate-700">{line}</p>;
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 flex-col items-start gap-4">
                <div className="w-full">
                  <p className="text-sm font-medium text-slate-700 mb-2">这篇知识对您有帮助吗？</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      有帮助 ({knowledge.usefulCount})
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {knowledge.status === 'INVALID' && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    失效说明
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">失效备注</Label>
                    <p className="text-slate-600 mt-1">{knowledge.invalidNote || '暂无'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">处理结果</Label>
                    <p className="text-slate-600 mt-1">{knowledge.invalidResult || '暂无'}</p>
                  </div>
                  {(knowledge.processedBy || knowledge.processedAt) && (
                    <div className="text-sm text-slate-500 pt-2 border-t border-red-200">
                      由 {knowledge.processedBy || '未知'} 于 {formatDate(knowledge.processedAt)} 处理
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  满意度评价
                </CardTitle>
                <CardDescription>
                  平均评分 <span className="font-semibold text-amber-600">{avgScore}</span> / 5.0（共 {totalFeedbacks} 条评价）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {satisfactionLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-slate-600 text-sm">加载中...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={satisfactionDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-900">{avgScore}</div>
                      <div className="flex items-center justify-center mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= Math.round(parseFloat(avgScore)) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{totalFeedbacks} 条评价</p>
                    </div>
                  </div>
                )}

                <Separator />

                {!isFeedbackSubmitted ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">您的评价</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${
                                star <= (hoverRating || userRating)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">评价内容（可选）</Label>
                      <Textarea
                        placeholder="分享您使用这篇知识的体验，帮助其他客服同学..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={userRating === 0 || submitFeedbackMutation.isPending}
                      className="gap-2"
                    >
                      {submitFeedbackMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      提交评价
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-green-50 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">感谢您的评价！</p>
                    <p className="text-sm text-green-600 mt-1">您的反馈将帮助我们不断改进知识库质量。</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">用户评价</h4>
                  {feedbackList.length === 0 ? (
                    <div className="py-6 text-center">
                      <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">暂无评价，快来第一个评价吧！</p>
                    </div>
                  ) : (
                    feedbackList.map(item => (
                      <div key={item.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                              {item.user.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-700">{item.user}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= item.score ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm">{item.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">相关知识推荐</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!relatedKnowledge || relatedKnowledge.length === 0 ? (
                  <div className="py-4 text-center">
                    <BookOpen className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-slate-500 text-xs">暂无相关知识</p>
                  </div>
                ) : (
                  relatedKnowledge.map(item => (
                    <Link key={item.id} href={`/knowledge/${item.id}`}>
                      <div className="p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {item.type === 'ANSWER' ? (
                                <FileText className="h-3 w-3 text-blue-500" />
                              ) : (
                                <BookOpen className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <p className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                              {truncateText(item.title, 40)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-base text-indigo-900">知识统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">浏览次数</span>
                  <span className="font-semibold text-slate-900">{knowledge.viewCount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">有帮助</span>
                  <span className="font-semibold text-green-600">{knowledge.usefulCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">用户评价</span>
                  <span className="font-semibold text-indigo-600">{totalFeedbacks} 条</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">平均评分</span>
                  <span className="font-semibold text-amber-600">{avgScore}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">当前版本</span>
                  <span className="font-semibold text-slate-900">v{knowledge.version}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
