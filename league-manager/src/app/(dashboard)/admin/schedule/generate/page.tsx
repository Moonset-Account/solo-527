'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Eye, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/stores/auth';
import type { ISeason, IVenue } from '@/types';

export default function ScheduleGeneratePage() {
  const { authHeaders } = useAuthStore();
  const [seasons, setSeasons] = useState<ISeason[]>([]);
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [interval, setInterval] = useState('7');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const headers: Record<string, string> = authHeaders();
      const [seasonsRes, venuesRes] = await Promise.all([
        fetch('/api/seasons', { headers }),
        fetch('/api/venues', { headers }),
      ]);
      if (seasonsRes.ok) {
        const data = await seasonsRes.json();
        setSeasons(data.data || []);
      }
      if (venuesRes.ok) {
        const data = await venuesRes.json();
        setVenues(data.data || []);
      }
    };
    fetchData();
  }, [authHeaders]);

  const toggleVenue = (id: string) => {
    setSelectedVenues((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          seasonId,
          startDate,
          intervalDays: Number(interval),
          venueIds: selectedVenues,
          preview: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data.data || data.matches || []);
        setShowPreview(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          seasonId,
          startDate,
          intervalDays: Number(interval),
          venueIds: selectedVenues,
        }),
      });
      if (res.ok) {
        setConfirmModal(false);
        window.location.href = '/admin/schedule';
      }
    } catch {
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">生成赛程</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="选择赛季"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              options={[
                { value: '', label: '请选择赛季' },
                ...seasons.map((s) => ({ value: s._id, label: s.name })),
              ]}
            />
            <Input
              label="开始日期"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="比赛间隔（天）"
              type="number"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              min={1}
              max={30}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择场地</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {venues.map((v) => (
                  <label key={v._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVenues.includes(v._id)}
                      onChange={() => toggleVenue(v._id)}
                      className="rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
                    />
                    <span className="text-sm">{v.name}</span>
                    {v.address && <span className="text-xs text-gray-400">({v.address})</span>}
                  </label>
                ))}
                {venues.length === 0 && <p className="text-sm text-gray-400">暂无场地</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={handlePreview} loading={loading}>
              <Eye size={16} className="mr-1" /> 预览赛程
            </Button>
            <Button onClick={() => setConfirmModal(true)}>
              <Zap size={16} className="mr-1" /> 生成赛程
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">赛程预览</h2>
            {Array.isArray(preview) && preview.length > 0 ? (
              <div className="space-y-2">
                {preview.map((item: unknown, i: number) => {
                  const m = item as Record<string, unknown>;
                  return (
                    <div key={i} className="flex items-center gap-4 text-sm p-2 bg-gray-50 rounded">
                      <Badge variant="info">第 {String(m.round || i + 1)} 轮</Badge>
                      <span>{String(m.homeTeamId || '主队')}</span>
                      <span className="text-gray-400">VS</span>
                      <span>{String(m.awayTeamId || '客队')}</span>
                      <span className="text-gray-400">{String(m.matchDate || '').slice(0, 10)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无预览数据</p>
            )}
          </div>
        )}
      </div>

      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="确认生成赛程">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">确定要生成赛程吗？此操作将创建所有比赛记录。</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p>赛季: {seasons.find((s) => s._id === seasonId)?.name || '-'}</p>
            <p>开始日期: {startDate || '-'}</p>
            <p>比赛间隔: {interval} 天</p>
            <p>已选场地: {selectedVenues.length} 个</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmModal(false)}>取消</Button>
            <Button loading={generating} onClick={handleGenerate}>确认生成</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
