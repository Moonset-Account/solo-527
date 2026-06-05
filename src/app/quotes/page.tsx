'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  projectId: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string | null;
  project?: { name: string };
}

const mockQuotes: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 'Q2024010001',
    title: '官网设计项目报价',
    projectId: 'p1',
    totalAmount: 50000,
    status: 'accepted',
    createdAt: '2024-01-10T00:00:00.000Z',
    validUntil: '2024-02-15T00:00:00.000Z',
    project: { name: '官网设计项目' },
  },
  {
    id: 'q2',
    quoteNumber: 'Q2024010002',
    title: '品牌VI设计报价',
    projectId: 'p2',
    totalAmount: 30000,
    status: 'sent',
    createdAt: '2024-01-15T00:00:00.000Z',
    validUntil: '2024-02-01T00:00:00.000Z',
    project: { name: '品牌VI设计' },
  },
  {
    id: 'q3',
    quoteNumber: 'Q2024010003',
    title: '移动App UI设计报价',
    projectId: 'p3',
    totalAmount: 80000,
    status: 'draft',
    createdAt: '2024-01-20T00:00:00.000Z',
    validUntil: null,
    project: { name: '移动App设计' },
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700', icon: FileText },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: '已查看', color: 'bg-purple-100 text-purple-700', icon: Eye },
  accepted: { label: '已接受', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: '已过期', color: 'bg-orange-100 text-orange-700', icon: Clock },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setQuotes(mockQuotes);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = mockQuotes.filter(
      (q) =>
        q.title.includes(searchInput) ||
        q.quoteNumber.includes(searchInput) ||
        q.project?.name?.includes(searchInput)
    );
    setQuotes(filtered);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">报价单</h1>
          <p className="text-slate-500 mt-1">管理报价模板、发送和跟踪客户确认</p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建报价
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索报价单号、标题或项目..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选状态
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">待确认</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {quotes.filter((q) => q.status === 'sent' || q.status === 'viewed').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-200/50">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">已接受</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {quotes.filter((q) => q.status === 'accepted').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-200/50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">本月总额</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">
                  {formatCurrency(
                    quotes
                      .filter((q) => q.status === 'accepted')
                      .reduce((sum, q) => sum + q.totalAmount, 0)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-200/50">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : quotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotes.map((quote, index) => {
            const StatusIcon = statusConfig[quote.status].icon;
            return (
              <Card key={quote.id} className={`overflow-hidden animate-fade-in animate-stagger-${(index % 4) + 1}`}>
                <CardContent className="p-0">
                  <Link href={`/quotes/${quote.id}`}>
                    <div className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{quote.title}</p>
                            <p className="text-sm text-slate-500">{quote.quoteNumber}</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[quote.status].color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig[quote.status].label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(quote.createdAt)}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{quote.project?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-slate-900">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(quote.totalAmount)}
                        </div>
                      </div>

                      {quote.validUntil && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            有效期至: {formatDate(quote.validUntil)}
                          </span>
                          <Button variant="ghost" size="sm" className="h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无报价单</h3>
            <p className="text-slate-500 mb-6">创建您的第一份报价单发送给客户</p>
            <Link href="/quotes/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建报价
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
