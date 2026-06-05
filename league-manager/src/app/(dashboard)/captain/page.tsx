'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Calendar, Trophy, MessageSquare, Lock, Unlock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, IMatch, IScore, IMessage } from '@/types';

export default function CaptainDashboard() {
  const { user, authHeaders } = useAuthStore();
  const [team, setTeam] = useState<ITeam | null>(null);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [pendingScores, setPendingScores] = useState<IScore[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
            const [matchesRes, scoresRes, messagesRes] = await Promise.all([
              fetch(`/api/schedules?teamId=${myTeam._id}&limit=5`, { headers }),
              fetch(`/api/scores/pending?teamId=${myTeam._id}`, { headers }),
              fetch('/api/messages?read=false', { headers }),
            ]);
            if (matchesRes.ok) {
              const m = await matchesRes.json();
              setMatches(m.data || []);
            }
            if (scoresRes.ok) {
              const s = await scoresRes.json();
              setPendingScores(s.data || []);
            }
            if (messagesRes.ok) {
              const ms = await messagesRes.json();
              setUnreadCount((ms.data || []).length);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">领队仪表盘</h1>

        {team ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="球队状态"
                value={team.status === 'approved' ? '已通过' : team.status === 'pending' ? '审核中' : '已拒绝'}
                icon={Shield}
                color={team.status === 'approved' ? '#1B5E20' : '#F9A825'}
              />
              <StatCard
                title="名单锁定"
                value={team.rosterLockedAt ? '已锁定' : '未锁定'}
                icon={team.rosterLockedAt ? Lock : Unlock}
                color={team.rosterLockedAt ? '#D32F2F' : '#1B5E20'}
              />
              <StatCard title="待确认比分" value={pendingScores.length} icon={Trophy} color="#F9A825" />
              <StatCard title="未读消息" value={unreadCount} icon={MessageSquare} color="#1B5E20" />
            </div>

            {team.status !== 'approved' && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0" />
                球队尚未通过审核，部分功能暂不可用
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">近期比赛</h2>
                <Link href="/captain/schedule" className="text-sm text-[#1B5E20] hover:underline">查看全部</Link>
              </div>
              {matches.length === 0 ? (
                <p className="p-4 text-gray-400 text-sm">暂无比赛</p>
              ) : (
                <div className="divide-y">
                  {matches.map((m) => (
                    <div key={m._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{m.homeTeamId} vs {m.awayTeamId}</p>
                        <p className="text-xs text-gray-400">{new Date(m.matchDate).toLocaleDateString('zh-CN')}</p>
                      </div>
                      <Badge variant={m.status === 'completed' ? 'default' : 'info'}>
                        {m.status === 'scheduled' ? '已排期' : m.status === 'completed' ? '已结束' : m.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pendingScores.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">待确认比分</h2>
                  <Link href="/captain/scores" className="text-sm text-[#1B5E20] hover:underline">查看全部</Link>
                </div>
                <div className="divide-y">
                  {pendingScores.map((s) => (
                    <div key={s._id} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm">{s.matchId}</span>
                      <span className="text-sm font-medium">{s.homeScore} : {s.awayScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Shield size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">尚未注册球队</h3>
            <p className="text-sm text-gray-400 mt-1">请先注册您的球队</p>
            <Link href="/captain/team/register" className="mt-4 inline-block">
              <Button>注册球队</Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
