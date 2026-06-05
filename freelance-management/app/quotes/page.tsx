'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { quoteApi, clientApi, projectApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    client_id: '',
    title: '',
    description: '',
    tax: '0',
    discount: '0',
    valid_until: '',
    items: [{ description: '', quantity: '1', unit_price: '', amount: '' }],
  });
  const [loading, setLoading] = useState(true);

  const isClient = user?.role === Role.CLIENT;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotesData, clientsData, projectsData, templatesData] = await Promise.all([
        quoteApi.list(),
        isClient ? Promise.resolve([]) : clientApi.list(),
        isClient ? Promise.resolve([]) : projectApi.list(),
        isClient ? Promise.resolve([]) : quoteApi.templates(),
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setProjects(projectsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load quotes:', error);
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

  const applyTemplate = (template: any) => {
    setFormData({
      ...formData,
      items: template.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        amount: (item.quantity * item.unit_price).toString(),
      })),
    });
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
      await quoteApi.create({
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
      console.error('Failed to create quote:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      client_id: '',
      title: '',
      description: '',
      tax: '0',
      discount: '0',
      valid_until: '',
      items: [{ description: '', quantity: '1', unit_price: '', amount: '' }],
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      sent: '已发送',
      accepted: '已接受',
      rejected: '已拒绝',
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
            <h1 className="text-2xl font-bold text-gray-900">报价单</h1>
            <p className="text-gray-500 mt-1">管理项目报价和模板</p>
          </div>
          {!isClient && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建报价
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
              onClick={() => (window.location.href = `/quotes/${quote.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-sm text-gray-500">{quote.quote_number}</p>
                  <h3 className="font-semibold text-gray-900 mt-1">{quote.title}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    quote.status
                  )}`}
                >
                  {getStatusLabel(quote.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {quote.description || '暂无描述'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{quote.client_name}</span>
                <span className="font-bold text-lg text-gray-900">
                  ¥{quote.total_amount?.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">新建报价单</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      使用模板
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">报价标题 *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期至</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
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
      </div>
    </Layout>
  );
}
