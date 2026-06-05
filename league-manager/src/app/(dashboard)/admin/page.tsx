'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Calendar, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import type { IAuditLog } from '@/types';

interface DashboardStats {
  pendingTeams: number;
  weeklyMatches: number;
  pendingAppeals: number;
  totalTeams: number;
}

export default function AdminDashboard() {
  const { authHeaders } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTeams: 0,
    weeklyMatches: 0,
    pendingAppeals: 0,
    totalTeams: 0,
  });
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = authHeaders();

        const [teamsRes, appealsRes, auditRes] = await Promise.all([
          fetch('/api/teams?status=pending', { headers }),
          fetch('/api/appeals?status=pending', { headers }),
          fetch('/api/audit?limit=10', { headers }),
        ]);

        const teamsData = teamsRes.ok ? await teamsRes.json() : { data: [], total: 0 };
        const appealsData = appealsRes.ok ? await appealsRes.json() : { data: [], total: 0 };
        const auditData = auditRes.ok ? await auditRes.json() : { data: [] };

        const allTeamsRes = await fetch('/api/teams', { headers });
        const allTeamsData = allTeamsRes.ok ? await allTeamsRes.json() : { total: 0 };

        setStats({
          pendingTeams: teamsData.total || teamsData.data?.length || 0,
          weeklyMatches: 0,
          pendingAppeals: appealsData.total || appealsData.data?.length || 0,
          totalTeams: allTeamsData.total || 0,
        });
        setLogs(auditData.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authHeaders]);

  const moduleLabels: Record<string, string> = {
    team: '球队',
    schedule: '赛程',
    referee: '裁判',
    score: '比分',
    appeal: '申诉',
    venue: '场地',
    user: '用户',
  };

  const logColumns = [
    {
      key: 'createdAt',
      header: '时间',
      render: (row: IAuditLog) => new Date(row.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'module',
      header: '模块',
      render: (row: IAuditLog) => moduleLabels[row.module] || row.module,
    },
    { key: 'action', header: '操作' },
    {
      key: 'detail',
      header: '详情',
      render: (row: IAuditLog) => row.detail ? JSON.stringify(row.detail).slice(0, 50) : '-',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">管理员仪表盘</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="待审核球队" value={stats.pendingTeams} icon={ClipboardCheck} color="#F9A825" />
          <StatCard title="本周赛程" value={stats.weeklyMatches} icon={Calendar} color="#1B5E20" />
          <StatCard title="未处理申诉" value={stats.pendingAppeals} icon={AlertTriangle} color="#D32F2F" />
          <StatCard title="注册球队总数" value={stats.totalTeams} icon={Users} color="#1B5E20" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/teams/review">
            <Button variant="primary">报名审核</Button>
          </Link>
          <Link href="/admin/schedule/generate">
            <Button variant="secondary">生成赛程</Button>
          </Link>
          <Link href="/admin/referees">
            <Button variant="ghost">裁判指派</Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">最近操作</h2>
            <Link href="/admin/audit" className="text-sm text-[#1B5E20] hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <Table columns={logColumns} data={logs} emptyText="暂无操作记录" />
        </div>
      </div>
    </DashboardLayout>
  );
}
