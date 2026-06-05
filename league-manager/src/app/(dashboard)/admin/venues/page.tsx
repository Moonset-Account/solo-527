'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IVenue } from '@/types';

export default function AdminVenuesPage() {
  const { authHeaders } = useAuthStore();
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; venue?: IVenue } | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [facilities, setFacilities] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/venues', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setVenues(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [authHeaders]);

  const openAdd = () => {
    setModal({ mode: 'add' });
    setName('');
    setAddress('');
    setFacilities('');
  };

  const openEdit = (venue: IVenue) => {
    setModal({ mode: 'edit', venue });
    setName(venue.name);
    setAddress(venue.address || '');
    setFacilities(venue.facilities.join(', '));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body = {
        name,
        address,
        facilities: facilities.split(',').map((f) => f.trim()).filter(Boolean),
      };
      const url = modal?.mode === 'edit' ? `/api/venues/${modal.venue?._id}` : '/api/venues';
      const method = modal?.mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setModal(null);
        fetchVenues();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">场地管理</h1>
          <Button onClick={openAdd}><Plus size={16} className="mr-1" /> 添加场地</Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : venues.length === 0 ? (
          <EmptyState title="暂无场地" description="点击上方按钮添加场地" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div key={venue._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1B5E20]/10 flex items-center justify-center">
                      <Building2 size={20} className="text-[#1B5E20]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                      {venue.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {venue.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={venue.active ? 'success' : 'default'}>
                    {venue.active ? '启用' : '停用'}
                  </Badge>
                </div>
                {venue.facilities.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1">
                    {venue.facilities.map((f, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(venue)}>
                    <Edit size={14} className="mr-1" /> 编辑
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? '编辑场地' : '添加场地'}
      >
        <div className="space-y-4">
          <Input label="场地名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入场地名称" required />
          <Input label="地址" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="请输入地址" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设施（逗号分隔）</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
              value={facilities}
              onChange={(e) => setFacilities(e.target.value)}
              placeholder="如: 更衣室, 照明, 停车场"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModal(null)}>取消</Button>
            <Button loading={submitting} onClick={handleSubmit}>
              {modal?.mode === 'edit' ? '保存' : '添加'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
