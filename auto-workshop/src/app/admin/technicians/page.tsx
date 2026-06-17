'use client';

import { useState, useEffect } from 'react';

interface Technician {
  id: string;
  name: string;
  phone: string;
  specialty: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    specialty: '',
  });

  const fetchTechnicians = () => {
    setLoading(true);
    fetch('/api/technicians')
      .then((res) => res.json())
      .then((data) => {
        setTechnicians(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          specialty: form.specialty || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', phone: '', specialty: '' });
        fetchTechnicians();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (techId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/technicians/${techId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        fetchTechnicians();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">技师管理</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '添加技师'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">添加技师</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话 *</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专长</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '添加中...' : '添加技师'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无技师</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">姓名</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">电话</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">专长</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{tech.name}</td>
                    <td className="py-3 px-2">{tech.phone}</td>
                    <td className="py-3 px-2">{tech.specialty || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`badge-${tech.isActive ? 'completed' : 'abnormal_closed'}`}>
                        {tech.isActive ? '在职' : '停用'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        className={`text-sm ${tech.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(tech.id, tech.isActive)}
                      >
                        {tech.isActive ? '停用' : '启用'}
                      </button>
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
