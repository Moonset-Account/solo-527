'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Receipt,
  Calendar,
  DollarSign,
  Send,
  CheckCircle,
  AlertTriangle,
  Download,
  Edit,
  Clock,
  Mail,
  Banknote,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string | null;
  createdAt: string;
  paidAt: string | null;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  payments: Array<{ id: string; amount: number; method: string; paidAt: string }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: '草稿', color: 'bg-slate-100 text-slate-700', icon: Receipt },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: '已查看', color: 'bg-purple-100 text-purple-700', icon: Clock },
  paid: { label: '已付款', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  overdue: { label: '已逾期', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-500', icon: Receipt },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data.invoice);
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

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <Receipt className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">发票不存在</h3>
        <Link href="/invoices">
          <Button>返回发票列表</Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[invoice.status].icon;
  const remainingAmount = invoice.totalAmount - invoice.paidAmount;

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
            <h1 className="text-2xl font-bold font-display text-slate-900">{invoice.title}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[invoice.status].color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig[invoice.status].label}
            </span>
          </div>
          <p className="text-slate-500 mt-1">发票号: {invoice.invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button>
              <Send className="w-4 h-4 mr-2" />
              发送给客户
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
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
              <CardTitle>发票明细</CardTitle>
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
                    {invoice.items.map((item) => (
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
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>收款记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-slate-500">{formatDate(payment.paidAt)}</p>
                        </div>
                      </div>
                      <span className="text-sm text-green-600 font-medium">已到账</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {invoice.terms && (
            <Card>
              <CardHeader>
                <CardTitle>付款条款</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{invoice.terms}</p>
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
                <p className="font-medium text-slate-900">{invoice.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">联系邮箱</p>
                <p className="text-slate-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {invoice.clientEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">关联项目</p>
                <Link href={`/projects/${invoice.projectId}`} className="text-primary hover:underline">
                  {invoice.projectName}
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
                  开票日期
                </span>
                <span className="text-slate-900">{formatDate(invoice.createdAt)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    到期日
                  </span>
                  <span className={`${invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-slate-900'}`}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    付款日期
                  </span>
                  <span className="text-green-600">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="text-center">
                <DollarSign className="w-10 h-10 mx-auto text-primary mb-3" />
                <p className="text-sm text-primary/70">发票金额</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {formatCurrency(invoice.totalAmount)}
                </p>
                {remainingAmount > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    待收: {formatCurrency(remainingAmount)}
                  </p>
                )}
                {remainingAmount === 0 && invoice.paidAmount > 0 && (
                  <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    已全部付清
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
