'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { invoiceApi, clientApi, projectApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    note: '',
  });
  const [formData, setFormData] = useState({
    project_id: '',
    client_id: '',
    title: '',
    description: '',
    amount: '',
    tax: '0',
    discount: '0',
    due_date: '',
    items: [{ description: '', quantity: '1', unit_price: '', amount: '' }],
  });
  const [loading, setLoading] = useState(true);

  const isClient = user?.role === Role.CLIENT;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, clientsData, projectsData] = await Promise.all([
        invoiceApi.list(),
        isClient ? Promise.resolve([]) : clientApi.list(),
        isClient ? Promise.resolve([]) : projectApi.list(),
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const amount = formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return amount + tax - discount;
  };

  const updateItemAmount = (index: number) => {
    const items = [...formData.items];
    const qty = parseFloat(items[index].quantity) || 0;
    const price = parseFloat(items[index].unit_price) || 0;
    items[index].amount = (qty * price).toString();
    setFormData({ ...formData, items });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: '1', unit_price: '', amount: '' }],
    });
  };

  const removeItem = (index: number) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = formData.items.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
      );
      await invoiceApi.create({
        ...formData,
        project_id: parseInt(formData.project_id),
        client_id: parseInt(formData.client_id),
        amount,
        tax: parseFloat(formData.tax) || 0,
        discount: parseFloat(formData.discount) || 0,
        total_amount: calculateTotal(),
        items: formData.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: parseFloat(item.amount) || 0,
        })),
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoiceApi.addPayment(selectedInvoice.id, {
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        note: paymentForm.note,
      });
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: '', payment_method: 'bank_transfer', note: '' });
      loadData();
    } catch (error) {
      console.error('Failed to add payment:', error);
    }
  };

  const handleSend = async (id: number) => {
    try {
      await invoiceApi.send(id);
      loadData();
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      client_id: '',
      title: '',
      description: '',
      amount: '',
      tax: '0',
      discount: '0',
      due_date: '',
      items: [{ description: '', quantity: '1', unit_price: '', amount: '' }],
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      sent: '已发送',
      paid: '已支付',
      overdue: '已逾期',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">发票管理</h1>
            <p className="text-gray-500 mt-1">管理所有发票和收款记录</p>
          </div>
          {!isClient && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建发票
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">发票编号</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">标题</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">客户</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">金额</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">到期日</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono text-sm text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">{invoice.title}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{invoice.client_name}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                    ¥{invoice.total_amount?.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{invoice.due_date || '-'}</td>
                  <td className="py-4 px-6 text-right">
                    {!isClient && invoice.status === 'draft' && (
                      <button
                        onClick={() => handleSend(invoice.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3"
                      >
                        发送
                      </button>
                    )}
                    {!isClient && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentForm({ ...paymentForm, amount: invoice.total_amount?.toString() || '' });
                          setShowPaymentModal(true);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium mr-3"
                      >
                        收款
                      </button>
                    )}
                    <button
                      onClick={() => (window.location.href = `/invoices/${invoice.id}`)}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">新建发票</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">项目</label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">选择项目</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
                    <select
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">选择客户</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">发票标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">明细项目</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + 添加项目
                    </button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="描述"
                          value={item.description}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[index].description = e.target.value;
                            setFormData({ ...formData, items });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="数量"
                          value={item.quantity}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[index].quantity = e.target.value;
                            setFormData({ ...formData, items });
                            updateItemAmount(index);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="单价"
                          value={item.unit_price}
                          onChange={(e) => {
                            const items = [...formData.items];
                            items[index].unit_price = e.target.value;
                            setFormData({ ...formData, items });
                            updateItemAmount(index);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="金额"
                          value={item.amount}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1 flex items-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">税额 (¥)</label>
                    <input
                      type="number"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">折扣 (¥)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">总计</label>
                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 font-semibold">
                      ¥{calculateTotal().toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">记录收款</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedInvoice.invoice_number}</p>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收款金额 *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">银行转账</option>
                    <option value="alipay">支付宝</option>
                    <option value="wechat">微信支付</option>
                    <option value="cash">现金</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    确认收款
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
