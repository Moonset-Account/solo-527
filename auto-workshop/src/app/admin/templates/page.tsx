'use client';

import { useState, useEffect } from 'react';

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
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });
  const [items, setItems] = useState<{ name: string; category: string; isRequired: boolean; sortOrder: number }[]>([]);

  const fetchTemplates = () => {
    setLoading(true);
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const addItem = () => {
    setItems([...items, { name: '', category: '', isRequired: true, sortOrder: items.length }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | boolean | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          items: items.filter((item) => item.name && item.category),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', description: '' });
        setItems([]);
        fetchTemplates();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (templateId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">检测模板</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '新建模板'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">新建模板</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板名称 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">检测项目</label>
                <button type="button" className="btn-secondary text-sm" onClick={addItem}>
                  添加项目
                </button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start mb-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="项目名称"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="分类"
                    value={item.category}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                  />
                  <label className="flex items-center gap-1 text-sm text-gray-600 pt-2">
                    <input
                      type="checkbox"
                      checked={item.isRequired}
                      onChange={(e) => updateItem(index, 'isRequired', e.target.checked)}
                    />
                    必检
                  </label>
                  <input
                    type="number"
                    className="input-field w-20"
                    placeholder="排序"
                    value={item.sortOrder}
                    onChange={(e) => updateItem(index, 'sortOrder', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 pt-2 px-2"
                    onClick={() => removeItem(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '创建中...' : '创建模板'}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无模板</div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge-${template.isActive ? 'completed' : 'abnormal_closed'}`}>
                    {template.isActive ? '启用中' : '已停用'}
                  </span>
                  <button
                    className={`text-sm ${template.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleActive(template.id, template.isActive)}
                  >
                    {template.isActive ? '停用' : '启用'}
                  </button>
                </div>
              </div>
              {template.items.length > 0 && (
                <div className="space-y-2">
                  {(() => {
                    const groups: Record<string, TemplateItem[]> = {};
                    template.items.forEach((item) => {
                      if (!groups[item.category]) groups[item.category] = [];
                      groups[item.category].push(item);
                    });
                    return Object.entries(groups).map(([category, catItems]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {catItems.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {item.name}
                              {item.isRequired && <span className="ml-1 text-red-500">*</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                共 {template.items.length} 项 | 创建于 {new Date(template.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
