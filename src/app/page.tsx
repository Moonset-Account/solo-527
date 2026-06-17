'use client';

import { AppShell } from '~/components/layout/AppShell';
import { StatCard } from '~/components/ui/StatCard';
import { trpc } from '~/app/_trpc/client';
import Link from 'next/link';
import { EmptyState } from '~/components/ui/EmptyState';
import { BudgetAlertBadge, BudgetBar, StatusBadge, UserAvatar } from '~/components/ui/Badges';
import { formatCurrency, formatDate, formatDateTime } from '~/lib/utils';
import type { ComplaintPriority, ComplaintStatus, InspectionStatus, AcceptanceStatus } from '@prisma/client';
import {
  ClipboardList,
  AlertTriangle,
  Search,
  CheckCircle2,
  Megaphone,
  ChevronRight,
  ArrowRight,
  FileText,
  TrendingUp,
} from 'lucide-react';

const inspectionStatusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  PENDING: { label: '待巡检', className: 'bg-warning-100 text-warning-700' },
  IN_PROGRESS: { label: '巡检中', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: '已完成', className: 'bg-success-100 text-success-600' },
  FAILED: { label: '不通过', className: 'bg-danger-100 text-danger-600' },
};

const acceptanceStatusConfig: Record<AcceptanceStatus, { label: string; className: string }> = {
  PENDING: { label: '待验收', className: 'bg-warning-100 text-warning-700' },
  PASSED: { label: '已通过', className: 'bg-success-100 text-success-600' },
  FAILED: { label: '未通过', className: 'bg-danger-100 text-danger-600' },
  RECTIFYING: { label: '整改中', className: 'bg-orange-100 text-orange-700' },
};

const priorityConfig: Record<ComplaintPriority, { label: string; className: string }> = {
  LOW: { label: '低', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: '中', className: 'bg-blue-100 text-blue-700' },
  HIGH: { label: '高', className: 'bg-warning-100 text-warning-700' },
  URGENT: { label: '紧急', className: 'bg-danger-100 text-danger-600' },
};

const complaintStatusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: '待处理', className: 'bg-danger-100 text-danger-600' },
  PROCESSING: { label: '处理中', className: 'bg-warning-100 text-warning-700' },
  RESOLVED: { label: '已解决', className: 'bg-success-100 text-success-600' },
  ESCALATED: { label: '已升级', className: 'bg-purple-100 text-purple-700' },
};

