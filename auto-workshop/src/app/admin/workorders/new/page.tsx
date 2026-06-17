'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Vehicle {
  id: string;
  plateNo: string;
  brand: string;
  model: string;
  customer: { id: string; name: string };
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  items: { name: string; category: string }[];
}

interface Technician {
  id: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    customerId: '',
    templateId: '',
    technicianId: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/vehicles').then((r) => r.json()),
      fetch('/api/templates').then((r) => r.json()),
      fetch('/api/technicians?isActive=true').then((r) => r.json()),
    ])
      .then(([vehiclesData, templatesData, techniciansData]) => {
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        setTechnicians(Array.isArray(techniciansData) ? techniciansData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  useEffect(() => {
    if (selectedVehicle) {
      setForm((prev) => ({ ...prev, customerId: selectedVehicle.customer.id }));
    }
  }, [selectedVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.customerId) return;
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        vehicleId: form.vehicleId,
        customerId: form.customerId,
      };
      if (form.templateId) body.templateId = form.templateId;
      if (form.technicianId) body.technicianId = form.technicianId;

      const res = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const order = await res.json();
        router.push(`/admin/workorders/${order.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/workorders" className="text-gray-500 hover:text-gray-700">← 返回列表</Link>
        <h1 className="text-2xl font-bold">新建工单</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择车辆</label>
            <select
              className="input-field"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              required
            >
              <option value="">请选择车辆</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNo} - {v.brand} {v.model} ({v.customer.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">检测模板</label>
            <select
              className="input-field"
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              <option value="">不使用模板</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.items.length}项)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指派技师</label>
            <select
              className="input-field"
              value={form.technicianId}
              onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
            >
              <option value="">暂不指派</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.specialty ? ` (${t.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '创建中...' : '创建工单'}
            </button>
            <Link href="/admin/workorders" className="btn-secondary">取消</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
