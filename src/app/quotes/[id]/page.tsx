'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  Clock,
  Eye,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface QuoteItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string | null;
  description: string;
  items: QuoteItem[];
  notes: string;
  terms: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700', icon: FileText },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: '已查看', color: 'bg-purple-100 text-purple-700', icon: Eye },
  accepted: { label: '已接受', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: '已过期', color: 'bg-orange-100 text-orange-700', icon: Clock },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotes/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setQuote(data.quote);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded w-48" />
        <div className="h-64 bg-slate-100 rounded-xl" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">报价单不存在</h3>
        <Link href="/quotes">
          <Button>返回报价单列表</Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[quote.status].icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-slate-900">{quote.title}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[quote.status].color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig[quote.status].label}
            </span>
          </div>
          <p className="text-slate-500 mt-1">报价单号: {quote.quoteNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出PDF
          </Button>
          {quote.status === 'draft' && (
            <Button>
              <Send className="w-4 h-4 mr-2" />
              发送给客户
            </Button>
          )}
          {quote.status !== 'accepted' && (
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>报价明细</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">项目</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">数量</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">单价</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-4 px-4 text-right text-sm font-medium text-slate-500">
                        总计
                      </td>
                      <td className="py-4 px-4 text-right text-xl font-bold text-primary">
                        {formatCurrency(quote.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{quote.notes}</p>
              </CardContent>
            </Card>
          )}

          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>条款</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{quote.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>客户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">客户名称</p>
                <p className="font-medium text-slate-900">{quote.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">联系邮箱</p>
                <p className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {quote.clientEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">关联项目</p>
                <Link href={`/projects/${quote.projectId}`} className="text-primary hover:underline">
                  {quote.projectName}
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日期信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  创建日期
                </span>
                <span className="text-slate-900">{formatDate(quote.createdAt)}</span>
              </div>
              {quote.validUntil && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    有效期至
                  </span>
                  <span className="text-slate-900">{formatDate(quote.validUntil)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="text-center">
                <DollarSign className="w-10 h-10 mx-auto text-primary mb-3" />
                <p className="text-sm text-primary/70">报价总额</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {formatCurrency(quote.totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
