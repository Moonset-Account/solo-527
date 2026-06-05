'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { IMatch, MatchStatus, ITeam } from '@/types';

const statusMap: Record<MatchStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: '已排期', variant: 'info' },
  adjusting: { label: '调整中', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'success' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'default' },
  postponed: { label: '已延期', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export default function PublicSchedulePage() {
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      if (teamFilter) params.set('teamId', teamFilter);

      const [matchesRes, teamsRes] = await Promise.all([
        fetch(`/api/schedules?${params}`),
        fetch('/api/teams?status=approved'),
      ]);
      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.data || []);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const teamName = (id: string) => teams.find((t) => t._id === id)?.name || id;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B5E20] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Trophy size={24} className="text-[#F9A825]" />
            <span className="font-bold text-lg">业余联赛管理系统</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/standings" className="text-sm text-white/80 hover:text-white">积分榜</Link>
            <Link href="/login" className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30">登录</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">公开赛程</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Input label="日期筛选" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div className="w-48">
              <Select
                label="球队筛选"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                options={[{ value: '', label: '全部球队' }, ...teams.map((t) => ({ value: t._id, label: t.name }))]}
              />
            </div>
            <Button onClick={fetchData} size="md">
              <Search size={16} className="mr-1" /> 筛选
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : matches.length === 0 ? (
          <EmptyState title="暂无赛程" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <span className="font-semibold text-gray-900">{teamName(match.homeTeamId)}</span>
                      <span className="text-gray-400 text-sm">VS</span>
                      <span className="font-semibold text-gray-900">{teamName(match.awayTeamId)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(match.matchDate).toLocaleDateString('zh-CN')}
                    </span>
                    {match.venueId && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {match.venueId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400">
        © 2024 业余联赛管理系统
      </footer>
    </div>
  );
}
