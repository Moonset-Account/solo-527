'use client';

import { useState, useMemo } from 'react';
import { Search, BookOpen, FileText, Tag, Eye, ThumbsUp, Clock, Filter, ChevronRight, X } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncateText, formatDate, getStatusText, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

const mockKnowledge = [
  {
    id: '1',
    title: '如何处理7天无理由退换货申请',
    content: '当客户提交7天无理由退换货申请时，请按以下流程处理：1. 首先核实商品是否在退换货有效期内；2. 检查商品是否影响二次销售；3. 确认退款金额和运费承担方；4. 引导客户填写退换货快递单号；5. 收到退货后48小时内完成退款处理。注意事项：对于特殊商品（如定制商品、贴身衣物）需特别说明不支持无理由退换。',
    category: '退换货',
    tags: ['7天无理由', '退款流程', '运费'],
    type: 'ANSWER',
    status: 'ACTIVE',
    viewCount: 2341,
    usefulCount: 189,
    version: 3,
    createdBy: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-20T14:15:00Z',
  },
  {
    id: '2',
    title: '商品质量问题处理完整教程',
    content: '本教程详细介绍商品质量问题的处理流程和判定标准。第一章：质量问题判定标准，包括外观瑕疵、功能故障、包装破损等；第二章：证据收集规范，客户需要提供哪些照片或视频；第三章：处理方案选择，包括补发、换货、部分退款、全额退款等；第四章：常见问题解答，如何区分质量问题和人为损坏。',
    category: '质量问题',
    tags: ['质量问题', '判定标准', '处理流程', '证据'],
    type: 'TUTORIAL',
    status: 'ACTIVE',
    viewCount: 3567,
    usefulCount: 287,
    version: 5,
    createdBy: '李四',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-03-18T16:45:00Z',
  },
  {
    id: '3',
    title: '物流异常处理指南',
    content: '物流异常包括但不限于：包裹丢失、配送延迟、地址错误、签收异常等。处理步骤：1. 首先在物流系统中查询包裹状态；2. 联系物流公司确认异常原因；3. 根据异常类型采取相应措施：丢失则补发或退款，延迟则安抚客户并催促物流，地址错误则联系快递修改地址；4. 同步客户处理进度，每24小时更新一次。',
    category: '物流',
    tags: ['物流', '丢件', '配送延迟', '异常处理'],
    type: 'ANSWER',
    status: 'ACTIVE',
    viewCount: 1892,
    usefulCount: 156,
    version: 2,
    createdBy: '王五',
    createdAt: '2024-02-01T11:20:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
  },
  {
    id: '4',
    title: '客户投诉处理标准化流程',
    content: '当遇到客户投诉时，请遵循以下标准化流程：1. 耐心倾听，让客户充分表达不满，不要打断；2. 表达共情，使用"我理解您的感受"等话术；3. 确认问题，重复客户诉求确保理解正确；4. 提供解决方案，给出2-3个选项供客户选择；5. 达成共识，确认客户接受解决方案；6. 跟进落实，确保方案执行到位并回访客户满意度。',
    category: '客户服务',
    tags: ['投诉处理', '客户沟通', '服务技巧'],
    type: 'TUTORIAL',
    status: 'ACTIVE',
    viewCount: 2103,
    usefulCount: 198,
    version: 4,
    createdBy: '赵六',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-03-10T09:15:00Z',
  },
  {
    id: '5',
    title: '优惠券使用规则说明',
    content: '优惠券使用规则：1. 每张优惠券有有效期，请在有效期内使用；2. 部分商品不参与优惠券活动，以商品详情页为准；3. 同一订单只能使用一张优惠券；4. 优惠券不能兑换现金，不找零；5. 如订单发生退款，优惠券将按比例返还或作废；6. 平台拥有优惠券最终解释权。',
    category: '促销活动',
    tags: ['优惠券', '使用规则', '退款'],
    type: 'ANSWER',
    status: 'PENDING_INVALID',
    viewCount: 987,
    usefulCount: 45,
    version: 1,
    createdBy: '钱七',
    createdAt: '2024-02-15T16:30:00Z',
    updatedAt: '2024-03-05T11:00:00Z',
  },
  {
    id: '6',
    title: '大促期间客服话术培训',
    content: '大促期间客服话术培训教程：1. 开场白标准话术；2. 咨询高峰期应对策略；3. 发货延迟安抚话术；4. 退款咨询处理话术；5. 客户情绪安抚技巧；6. 常见问题快捷回复模板。本教程附带大量实战案例和模拟练习。',
    category: '客户服务',
    tags: ['大促', '话术', '培训', '高峰期'],
    type: 'TUTORIAL',
    status: 'ACTIVE',
    viewCount: 1567,
    usefulCount: 134,
    version: 2,
    createdBy: '孙八',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-12T15:30:00Z',
  },
  {
    id: '7',
    title: '旧版会员体系说明（已失效）',
    content: '本文档记录旧版会员体系的相关规则，仅供历史查询使用。',
    category: '会员',
    tags: ['会员', '积分', '等级'],
    type: 'ANSWER',
    status: 'INVALID',
    viewCount: 456,
    usefulCount: 12,
    version: 1,
    createdBy: '周九',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-02-28T17:00:00Z',
    invalidNote: '会员体系已全面升级，此文档已不适用',
    invalidResult: '已创建新版会员体系文档',
  },
];

