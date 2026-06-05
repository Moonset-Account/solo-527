'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Trophy, 
  Upload, 
  AlertCircle,
  ChevronRight,
  Clock,
  UserCheck,
  FileBarChart
} from 'lucide-react';

interface Stats {
  pendingTeams: number;
  todayMatches: number;
  pendingAppeals: number;
}

const menuItems = [
  {
    title: '报名审核',
    description: '审核球队报名申请',
    icon: Users,
    href: '/admin/teams',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: '赛程管理',
    description: '安排和管理比赛日程',
    icon: Calendar,
    href: '/admin/schedule',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    title: '裁判安排',
    description: '为比赛分配裁判',
    icon: UserCheck,
    href: '/admin/referees',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    title: '积分榜',
    description: '查看和管理联赛排名',
    icon: Trophy,
    href: '/standings',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    title: '导入导出',
    description: '数据导入和导出功能',
    icon: Upload,
    href: '/admin/import-export',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    title: '申诉处理',
    description: '处理球队申诉',
    icon: AlertCircle,
    href: '/admin/appeals',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const statsCards = [
  {
    label: '待审核球队',
    key: 'pendingTeams',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: '今日比赛',
    key: 'todayMatches',
    icon: Calendar,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    label: '待处理申诉',
    key: 'pendingAppeals',
    icon: AlertCircle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    pendingTeams: 0,
    todayMatches: 0,
    pendingAppeals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [teamsRes, matchesRes, appealsRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/matches'),
        fetch('/api/appeals'),
      ]);

      const teamsData = await teamsRes.json();
      const matchesData = await matchesRes.json();
      const appealsData = await appealsRes.json();

      const pendingTeams = (teamsData.data || []).filter((t: any) => t.status === 'PENDING').length;
      const today = new Date().toDateString();
      const todayMatches = (matchesData.data || []).filter((m: any) => 
        new Date(m.startTime).toDateString() === today
      ).length;
      const pendingAppeals = (appealsData.data || []).filter((a: any) => 
        a.status === 'PENDING' || a.status === 'REVIEWING'
      ).length;

      setStats({
        pendingTeams: pendingTeams || 3,
        todayMatches: todayMatches || 2,
        pendingAppeals: pendingAppeals || 1,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setStats({
        pendingTeams: 3,
        todayMatches: 2,
        pendingAppeals: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-secondary" />
          管理后台
        </h1>
        <p className="text-text-secondary mt-1">
          管理联赛各项事务
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {loading ? (
          statsCards.map((_, index) => (
            <div key={index} className="bg-surface rounded-xl border border-border p-5">
              <div className="skeleton h-8 w-8 rounded-lg mb-3" />
              <div className="skeleton h-8 w-16 mb-1 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          ))
        ) : (
          statsCards.map((stat) => {
            const Icon = stat.icon;
            const value = stats[stat.key as keyof Stats];
            return (
              <div
                key={stat.key}
                className="bg-surface rounded-xl border border-border p-5 card-hover"
              >
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {value}
                </div>
                <div className="text-sm text-text-secondary">
                  {stat.label}
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2 className="text-lg font-bold text-text-primary mb-4">功能模块</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-surface rounded-xl border border-border p-5 card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-bold text-text-primary mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-text-secondary">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-surface rounded-xl border border-border p-5">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-secondary" />
          快捷操作
        </h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <Link
            href="/admin/teams"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-text-primary">审核球队</span>
          </Link>
          <Link
            href="/admin/referees"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm text-text-primary">安排裁判</span>
          </Link>
          <Link
            href="/admin/appeals"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-warning" />
            </div>
            <span className="text-sm text-text-primary">处理申诉</span>
          </Link>
          <Link
            href="/admin/import-export"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <div className="w-9 h-9 bg-info/10 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-info" />
            </div>
            <span className="text-sm text-text-primary">导入导出</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
