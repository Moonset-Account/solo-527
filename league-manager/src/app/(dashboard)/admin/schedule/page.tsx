'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, User, Edit, Plus, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IMatch, MatchStatus, IVenue } from '@/types';
import { extractName } from '@/lib/utils';

const statusMap: Record<MatchStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: '已排期', variant: 'info' },
  adjusting: { label: '调整中', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'success' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'default' },
  postponed: { label: '已延期', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export default function AdminSchedulePage() {
  const { authHeaders } = useAuthStore();
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [venues, setVenues] = useState<IVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editModal, setEditModal] = useState<IMatch | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStatus, setEditStatus] = useState<MatchStatus>('scheduled');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = authHeaders();
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (venueFilter) params.set('venueId', venueFilter);
      if (teamFilter) params.set('teamId', teamFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const [matchesRes, teamsRes, venuesRes] = await Promise.all([
        fetch(`/api/schedules?${params}`, { headers }),
        fetch('/api/teams?status=approved&limit=100', { headers }),
        fetch('/api/venues', { headers }),
      ]);

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.data || []);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.data || []);
      }
      if (venuesRes.ok) {
        const data = await venuesRes.json();
        setVenues(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [authHeaders]);

  const handleFilter = () => fetchData();

  const openEdit = (match: IMatch) => {
    setEditModal(match);
    setEditDate(match.matchDate?.slice(0, 10) || '');
    const vid = typeof match.venueId === 'object' && match.venueId && '_id' in match.venueId
      ? (match.venueId as { _id: string })._id
      : String(match.venueId || '');
    setEditVenue(vid);
    setEditStatus(match.status);
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/schedules/${editModal._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          matchDate: editDate,
          venueId: editVenue || undefined,
          status: editStatus,
        }),
      });
      if (res.ok) {
        setEditModal(null);
        fetchData();
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
          <h1 className="text-2xl font-bold text-gray-900">赛程管理</h1>
          <Link href="/admin/schedule/generate">
            <Button><Plus size={16} className="mr-1" /> 生成赛程</Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-36">
              <Input label="开始日期" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="w-36">
              <Input label="结束日期" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="w-40">
              <Select
                label="场地"
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                options={[{ value: '', label: '全部' }, ...venues.map((v) => ({ value: v._id, label: v.name }))]}
              />
            </div>
            <div className="w-40">
              <Select
                label="球队"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                options={[{ value: '', label: '全部' }, ...teams.map((t) => ({ value: t._id, label: t.name }))]}
              />
            </div>
            <div className="w-32">
              <Select
                label="状态"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: '全部' },
                  { value: 'scheduled', label: '已排期' },
                  { value: 'confirmed', label: '已确认' },
                  { value: 'in_progress', label: '进行中' },
                  { value: 'completed', label: '已结束' },
                ]}
              />
            </div>
            <Button onClick={handleFilter} size="md">
              <Filter size={16} className="mr-1" /> 筛选
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : matches.length === 0 ? (
          <EmptyState title="暂无赛程" description="点击上方按钮生成赛程" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => {
              const s = statusMap[match.status];
              return (
                <div key={match._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">第 {match.round || '-'} 轮</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-semibold text-gray-900">{extractName(match.homeTeamId, '主队')}</span>
                      <span className="text-gray-400 text-sm">VS</span>
                      <span className="font-semibold text-gray-900">{extractName(match.awayTeamId, '客队')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(match.matchDate).toLocaleDateString('zh-CN')}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {extractName(match.venueId, '未指派')}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {extractName(match.refereeId, '未指派')}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(match)}>
                      <Edit size={14} className="mr-1" /> 编辑
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="编辑比赛">
        <div className="space-y-4">
          <Input label="比赛日期" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          <Select
            label="场地"
            value={editVenue}
            onChange={(e) => setEditVenue(e.target.value)}
            options={[{ value: '', label: '请选择' }, ...venues.map((v) => ({ value: v._id, label: v.name }))]}
          />
          <Select
            label="状态"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as MatchStatus)}
            options={[
              { value: 'scheduled', label: '已排期' },
              { value: 'confirmed', label: '已确认' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已结束' },
              { value: 'postponed', label: '延期' },
              { value: 'cancelled', label: '取消' },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModal(null)}>取消</Button>
            <Button loading={submitting} onClick={handleEdit}>保存</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
