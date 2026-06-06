'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Banknote, Smartphone, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const paymentMethods = [
  { value: 'bank_transfer', label: '银行转账', icon: Banknote },
  { value: 'alipay', label: '支付宝', icon: Smartphone },
  { value: 'wechat', label: '微信支付', icon: Smartphone },
  { value: 'cash', label: '现金', icon: DollarSign },
  { value: 'credit_card', label: '信用卡', icon: CreditCard },
];

export default function NewPaymentPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [invoiceId, setInvoiceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          invoiceId: invoiceId || null,
          projectId: projectId || null,
          clientId: clientId || null,
          description,
          paidAt,
        }),
      });

      if (res.ok) {
        router.push('/payments');
      }
    } catch (error) {
      console.error('创建失败', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">登记收款</h1>
          <p className="text-slate-500 mt-1">记录一笔新的收款</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>收款信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                收款金额 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold"
                  required
                />
              </div>
              {amount && (
                <p className="mt-2 text-lg font-bold text-primary">
                  {formatCurrency(parseFloat(amount) || 0)}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                收款方式 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        method === m.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  关联发票
                </label>
                <Input
                  placeholder="选择发票（可选）"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  关联项目
                </label>
                <Input
                  placeholder="选择项目（可选）"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                客户
              </label>
              <Input
                placeholder="选择客户（可选）"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                收款日期
              </label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                备注
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="添加备注信息..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting || !amount}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? '保存中...' : '保存收款记录'}
              </Button>
              <Link href="/payments" className="flex-1">
                <Button variant="outline" className="w-full">
                  取消
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
