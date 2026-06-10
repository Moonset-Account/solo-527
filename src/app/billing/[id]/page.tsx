import UserLayout from '@/components/user/UserLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  FileText,
  ArrowLeft,
  Download,
  CreditCard,
  Calendar,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const invoice = {
    id: 'inv_002',
    invoiceNumber: 'INV-2024-000002',
    amount: 299,
    paidAmount: 299,
    status: 'PAID',
    date: '2024-06-26T00:00:00Z',
    dueDate: '2024-07-10T00:00:00Z',
    paidAt: '2024-06-26T10:30:00Z',
    period: '2024年7月',
    currency: 'CNY',
    description: '专业版月度订阅',
    billingPeriod: '2024年6月26日 - 2024年7月26日',
  };

  const items = [
    { id: 1, description: '专业版订阅 - 月度', quantity: 1, unitPrice: 299, amount: 299 },
  ];

  const payments = [
    { id: 1, method: '支付宝', amount: 299, status: 'SUCCEEDED', date: '2024-06-26T10:30:00Z', transactionId: '2024062610300012345' },
  ];

  const customerInfo = {
    name: '张三',
    email: 'zhang@example.com',
    company: '示例科技有限公司',
  };

  return (
    <UserLayout>
      <div className="page-container">
        <div className="mb-6 animate-fade-in">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回账单列表
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 animate-slide-up">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">
                      账单 {invoice.invoiceNumber}
                    </h1>
                    <p className="text-slate-500">{invoice.description}</p>
                  </div>
                </div>
                <StatusBadge status={invoice.status} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 mb-1">账单日期</p>
                  <p className="font-medium text-slate-900">{formatDate(invoice.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">到期日</p>
                  <p className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">支付时间</p>
                  <p className="font-medium text-slate-900">{invoice.paidAt ? formatDate(invoice.paidAt, 'yyyy-MM-dd HH:mm') : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">账期</p>
                  <p className="font-medium text-slate-900">{invoice.period}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900 mb-4">账单明细</h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">项目</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">数量</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">单价</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">小计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 text-sm text-slate-700">{item.description}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 text-right">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-slate-700 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 text-right">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">小计</span>
                      <span className="text-slate-700">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">税费</span>
                      <span className="text-slate-700">{formatCurrency(0)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between">
                      <span className="font-semibold text-slate-900">总计</span>
                      <span className="font-display text-lg font-bold text-slate-900">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">已支付</span>
                      <span className="text-success-600 font-medium">{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                支付记录
              </h3>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <CreditCard className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{payment.method}</p>
                          <p className="text-xs text-slate-500">交易号: {payment.transactionId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-slate-500">{formatDate(payment.date, 'yyyy-MM-dd HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">暂无支付记录</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h3 className="font-semibold text-slate-900 mb-4">客户信息</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">客户名称</p>
                  <p className="font-medium text-slate-900">{customerInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">邮箱</p>
                  <p className="font-medium text-slate-900">{customerInfo.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">公司</p>
                  <p className="font-medium text-slate-900">{customerInfo.company}</p>
                </div>
              </div>
            </div>

            <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <h3 className="font-semibold text-slate-900 mb-4">操作</h3>
              <div className="space-y-3">
                <Button variant="primary" className="w-full" icon={<Download className="w-4 h-4" />}>
                  下载 PDF
                </Button>
                <Button variant="secondary" className="w-full" icon={<RefreshCw className="w-4 h-4" />}>
                  重新发送
                </Button>
                {invoice.status === 'OPEN' && (
                  <Button variant="accent" className="w-full" icon={<CreditCard className="w-4 h-4" />}>
                    立即支付
                  </Button>
                )}
                {invoice.status === 'PAID' && (
                  <button className="w-full text-left text-sm text-danger-600 hover:text-danger-700 font-medium px-4 py-2 hover:bg-danger-50 rounded-lg transition-colors">
                    申请退款
                  </button>
                )}
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-warning-50 to-white border-warning-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">需要帮助？</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    如果您对账单有任何疑问，请联系我们的客服团队，我们会尽快为您处理。
                  </p>
                  <a href="#" className="inline-block mt-3 text-xs font-medium text-primary-600 hover:text-primary-700">
                    联系客服 →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
