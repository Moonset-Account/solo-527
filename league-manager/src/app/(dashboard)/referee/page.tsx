'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Trophy, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IMatch, MatchStatus } from '@/types';

const statusMap: Record<MatchStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: '已排期', variant: 'info' },
  adjusting: { label: '调整中', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'success' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'default' },
  postponed: { label: '已延期', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export default function RefereeDashboard() {
  const { user, authHeaders } = useAuthStore();
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const headers: Record<string, string> = authHeaders();
        const res = await fetch(`/api/schedules?refereeId=${user._id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMatches(data.data || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authHeaders]);

  const needScore = matches.filter((m) => m.status === 'in_progress' || (m.status === 'completed'));
  const upcoming = matches.filter((m) => m.status === 'confirmed' || m.status === 'scheduled');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-gray-400">加载中...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">裁判仪表盘</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="已指派比赛" value={matches.length} icon={Calendar} color="#1B5E20" />
          <StatCard title="待录入比分" value={needScore.length} icon={Trophy} color="#F9A825" />
          <StatCard title="即将进行" value={upcoming.length} icon={AlertCircle} color="#1B5E20" />
        </div>

        {needScore.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-[#F9A825]" />
              <h3 className="font-medium text-yellow-800">需要录入比分的比赛</h3>
            </div>
            <div className="space-y-2">
              {needScore.slice(0, 3).map((m) => (
                <div key={m._id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-sm">{m.homeTeamId} vs {m.awayTeamId}</span>
                  <Link href="/referee/scores">
                    <Button size="sm">录入比分</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">已指派比赛</h2>
            <Link href="/referee/schedule" className="text-sm text-[#1B5E20] hover:underline">查看全部</Link>
          </div>
          {matches.length === 0 ? (
            <EmptyState title="暂无指派比赛" />
          ) : (
            <div className="divide-y">
              {matches.slice(0, 5).map((m) => {
                const s = statusMap[m.status];
                return (
                  <div key={m._id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.homeTeamId} vs {m.awayTeamId}</p>
                      <p className="text-xs text-gray-400">{new Date(m.matchDate).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
