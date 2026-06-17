'use client';

import { useState, useEffect } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Vehicle {
  id: string;
  plateNo: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  mileage: number | null;
  customerId: string;
  customer: Customer;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlateNo, setSearchPlateNo] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    plateNo: '',
    brand: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
    customerName: '',
    customerPhone: '',
  });

  const fetchVehicles = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchPlateNo) params.set('plateNo', searchPlateNo);
    if (searchBrand) params.set('brand', searchBrand);
    fetch(`/api/vehicles?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNo: form.plateNo,
          brand: form.brand,
          model: form.model,
          year: form.year ? Number(form.year) : undefined,
          vin: form.vin || undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
          customerId: '',
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        setForm({ plateNo: '', brand: '', model: '', year: '', vin: '', mileage: '', customerName: '', customerPhone: '' });
        fetchVehicles();
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
        <h1 className="text-2xl font-bold">车辆档案</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '取消' : '添加车辆'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车牌号</label>
            <input
              type="text"
              className="input-field"
              value={searchPlateNo}
              onChange={(e) => setSearchPlateNo(e.target.value)}
              placeholder="搜索车牌号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <input
              type="text"
              className="input-field"
              value={searchBrand}
              onChange={(e) => setSearchBrand(e.target.value)}
              placeholder="搜索品牌"
            />
          </div>
          <button type="submit" className="btn-primary">搜索</button>
        </div>
      </form>

      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">添加车辆</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车牌号 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.plateNo}
                  onChange={(e) => setForm({ ...form, plateNo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车型 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">里程(km)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车主姓名</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车主电话</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '添加中...' : '添加车辆'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无车辆</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">车牌号</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">品牌</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">车型</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">年份</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">VIN</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">里程</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">车主</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{v.plateNo}</td>
                    <td className="py-3 px-2">{v.brand}</td>
                    <td className="py-3 px-2">{v.model}</td>
                    <td className="py-3 px-2">{v.year || '-'}</td>
                    <td className="py-3 px-2">{v.vin || '-'}</td>
                    <td className="py-3 px-2">{v.mileage ? `${v.mileage}km` : '-'}</td>
                    <td className="py-3 px-2">{v.customer?.name || '-'}</td>
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
