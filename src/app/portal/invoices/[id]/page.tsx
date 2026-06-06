import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { ArrowLeft, FileText, Download, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function PortalInvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'CLIENT' || !session.user.clientId) {
    redirect('/');
  }

  const invoice = await prisma.invoice.findUnique({
    where: { 
      id: params.id,
      clientId: session.user.clientId,
    },
    include: {
      project: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!invoice) {
    redirect('/portal');
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">发票 {invoice.invoiceNumber}</h1>
              <p className="text-gray-500">
                关联项目：{invoice.project.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
            </span>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Download className="w-4 h-4 mr-2" />
              下载 PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">FlowWork</h2>
                      <p className="text-sm text-gray-500">自由职业设计工作室</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">发票编号</p>
                  <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-2">开票日期</p>
                  <p className="text-gray-900">{formatDate(invoice.issueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-2">到期日期</p>
                  <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-sm text-gray-500 mb-2">项目名称</p>
                <p className="text-gray-900 font-medium">{invoice.project.name}</p>
              </div>

              <div className="overflow-x-auto mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">项目描述</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">数量</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">单价</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-4 px-4 text-gray-900">{item.description}</td>
                        <td className="py-4 px-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="w-72 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">小计</span>
                      <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">税额 ({invoice.taxRate}%)</span>
                      <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                      <span className="text-gray-900">总计</span>
                      <span className="text-blue-900">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-500">已付款</span>
                      <span className="text-green-600 font-medium">{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">待付款</span>
                      <span className="text-amber-600 font-medium">{formatCurrency(invoice.total - invoice.amountPaid)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">备注</p>
                  <p className="text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">付款状态</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">开票日期</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">到期日期</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {invoice.payments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">付款记录</h2>
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {payment.method}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.status !== 'PAID' && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-2">付款方式</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>银行转账：</p>
                  <p className="font-mono bg-white p-2 rounded border border-blue-200">
                    开户行：中国工商银行
                  </p>
                  <p className="font-mono bg-white p-2 rounded border border-blue-200">
                    账号：6222 **** **** 1234
                  </p>
                  <p className="font-mono bg-white p-2 rounded border border-blue-200">
                    户名：张三
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
