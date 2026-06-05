'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, IMatch, MatchStatus } from '@/types';
import { extractName, extractId } from '@/lib/utils';

const statusMap: Record<MatchStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: '已排期', variant: 'info' },
  adjusting: { label: '调整中', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'success' },
  in_progress: { label: '进行中', variant: 'warning' },
  completed: { label: '已结束', variant: 'default' },
  postponed: { label: '已延期', variant: 'danger' },
  cancelled: { label: '已取消', variant: 'danger' },
};

export default function CaptainSchedulePage() {
  const { user, authHeaders } = useAuthStore();
  const [team, setTeam] = useState<ITeam | null>(null);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      try {
        const headers: Record<string, string> = authHeaders();
        const teamsRes = await fetch('/api/teams?captainId=' + user._id, { headers });
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          const myTeam = data.data?.[0] || null;
          setTeam(myTeam);
          if (myTeam) {
            const matchesRes = await fetch(`/api/schedules?teamId=${myTeam._id}`, { headers });
            if (matchesRes.ok) {
              const m = await matchesRes.json();
              setMatches(m.data || []);
            }
          }
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

  if (!team) {
    return (
      <DashboardLayout>
        <EmptyState title="尚未注册球队" description="请先注册球队后查看赛程" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">赛程查看</h1>

        {matches.length === 0 ? (
          <EmptyState title="暂无比赛" description="赛程尚未生成" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => {
              const s = statusMap[match.status];
              const isHome = extractId(match.homeTeamId) === team._id;
              const opponent = isHome ? match.awayTeamId : match.homeTeamId;
              return (
                <div key={match._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium">第 {match.round || '-'} 轮</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-500 mb-1">{isHome ? '主场' : '客场'}</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {team.name} <span className="text-gray-400 text-sm mx-1">VS</span> {extractName(opponent, '对手')}
                    </p>
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
