'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/components/providers/trpc-provider';
import {
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelative, getRiskLabel, getRiskColor } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: checklistStats, isLoading: checklistLoading } =
    trpc.checklist.stats.useQuery();
  const { data: riskStats, isLoading: riskLoading } = trpc.risk.stats.useQuery();
  const { data: alertStats, isLoading: alertLoading } =
    trpc.alert.stats.useQuery();

  const { data: recentChecklists } = trpc.checklist.list.useQuery(
    { limit: 5 },
    { enabled: !checklistLoading } as any
  );

  const { data: recentRisks } = trpc.risk.list.useQuery(
    { limit: 5 },
    { enabled: !riskLoading } as any
  );

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            {trend && (
              <p className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                {trend}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (checklistLoading || riskLoading || alertLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪表板</h1>
          <p className="text-slate-500">欢迎回来，查看您的合规风险概览</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="待处理清单"
            value={checklistStats?.submitted || 0}
            icon={FileCheck}
            color="bg-blue-500"
          />
          <StatCard
            title="高风险项"
            value={(riskStats?.high || 0) + (riskStats?.critical || 0)}
            icon={ShieldAlert}
            color="bg-red-500"
          />
          <StatCard
            title="逾期整改"
            value={riskStats?.overdue || 0}
            icon={AlertTriangle}
            color="bg-amber-500"
          />
          <StatCard
            title="已闭环"
            value={riskStats?.closed || 0}
            icon={CheckCircle2}
            color="bg-green-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">风险统计</CardTitle>
              <Link
                href="/risks"
                className="text-sm text-blue-600 hover:underline"
              >
                查看全部
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">严重风险</span>
                    <Badge variant="purple">{riskStats?.critical || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">高风险</span>
                    <Badge variant="danger">{riskStats?.high || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">中风险</span>
                    <Badge variant="warning">{riskStats?.medium || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">低风险</span>
                    <Badge variant="success">{riskStats?.low || 0}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">审核中</span>
                    <Badge variant="info">{riskStats?.underReview || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">整改中</span>
                    <Badge variant="warning">{riskStats?.rectification || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">已升级</span>
                    <Badge variant="purple">{riskStats?.escalated || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">已闭环</span>
                    <Badge variant="success">{riskStats?.closed || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">越权提醒</CardTitle>
              <Link
                href="/alerts"
                className="text-sm text-blue-600 hover:underline"
              >
                查看全部
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">待处理</span>
                    <Badge variant="danger">{alertStats?.open || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">处理中</span>
                    <Badge variant="warning">{alertStats?.investigating || 0}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">已解决</span>
                    <Badge variant="success">{alertStats?.resolved || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">已关闭</span>
                    <Badge variant="success">{alertStats?.closed || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">最近检查清单</CardTitle>
              <Link
                href="/checklists"
                className="text-sm text-blue-600 hover:underline"
              >
                查看全部
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentChecklists?.items?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    暂无检查清单
                  </p>
                ) : (
                  recentChecklists?.items?.map((checklist) => (
                    <Link
                      key={checklist.id}
                      href={`/checklists/${checklist.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {checklist.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {checklist.submitter?.name} ·{' '}
                            {formatRelative(checklist.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          checklist.status === 'CLOSED'
                            ? 'success'
                            : checklist.status === 'SUBMITTED'
                            ? 'info'
                            : 'secondary'
                        }
                      >
                        {checklist.status}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">最近风险项</CardTitle>
              <Link
                href="/risks"
                className="text-sm text-blue-600 hover:underline"
              >
                查看全部
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRisks?.items?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    暂无风险项
                  </p>
                ) : (
                  recentRisks?.items?.map((risk) => (
                    <Link
                      key={risk.id}
                      href={`/risks/${risk.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {risk.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatRelative(risk.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={getRiskColor(risk.riskLevel)}
                        variant="outline"
                      >
                        {getRiskLabel(risk.riskLevel)}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
