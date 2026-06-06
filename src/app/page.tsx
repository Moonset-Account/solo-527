import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/AppLayout';
import { StatsCard } from '@/components/StatsCard';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  DollarSign,
  FolderKanban,
  FileWarning,
  Clock,
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role === 'CLIENT') {
    redirect('/portal');
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalPaid, projects, overdueInvoices, recentTasks, recentActivity] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: { gte: firstDayOfMonth },
      },
    }),
    prisma.project.findMany({
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { status: 'OVERDUE' },
      include: { client: { select: { name: true } } },
      take: 5,
    }),
    prisma.task.findMany({
      where: { assigneeId: session.user.id, status: { not: 'DONE' } },
      include: { project: { select: { name: true } } },
      orderBy: { priority: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const inProgressCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const pendingCount = projects.filter((p) => p.status === 'PENDING').length;

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{session.user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="本月收入"
            value={formatCurrency(totalPaid._sum.amount || 0)}
            icon={DollarSign}
            trend="12% 较上月"
            trendUp
          />
          <StatsCard
            title="进行中项目"
            value={inProgressCount}
            icon={FolderKanban}
          />
          <StatsCard
            title="待开始项目"
            value={pendingCount}
            icon={Calendar}
          />
          <StatsCard
            title="逾期发票"
            value={overdueInvoices.length}
            icon={AlertCircle}
            className={overdueInvoices.length > 0 ? 'border-red-200 bg-red-50/30' : ''}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">最近项目</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.client.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        截止: {formatDate(project.dueDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">我的待办任务</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/projects/${task.projectId}/tasks/${task.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project.name}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </Link>
                ))}
                {recentTasks.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    暂无待办任务
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {overdueInvoices.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm">
                <div className="p-5 border-b border-red-100 bg-red-50/50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-red-800">逾期提醒</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {overdueInvoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">{invoice.client.name}</p>
                      </div>
                      <p className="font-semibold text-red-600">
                        {formatCurrency(invoice.total)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {recentActivity.map((log) => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{log.user?.name || '系统'}</span>
                          {' '}
                          {log.action === 'CREATE' && '创建了'}
                          {log.action === 'UPDATE' && '更新了'}
                          {log.action === 'DELETE' && '删除了'}
                          {log.action === 'STATUS_CHANGE' && '更新了'}
                          {' '}
                          <span className="text-primary font-medium">
                            {log.entityType === 'PROJECT' && '项目'}
                            {log.entityType === 'TASK' && '任务'}
                            {log.entityType === 'INVOICE' && '发票'}
                            {log.entityType === 'QUOTE' && '报价单'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(log.createdAt, 'MM-dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
