'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Lock, Users, Edit } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/auth';
import type { ITeam, IPlayer, TeamStatus } from '@/types';

const statusMap: Record<TeamStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  pending: { label: '审核中', variant: 'warning' },
  approved: { label: '已通过', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
  withdrawn: { label: '已退出', variant: 'default' },
};

export default function CaptainTeamPage() {
  const { user, authHeaders } = useAuthStore();
  const [team, setTeam] = useState<ITeam | null>(null);
  const [players, setPlayers] = useState<IPlayer[]>([]);
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
            const rosterRes = await fetch(`/api/teams/${myTeam._id}/roster`, { headers });
            if (rosterRes.ok) {
              const r = await rosterRes.json();
              setPlayers(r.data || []);
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
        <EmptyState title="尚未注册球队" description="请先注册您的球队">
          <Link href="/captain/team/register"><Button className="mt-4">注册球队</Button></Link>
        </EmptyState>
      </DashboardLayout>
    );
  }

  const s = statusMap[team.status];
  const isLocked = !!team.rosterLockedAt;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">我的球队</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#1B5E20]/10 flex items-center justify-center">
                <Shield size={28} className="text-[#1B5E20]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  {isLocked && (
                    <Badge variant="danger">
                      <Lock size={10} className="mr-1" /> 名单已锁定
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isLocked && (
              <Link href="/captain/team/roster">
                <Button variant="ghost"><Edit size={14} className="mr-1" /> 管理名单</Button>
              </Link>
            )}
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">领队</span>
              <p className="font-medium">{team.contact || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">联系方式</span>
              <p className="font-medium">{team.phone || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">注册时间</span>
              <p className="font-medium">{new Date(team.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
          </div>

          {team.reviewComment && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              审核意见: {team.reviewComment}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">球员名单</h3>
              <span className="text-sm text-gray-400">({players.length}人)</span>
            </div>
            {isLocked && (
              <span className="text-xs text-[#D32F2F] flex items-center gap-1">
                <Lock size={12} /> 名单已锁定，不可修改
              </span>
            )}
          </div>
          {players.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">暂无球员</p>
          ) : (
            <div className="divide-y">
              {players.map((p) => (
                <div key={p._id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {p.jerseyNumber || '#'}
                    </span>
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.position && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{p.position}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
