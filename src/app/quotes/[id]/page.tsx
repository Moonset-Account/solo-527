'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Send, CheckCircle, XCircle, Download, Edit3 } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    contactPerson: string | null;
  };
  project: {
    id: string;
    name: string;
  };
  items: QuoteItem[];
}

export default function QuoteDetailPage() {
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  async function fetchQuote() {
    try {
      const res = await fetch(`/api/quotes/${params.id}`);
      const data = await res.json();
      setQuote(data);
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchQuote();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!quote) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">报价单不存在</p>
          <Link href="/quotes" className="text-blue-600 hover:underline mt-2 inline-block">
            返回报价单列表
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quotes" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
              <p className="text-gray-500">创建于 {formatDate(quote.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
              {getStatusLabel(quote.status)}
            </span>
            <div className="flex items-center gap-2">
              {quote.status === 'DRAFT' && (
                <button
                  onClick={() => updateStatus('SENT')}
                  className="inline-flex items-center px-3 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  发送
                </button>
              )}
              {quote.status === 'SENT' && (
                <>
                  <button
                    onClick={() => updateStatus('ACCEPTED')}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    接受
                  </button>
                  <button
                    onClick={() => updateStatus('REJECTED')}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    拒绝
                  </button>
                </>
              )}
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Download className="w-4 h-4 mr-2" />
                导出 PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">报价明细</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">项目描述</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">数量</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">单价</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{item.description}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={3} className="py-3 px-4 text-right text-gray-600">小计</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(quote.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-right text-gray-600">税额 ({quote.taxRate}%)</td>
                      <td className="py-2 px-4 text-right text-gray-900">{formatCurrency(quote.taxAmount)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-4 text-right font-semibold text-gray-900">总计</td>
                      <td className="py-3 px-4 text-right font-bold text-lg text-blue-900">{formatCurrency(quote.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {quote.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">备注</h2>
                <p className="text-gray-600">{quote.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">客户信息</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">客户名称</p>
                  <p className="font-medium text-gray-900">{quote.client.name}</p>
                </div>
                {quote.client.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-500">联系人</p>
                    <p className="text-gray-900">{quote.client.contactPerson}</p>
                  </div>
                )}
                {quote.client.email && (
                  <div>
                    <p className="text-sm text-gray-500">邮箱</p>
                    <p className="text-gray-900">{quote.client.email}</p>
                  </div>
                )}
                {quote.client.phone && (
                  <div>
                    <p className="text-sm text-gray-500">电话</p>
                    <p className="text-gray-900">{quote.client.phone}</p>
                  </div>
                )}
                {quote.client.address && (
                  <div>
                    <p className="text-sm text-gray-500">地址</p>
                    <p className="text-gray-900">{quote.client.address}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">关联项目</h2>
              <Link
                href={`/projects/${quote.project.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {quote.project.name}
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">时间信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">创建日期</span>
                  <span className="text-gray-900">{formatDate(quote.createdAt)}</span>
                </div>
                {quote.validUntil && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">有效期至</span>
                    <span className="text-gray-900">{formatDate(quote.validUntil)}</span>
                  </div>
                )}
                {quote.sentAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">发送日期</span>
                    <span className="text-gray-900">{formatDate(quote.sentAt)}</span>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">接受日期</span>
                    <span className="text-gray-900">{formatDate(quote.acceptedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
