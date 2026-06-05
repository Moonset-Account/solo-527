'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  CheckCircle,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  method: 'bank_transfer' | 'alipay' | 'wechat' | 'cash' | 'credit_card';
  status: 'completed' | 'pending' | 'failed';
  invoiceId: string | null;
  projectId: string | null;
  description: string;
  paidAt: string;
  invoice?: { invoiceNumber: string; title: string };
  project?: { name: string };
}

const mockPayments: Payment[] = [
  {
    id: 'pay1',
    transactionId: 'TXN20240215001',
    amount: 25000,
    method: 'bank_transfer',
    status: 'completed',
    invoiceId: 'inv1',
    projectId: 'p1',
    description: '官网设计项目首付款',
    paidAt: '2024-02-15T10:30:00.000Z',
    invoice: { invoiceNumber: 'INV2024020001', title: '官网设计-首付款' },
    project: { name: '官网设计项目' },
  },
  {
    id: 'pay2',
    transactionId: 'TXN20240210002',
    amount: 15000,
    method: 'alipay',
    status: 'completed',
    invoiceId: null,
    projectId: 'p2',
    description: '品牌VI设计预付款',
    paidAt: '2024-02-10T14:20:00.000Z',
    project: { name: '品牌VI设计' },
  },
  {
    id: 'pay3',
    transactionId: 'TXN20240205003',
    amount: 8000,
    method: 'wechat',
    status: 'completed',
    invoiceId: null,
    projectId: null,
    description: 'Logo设计尾款',
    paidAt: '2024-02-05T09:15:00.000Z',
  },
  {
    id: 'pay4',
    transactionId: 'TXN20240220004',
    amount: 30000,
    method: 'bank_transfer',
    status: 'pending',
    invoiceId: 'inv2',
    projectId: 'p2',
    description: '品牌VI设计全款',
    paidAt: '2024-02-20T00:00:00.000Z',
    invoice: { invoiceNumber: 'INV2024020002', title: '品牌VI设计-全款' },
    project: { name: '品牌VI设计' },
  },
];

const methodConfig: Record<string, { label: string; icon: any; color: string }> = {
  bank_transfer: { label: '银行转账', icon: Banknote, color: 'text-blue-600 bg-blue-100' },
  alipay: { label: '支付宝', icon: Smartphone, color: 'text-sky-600 bg-sky-100' },
  wechat: { label: '微信', icon: Smartphone, color: 'text-green-600 bg-green-100' },
  cash: { label: '现金', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100' },
  credit_card: { label: '信用卡', icon: CreditCard, color: 'text-purple-600 bg-purple-100' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: '已到账', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-700', icon: Calendar },
  failed: { label: '失败', color: 'bg-red-100 text-red-700', icon: DollarSign },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setPayments(mockPayments);
      setIsLoading(false);
    }, 500);
  }, []);

  const totalThisMonth = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">收款记录</h1>
          <p className="text-slate-500 mt-1">记录每一笔到账，自动关联发票和项目</p>
        </div>
        <Link href="/payments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            登记收款
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索交易号、描述或项目..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">本月到账</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  {formatCurrency(totalThisMonth)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-200/50">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">待确认</p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-200/50">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length > 0 ? (
        <Card>
          <div className="divide-y divide-slate-100">
            {payments.map((payment, index) => {
              const MethodIcon = methodConfig[payment.method].icon;
              const StatusIcon = statusConfig[payment.status].icon;
              return (
                <div
                  key={payment.id}
                  className={`p-4 hover:bg-slate-50 transition-colors animate-fade-in animate-stagger-${(index % 4) + 1}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${methodConfig[payment.method].color}`}
                    >
                      <MethodIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">{payment.description}</p>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {payment.transactionId}
                            {payment.project && (
                              <>
                                <span className="mx-2">·</span>
                                {payment.project.name}
                              </>
                            )}
                            {payment.invoice && (
                              <>
                                <span className="mx-2">·</span>
                                <span className="text-primary">{payment.invoice.invoiceNumber}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-slate-900">
                            +{formatCurrency(payment.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[payment.status].color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[payment.status].label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {methodConfig[payment.method].label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          {formatDate(payment.paidAt)}
                        </p>
                        <Button variant="ghost" size="sm" className="h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <DollarSign className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">暂无收款记录</h3>
            <p className="text-slate-500 mb-6">登记您的第一笔收款</p>
            <Link href="/payments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                登记收款
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
