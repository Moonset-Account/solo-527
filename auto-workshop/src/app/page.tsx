'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  isRequired: boolean;
  sortOrder: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  items: TemplateItem[];
}

export default function HomePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    plateNo: '',
    serviceType: '',
    appointmentDate: '',
    timeSlot: '',
    remark: '',
  });

  useEffect(() => {
    fetch('/api/templates?isActive=true')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const groupedByCategory = (items: TemplateItem[]) => {
    const groups: Record<string, TemplateItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setForm({
          customerName: '',
          customerPhone: '',
          plateNo: '',
          serviceType: '',
          appointmentDate: '',
          timeSlot: '',
          remark: '',
        });
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">汽修工单检测系统</h1>
          <p className="text-xl text-blue-100">专业的汽车检测与维修服务管理平台</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">检测项目</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无检测模板</div>
          ) : (
            <div className="grid gap-6">
              {templates.map((template) => {
                const groups = groupedByCategory(template.items);
                return (
                  <div key={template.id} className="card">
                    <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-gray-600 mb-4">{template.description}</p>
                    )}
                    {Object.entries(groups).map(([category, items]) => (
                      <div key={category} className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span
                              key={item.id}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                                item.isRequired
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {item.name}
                              {item.isRequired && <span className="ml-1 text-red-500">*</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">预约服务</h2>
          <div className="card">
            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                预约提交成功！我们将尽快与您联系。
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.plateNo}
                    onChange={(e) => setForm({ ...form, plateNo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务类型</label>
                  <select
                    className="input-field"
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="常规保养">常规保养</option>
                    <option value="故障检测">故障检测</option>
                    <option value="维修服务">维修服务</option>
                    <option value="年检服务">年检服务</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
                  <select
                    className="input-field"
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    required
                  >
                    <option value="">请选择</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? '提交中...' : '提交预约'}
              </button>
            </form>
          </div>
        </section>

        <div className="text-center py-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
            管理后台入口 →
          </Link>
        </div>
      </div>
    </div>
  );
}