export default function Dashboard() {
  const statsQuery = trpc.project.getDashboardStats.useQuery();
  const projectsQuery = trpc.project.list.useQuery({});
  const inspectionsQuery = trpc.inspection.listPending.useQuery();
  const acceptancesQuery = trpc.inspection.listAcceptancesPending.useQuery();
  const complaintsQuery = trpc.complaint.listOpen.useQuery();
  const abnormalBudgetQuery = trpc.phase.listAllBudgetChanges.useQuery();
  const designPlansQuery = trpc.inspection.listDesignPlans.useQuery({});

  const isLoading =
    statsQuery.isLoading || projectsQuery.isLoading || inspectionsQuery.isLoading ||
    acceptancesQuery.isLoading || complaintsQuery.isLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
          加载中...
        </div>
      </AppShell>
    );
  }

  const stats = statsQuery.data;
  const projects = projectsQuery.data ?? [];
  const inspections = inspectionsQuery.data ?? [];
  const acceptances = acceptancesQuery.data ?? [];
  const complaints = complaintsQuery.data ?? [];
  const abnormalBudgets = abnormalBudgetQuery.data ?? [];
  const designPlans = designPlansQuery.data ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-800">工作台总览</h1>
          <p className="section-subtitle">值班核心信息一目了然，巡检/验收/方案无需进入二级页面</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="项目总数" value={stats?.totalProjects ?? 0} icon={ClipboardList} variant="dark" />
          <StatCard title="预算异常" value={stats?.abnormalBudgets ?? 0} icon={AlertTriangle} variant="dark" trend="需定位责任人" />
          <StatCard title="待巡检" value={stats?.pendingInspections ?? 0} icon={Search} variant="dark" />
          <StatCard title="待验收/整改" value={stats?.pendingAcceptances ?? 0} icon={CheckCircle2} variant="dark" />
          <StatCard title="待处理投诉" value={stats?.openComplaints ?? 0} icon={Megaphone} variant="dark" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="section-title">待巡检任务</h2>
              </div>
              <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                查看全部 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {inspections.length === 0 ? (
                <EmptyState title="暂无待巡检任务" description="所有巡检任务都已完成" icon={<CheckCircle2 className="w-6 h-6 text-gray-400" />} />
              ) : (
                inspections.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${inspectionStatusConfig[item.status].className}`}>
                            {inspectionStatusConfig[item.status].label}
                          </span>
                          <span className="font-medium text-navy-800">{item.title}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          <Link href={`/projects/${item.projectId}`} className="hover:text-brand-600 transition-colors">
                            {item.project?.code} · {item.project?.name}
                          </Link>
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-xs text-gray-400">计划日期</p>
                        <p className="text-sm font-medium text-navy-700">{formatDate(item.scheduledDate)}</p>
                        <div className="mt-2">
                          <UserAvatar name={item.inspector?.name} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b">
              <h2 className="section-title">预算异常预警</h2>
              <p className="section-subtitle">点击项目查看责任人</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
              {abnormalBudgets.length === 0 ? (
                <EmptyState title="暂无预算异常" icon={<TrendingUp className="w-6 h-6 text-gray-400" />} />
              ) : (
                abnormalBudgets.map((item) => (
                  <Link href={`/projects/${item.projectId}`} key={item.id} className="block p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-navy-800">{item.project?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
                        <div className="mt-2">
                          <UserAvatar name={item.responsible?.name} role="责任人" />
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <BudgetAlertBadge level={item.alertLevel} />
                        <p className={`text-sm font-display font-bold mt-1 ${item.changeAmount.toNumber() > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                          {item.changeAmount.toNumber() > 0 ? '+' : ''}{formatCurrency(item.changeAmount.toNumber())}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="section-title">验收反馈</h2>
              <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                全部 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
              {acceptances.length === 0 ? (
                <EmptyState title="暂无待验收项" icon={<CheckCircle2 className="w-6 h-6 text-gray-400" />} />
              ) : (
                acceptances.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${acceptanceStatusConfig[item.status].className}`}>
                            {acceptanceStatusConfig[item.status].label}
                          </span>
                          <span className="font-medium text-sm text-navy-800">{item.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.project?.code} · {item.project?.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatDate(item.scheduledDate)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="section-title">装修方案</h2>
              <span className="text-xs text-gray-400">最新版本</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
              {designPlans.length === 0 ? (
                <EmptyState title="暂无方案" description="项目创建后可上传设计方案" icon={<FileText className="w-6 h-6 text-gray-400" />} />
              ) : (
                designPlans.slice(0, 10).map((plan) => (
                  <Link href={`/projects/${plan.projectId}`} key={plan.id} className="block p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-navy-800">{plan.name}</span>
                          {plan.isActive && (
                            <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold bg-brand-100 text-brand-700 uppercase tracking-wider">
                              当前版本
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          v{plan.version} · {plan.project?.code} · {plan.project?.name}
                        </p>
                        {plan.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{plan.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatDate(plan.createdAt)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="section-title">客户投诉</h2>
              <span className="text-xs text-gray-400">高/紧急自动通知老板</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-auto">
              {complaints.length === 0 ? (
                <EmptyState title="暂无未解决投诉" icon={<Megaphone className="w-6 h-6 text-gray-400" />} />
              ) : (
                complaints.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${priorityConfig[item.priority].className}`}>
                            {priorityConfig[item.priority].label}
                          </span>
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold uppercase tracking-wider ${complaintStatusConfig[item.status].className}`}>
                            {complaintStatusConfig[item.status].label}
                          </span>
                          {item.bossNotified && (
                            <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-display font-semibold bg-danger-100 text-danger-600 uppercase tracking-wider">
                              已通知老板
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm text-navy-800 mt-1.5 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.project?.code} · {item.project?.name}
                        </p>
                        {item.decorationCompany && (
                          <p className="text-xs text-gray-600 mt-0.5">装修公司: {item.decorationCompany.name}</p>
                        )}
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</p>
                        <div className="mt-2">
                          <UserAvatar name={item.assignedTo?.name} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="section-title">项目概览</h2>
            <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              项目列表 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-auto">
            {projects.length === 0 ? (
              <EmptyState title="暂无项目" description="创建第一个项目开始管理" icon={<ClipboardList className="w-6 h-6 text-gray-400" />} />
            ) : (
              <table className="table">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="table-th">项目编号</th>
                    <th className="table-th">项目名称</th>
                    <th className="table-th">客户</th>
                    <th className="table-th">状态</th>
                    <th className="table-th w-64">预算执行</th>
                    <th className="table-th">预警</th>
                    <th className="table-th">当前阶段</th>
                    <th className="table-th">设计师</th>
                    <th className="table-th">待办</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="table-td font-mono text-sm">
                        <Link href={`/projects/${p.id}`} className="text-brand-600 hover:text-brand-700 font-medium">
                          {p.code}
                        </Link>
                      </td>
                      <td className="table-td font-medium text-navy-800">{p.name}</td>
                      <td className="table-td text-sm text-gray-600">{p.clientName}</td>
                      <td className="table-td"><StatusBadge status={p.status} /></td>
                      <td className="table-td">
                        <BudgetBar
                          usedPercent={p.budgetUsedPercent}
                          amount={p.actualCost.toNumber()}
                          budget={p.totalBudget.toNumber()}
                        />
                      </td>
                      <td className="table-td"><BudgetAlertBadge level={p.budgetAlertLevel} /></td>
                      <td className="table-td text-sm text-gray-600">
                        {p.phases[0]?.name ?? '-'}
                      </td>
                      <td className="table-td"><UserAvatar name={p.designer?.name} /></td>
                      <td className="table-td text-sm">
                        <div className="space-y-0.5">
                          {p.inspections.length > 0 && (
                            <span className="text-brand-600 flex items-center gap-1"><Search className="w-3 h-3" /> {p.inspections.length} 巡检</span>
                          )}
                          {p.acceptances.length > 0 && (
                            <span className="block text-success-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {p.acceptances.length} 验收</span>
                          )}
                          {p._count.complaints > 0 && (
                            <span className="block text-danger-600 flex items-center gap-1"><Megaphone className="w-3 h-3" /> {p._count.complaints} 投诉</span>
                          )}
                          {p.inspections.length === 0 && p.acceptances.length === 0 && p._count.complaints === 0 && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
