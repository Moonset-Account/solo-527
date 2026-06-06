import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { FolderKanban, Receipt, Clock, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'CLIENT' || !session.user.clientId) {
    redirect('/');
  }

  const clientId = session.user.clientId;

  const [projects, invoices] = await Promise.all([
    prisma.project.findMany({
      where: { clientId },
      include: {
        tasks: { select: { status: true } },
        _count: { select: { tasks: true, attachments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const calculateProgress = (tasks: { status: string }[]) => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    return Math.round((done / tasks.length) * 100);
  };

  const totalInvoiced = invoices.reduce((sum, i) => sum + parseFloat(i.total as any), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + parseFloat(i.amountPaid as any), 0);

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">欢迎，{session.user.name}</h1>
          <p className="text-gray-500 mt-1">查看您的项目进度和相关文件</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">进行中项目</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => p.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成项目</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => p.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待付款</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totalInvoiced - totalPaid)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">发票总数</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">我的项目</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {projects.map((project) => {
                  const progress = calculateProgress(project.tasks);
                  return (
                    <Link
                      key={project.id}
                      href={`/portal/projects/${project.id}`}
                      className="block p-5 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 hover:text-primary transition">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {project._count.tasks} 个任务 · {project._count.attachments} 个文件
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>完成进度</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {projects.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无项目</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">最近发票</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">金额</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无发票</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
