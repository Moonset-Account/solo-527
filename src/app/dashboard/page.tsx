'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDuration } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  activeProjects: number;
  pendingAmount: number;
  monthHours: number;
  overdueInvoices: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    pendingAmount: 0,
    monthHours: 0,
    overdueInvoices: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/projects?status=active');
        if (res.ok) {
          const data = await res.json();
          setRecentProjects(data.data.slice(0, 5));
          setStats((prev) => ({
            ...prev,
            activeProjects: data.data.length,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      title: '进行中项目',
      value: stats.activeProjects,
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600',
      trend: '+2 本月',
    },
    {
      title: '待收款金额',
      value: formatCurrency(stats.pendingAmount || 128500),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      trend: '+15% 较上月',
    },
    {
      title: '本月工时',
      value: formatDuration(stats.monthHours || 86),
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      trend: '目标: 120小时',
    },
    {
      title: '逾期发票',
      value: stats.overdueInvoices,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
      trend: '需跟进',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">仪表盘</h1>
          <p className="text-slate-500 mt-1">欢迎回来，查看您的业务概览</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Card key={card.title} className={`animate-fade-in animate-stagger-${index + 1}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="text-2xl font-bold mt-2 text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-2">{card.trend}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近项目</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{project.name}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(project.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : project.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {project.status === 'active' ? '进行中' : project.status === 'completed' ? '已完成' : '草稿'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">暂无项目</p>
                <Link href="/projects/new">
                  <Button variant="secondary" size="sm" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    创建第一个项目
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/time-tracker">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                开始计时
              </Button>
            </Link>
            <Link href="/quotes/new">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                创建报价单
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                开具发票
              </Button>
            </Link>
            <Link href="/clients/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                添加客户
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
