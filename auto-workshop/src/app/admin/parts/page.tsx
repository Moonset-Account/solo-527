'use client';

import { useState, useEffect } from 'react';

interface Part {
  id: string;
  name: string;
  partNo: string;
  category: string | null;
  price: number;
  stock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchPartNo, setSearchPartNo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    partNo: '',
    category: '',
    price: '',
    stock: '',
    unit: '个',
  });

  const fetchParts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchName) params.set('name', searchName);
    if (searchPartNo) params.set('partNo', searchPartNo);
    fetch(`/api/parts?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setParts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          partNo: form.partNo,
          category: form.category || undefined,
          price: Number(form.price),
          stock: Number(form.stock),
          unit: form.unit,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', partNo: '', category: '', price: '', stock: '', unit: '个' });
        fetchParts();
      } else {
        const data = await res.json();
        alert(data.error || '添加失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">配件管理</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '添加配件'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配件名称</label>
            <input
              type="text"
              className="input-field"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="搜索名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配件编号</label>
            <input
              type="text"
              className="input-field"
              value={searchPartNo}
              onChange={(e) => setSearchPartNo(e.target.value)}
              placeholder="搜索编号"
            />
          </div>
          <button type="submit" className="btn-primary">搜索</button>
        </div>
      </form>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">添加配件</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配件名称 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配件编号 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.partNo}
                  onChange={(e) => setForm({ ...form, partNo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
                <input
                  type="number"
                  className="input-field"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">库存 *</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '添加中...' : '添加配件'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : parts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无配件</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">配件编号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">名称</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">分类</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">价格</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">库存</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">单位</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-mono">{part.partNo}</td>
                    <td className="py-3 px-2">{part.name}</td>
                    <td className="py-3 px-2">{part.category || '-'}</td>
                    <td className="py-3 px-2">¥{Number(part.price).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={part.stock <= 5 ? 'text-red-600 font-medium' : ''}>{part.stock}</span>
                    </td>
                    <td className="py-3 px-2">{part.unit}</td>
                    <td className="py-3 px-2">
                      <span className="text-gray-400 text-xs">查看</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
