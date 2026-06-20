'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, FileText, Tag, Eye, ThumbsUp, ThumbsDown, Clock, User, AlertTriangle, CheckCircle, Star, MessageSquare, TrendingUp, Share2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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

const mockKnowledgeDetail = {
  id: '1',
  title: '如何处理7天无理由退换货申请',
  content: `当客户提交7天无理由退换货申请时，请按以下流程处理：

## 一、申请审核阶段

1. **核实有效期**：首先确认客户签收时间是否在7天内。计算方式：从物流签收次日零时开始计算，168小时（7×24小时）内。
2. **检查商品状态**：
   - 商品是否完好，是否影响二次销售
   - 包装是否完整（包括原包装、吊牌、配件等）
   - 是否有使用痕迹、污渍、损坏
3. **确认退款金额**：
   - 全额退款：商品完好，不影响二次销售
   - 部分退款：商品有轻微使用痕迹但不影响价值，按比例退款
   - 不予退款：商品严重损坏，影响二次销售

## 二、运费承担规则

| 责任方 | 运费承担 | 备注 |
|--------|----------|------|
| 客户原因（不喜欢、尺码不合适等） | 客户承担 | 建议购买运费险 |
| 商家原因（发错货、质量问题等） | 商家承担 | 客户先行垫付后凭票报销 |
| 商品质量问题 | 商家承担 | 需提供质量问题照片 |

## 三、退换货流程

1. 客服审核通过后，发送退换货地址给客户
2. 提醒客户在包裹内放置订单号纸条
3. 客户寄出后，索要快递单号并录入系统
4. 仓库收到退货后48小时内完成验收
5. 验收通过后，财务在24小时内完成退款

## 四、特殊商品说明

以下商品不支持7天无理由退换货：
- 定制类商品（刻字、个性化设计等）
- 贴身衣物（内衣、袜子、泳衣等）
- 虚拟商品（充值卡、电子券等）
- 一经激活或者试用后价值贬损较大的商品

## 五、常见问题处理

**Q：客户坚持要求退不支持的商品怎么办？**
A：先耐心解释规则，如客户仍不满意，可升级主管处理，特殊情况可酌情考虑。

**Q：超过7天但只差几小时怎么办？**
A：原则上按规则执行，但可根据客户情况酌情放宽，最多不超过24小时。

**Q：退款多久到账？**
A：支付宝1-2个工作日，微信3-5个工作日，银行卡5-7个工作日。`,
  category: '退换货',
  tags: ['7天无理由', '退款流程', '运费', '售后政策'],
  type: 'ANSWER',
  status: 'ACTIVE',
  viewCount: 2341,
  usefulCount: 189,
  notUsefulCount: 23,
  version: 3,
  createdBy: '张三',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-03-20T14:15:00Z',
  changeLog: [
    { version: 3, date: '2024-03-20', content: '新增特殊商品说明章节，更新退款到账时间' },
    { version: 2, date: '2024-02-15', content: '补充运费承担规则表格，优化常见问题解答' },
    { version: 1, date: '2024-01-15', content: '初始版本创建' },
  ],
};

const satisfactionData = [
  { name: '非常满意', count: 156, color: '#10b981' },
  { name: '满意', count: 87, color: '#6366f1' },
  { name: '一般', count: 34, color: '#f59e0b' },
  { name: '不满意', count: 12, color: '#ef4444' },
  { name: '非常不满意', count: 5, color: '#991b1b' },
];

const relatedKnowledge = [
  { id: '2', title: '商品质量问题处理完整教程', type: 'TUTORIAL', matchScore: 92 },
  { id: '3', title: '物流异常处理指南', type: 'ANSWER', matchScore: 78 },
  { id: '4', title: '客户投诉处理标准化流程', type: 'TUTORIAL', matchScore: 65 },
];

const feedbackList = [
  { id: 1, user: '客服小明', score: 5, comment: '步骤很清晰，按照这个处理了一个客户的退款，很顺利！', date: '2024-03-20' },
  { id: 2, user: '客服小红', score: 4, comment: '内容很详细，希望能增加更多特殊情况的案例。', date: '2024-03-18' },
  { id: 3, user: '客服小李', score: 5, comment: '表格整理得很好，查运费规则很方便。', date: '2024-03-15' },
];

export default function KnowledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const knowledge = mockKnowledgeDetail;
  const avgScore = 4.7;
  const totalFeedbacks = 294;

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
          knowledgeId: params.id as string,
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
                    {knowledge.createdBy}
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
                    <Button variant="outline" size="sm" className="gap-2">
                      <ThumbsDown className="h-4 w-4" />
                      没帮助 ({knowledge.notUsefulCount})
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
                    <p className="text-slate-600 mt-1">会员体系已全面升级，此文档已不适用</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">处理结果</Label>
                    <p className="text-slate-600 mt-1">已创建新版会员体系文档，建议参考新版内容</p>
                  </div>
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
                <div className="flex items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={satisfactionData} layout="vertical">
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
                          className={`h-5 w-5 ${star <= Math.round(avgScore) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{totalFeedbacks} 条评价</p>
                  </div>
                </div>

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
                  {feedbackList.map(item => (
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
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">{item.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  版本历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {knowledge.changeLog.map((log, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                        {index < knowledge.changeLog.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800">v{log.version}</span>
                          <span className="text-sm text-slate-500">{log.date}</span>
                          {index === 0 && (
                            <Badge variant="info" className="text-xs">当前版本</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{log.content}</p>
                      </div>
                    </div>
                  ))}
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
                {relatedKnowledge.map(item => (
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
                            <span className="text-xs text-slate-400">{item.matchScore}% 匹配</span>
                          </div>
                          <p className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {truncateText(item.title, 40)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
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
                  <span className="text-slate-600">没帮助</span>
                  <span className="font-semibold text-red-600">{knowledge.notUsefulCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">有用率</span>
                  <span className="font-semibold text-indigo-600">
                    {Math.round((knowledge.usefulCount / (knowledge.usefulCount + knowledge.notUsefulCount)) * 100)}%
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">关联工单</span>
                  <span className="font-semibold text-slate-900">156 单</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