const categories = ['全部分类', '退换货', '质量问题', '物流', '客户服务', '促销活动', '会员'];

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [showFilters, setShowFilters] = useState(false);

  const filteredKnowledge = useMemo(() => {
    return mockKnowledge.filter(item => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === '全部分类' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedType, selectedStatus]);

  const answerCount = filteredKnowledge.filter(k => k.type === 'ANSWER').length;
  const tutorialCount = filteredKnowledge.filter(k => k.type === 'TUTORIAL').length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">知识库</h1>
            <p className="text-slate-500 mt-1">搜索答案和教程，快速解决客户问题</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="搜索问题关键词、标签或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-base rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">分类</label>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">类型</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="ANSWER">问题答案</SelectItem>
                      <SelectItem value="TUTORIAL">教程文档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">状态</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="ACTIVE">有效</SelectItem>
                      <SelectItem value="PENDING_INVALID">待失效</SelectItem>
                      <SelectItem value="INVALID">已失效</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredKnowledge.length}</p>
                  <p className="text-xs text-slate-500">搜索结果</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{answerCount}</p>
                  <p className="text-xs text-slate-500">问题答案</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{tutorialCount}</p>
                  <p className="text-xs text-slate-500">教程文档</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredKnowledge.reduce((sum, k) => sum + k.viewCount, 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">总浏览量</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="ANSWER">答案 ({answerCount})</TabsTrigger>
            <TabsTrigger value="TUTORIAL">教程 ({tutorialCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderKnowledgeList(filteredKnowledge)}
          </TabsContent>
          <TabsContent value="ANSWER" className="space-y-4">
            {renderKnowledgeList(filteredKnowledge.filter(k => k.type === 'ANSWER'))}
          </TabsContent>
          <TabsContent value="TUTORIAL" className="space-y-4">
            {renderKnowledgeList(filteredKnowledge.filter(k => k.type === 'TUTORIAL'))}
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}

function renderKnowledgeList(items: typeof mockKnowledge) {
  if (items.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">没有找到匹配的知识内容</p>
          <p className="text-sm text-slate-400 mt-1">请尝试调整搜索关键词或筛选条件</p>
        </CardContent>
      </Card>
    );
  }

  return items.map(item => (
    <Card key={item.id} className="hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-200 hover:border-indigo-200">
      <Link href={`/knowledge/${item.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {item.type === 'ANSWER' ? (
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
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {item.category}
                </Badge>
                <Badge className={getStatusColor(item.status)}>
                  {getStatusText(item.status)}
                </Badge>
              </div>
              <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                {item.title}
              </CardTitle>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
          </div>
          <CardDescription className="line-clamp-2 mt-2">
            {truncateText(item.content, 150)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {item.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1 bg-slate-100 text-slate-600 hover:bg-slate-200">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-slate-500 border-t pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {item.viewCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {item.usefulCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(item.updatedAt)}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            v{item.version} · {item.createdBy}
          </span>
        </CardFooter>
      </Link>
    </Card>
  ));
}
