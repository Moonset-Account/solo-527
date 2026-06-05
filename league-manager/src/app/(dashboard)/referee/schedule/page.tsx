'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { IMatch, MatchStatus } from '@/types';
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

export default function RefereeSchedulePage() {
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
        <h1 className="text-2xl font-bold text-gray-900">我的赛程</h1>

        {matches.length === 0 ? (
          <EmptyState title="暂无指派比赛" description="等待管理员指派比赛" />
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
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(match.matchDate).toLocaleDateString('zh-CN')}
                    </span>
                    {match.venueId && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {extractName(match.venueId, '待定')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
