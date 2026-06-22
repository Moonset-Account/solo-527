'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Vote,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Wrench,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatsOverview, Rectification, Topic, PatrolTask, ReportRecord } from '@/types';
import { formatDate, truncateText } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, StatsCard } from '@/components/ui/Feedback';
import { TrendLineChart, StatusBarChart, ProgressRing } from '@/components/ui/Charts';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [pendingRectifications, setPendingRectifications] = useState<Rectification[]>([]);
  const [upcomingPatrols, setUpcomingPatrols] = useState<PatrolTask[]>([]);
  const [pendingReports, setPendingReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          overview,
          topics,
          rectifications,
          patrols,
          reports,
        ] = await Promise.all([
          api.getStatsOverview(),
          api.getTopics('ongoing'),
          api.getRectifications('pending'),
          api.getPatrolTasks('pending'),
          api.getReportRecords('pending'),
        ]);

        setStats(overview);
        setRecentTopics(topics.slice(0, 3));
        setPendingRectifications(rectifications.slice(0, 3));
        setUpcomingPatrols(patrols.slice(0, 3));
        setPendingReports(reports.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !stats) return <Loading />;

  const participationTrendData = [
    { name: '1月', 参与率: 65 },
    { name: '2月', 参与率: 72 },
    { name: '3月', 参与率: 68 },
    { name: '4月', 参与率: 75 },
    { name: '5月', 参与率: 80 },
    { name: '6月', 参与率: 85 },
  ];

  const reportStatusData = [
    { name: '待处理', value: stats.reports_pending },
    { name: '处理中', value: stats.reports_processing },
    { name: '已解决', value: stats.reports_resolved },
  ];

  const todoItems = [
    { count: stats.rectifications_pending, label: '待整改', color: 'warning' },
    { count: stats.patrols_today, label: '今日巡逻', color: 'primary' },
    { count: stats.reports_pending, label: '待处理上报', color: 'danger' },
    { count: stats.topics_ongoing, label: '进行中议题', color: 'success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-serif">数据概览</h1>
        <p className="mt-1 text-slate-500">查看社区网格整体运营数据和待办事项</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="居民总数"
          value={stats.total_residents}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 5, isPositive: true }}
          className="animate-stagger-1"
        />
        <StatsCard
          title="议题总数"
          value={stats.total_topics}
          icon={<Vote className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
          className="animate-stagger-2"
        />
        <StatsCard
          title="待办任务"
          value={stats.pending_tasks}
          icon={<AlertCircle className="w-6 h-6" />}
          className="animate-stagger-3"
        />
        <Card className="p-6 animate-stagger-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">设施完好率</p>
              <div className="mt-4">
                <ProgressRing progress={stats.facility_good_rate} size={80} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-success-50 text-success-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>居民参与率趋势</CardTitle>
              <Link href="/admin/residents">
                <Button variant="ghost" size="sm">
                  查看居民台账
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={participationTrendData}
                yKeys={[{ key: '参与率', name: '参与率(%)', color: '#2563eb' }]}
                height={250}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>待办提醒</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {todoItems.map((item, index) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.color === 'warning'
                              ? 'bg-warning-100 text-warning-600'
                              : item.color === 'danger'
                              ? 'bg-danger-100 text-danger-600'
                              : item.color === 'success'
                              ? 'bg-success-100 text-success-600'
                              : 'bg-primary-100 text-primary-600'
                          }`}
                        >
                          {item.color === 'warning' ? (
                            <Clock className="w-5 h-5" />
                          ) : item.color === 'danger' ? (
                            <AlertCircle className="w-5 h-5" />
                          ) : item.color === 'success' ? (
                            <Vote className="w-5 h-5" />
                          ) : (
                            <Wrench className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700">{item.label}</span>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          item.color === 'warning'
                            ? 'text-warning-600'
                            : item.color === 'danger'
                            ? 'text-danger-600'
                            : item.color === 'success'
                            ? 'text-success-600'
                            : 'text-primary-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>上报处理状态</CardTitle>
                <Link href="/admin/reports">
                  <Button variant="ghost" size="sm">
                    查看统计
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <StatusBarChart
                  data={reportStatusData}
                  xKey="name"
                  yKey="value"
                  height={200}
                  color="#10b981"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">进行中议题</CardTitle>
              <Link href="/admin/topics">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {recentTopics.length === 0 ? (
                <p className="text-center text-slate-500 py-4">暂无进行中议题</p>
              ) : (
                <div className="space-y-3">
                  {recentTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/admin/topics/${topic.id}/edit`}
                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <p className="font-medium text-slate-900 text-sm line-clamp-1">
                        {topic.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge status={topic.status} className="text-xs" />
                        <span className="text-xs text-slate-500">
                          {topic.vote_count || 0} 人参与
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">待整改任务</CardTitle>
              <Link href="/admin/rectifications">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingRectifications.length === 0 ? (
                <p className="text-center text-slate-500 py-4">暂无待整改任务</p>
              ) : (
                <div className="space-y-3">
                  {pendingRectifications.map((rect) => (
                    <Link
                      key={rect.id}
                      href="/admin/rectifications"
                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <p className="font-medium text-slate-900 text-sm line-clamp-1">
                        {rect.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                          负责人：{rect.assignee?.name}
                        </span>
                        <Badge status={rect.status} className="text-xs" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">待处理上报</CardTitle>
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingReports.length === 0 ? (
                <p className="text-center text-slate-500 py-4">暂无待处理上报</p>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((report) => (
                    <Link
                      key={report.id}
                      href="/admin/reports"
                      className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-900 text-sm line-clamp-1 flex-1">
                          {report.title}
                        </p>
                        {report.duplicate_count > 1 && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-danger-100 text-danger-700 text-xs rounded-full">
                            重复 {report.duplicate_count} 次
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {report.location}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
