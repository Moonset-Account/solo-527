import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getPriorityColor, formatDateTime } from '@/lib/utils';
import {
  FolderKanban,
  Clock,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  FileText,
  Paperclip,
  History,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const projectRes = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/projects/${params.id}`,
    { headers: { cookie: `next-auth.session-token=` } }
  );

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      timesheets: {
        include: { user: { select: { name: true } } },
        orderBy: { workDate: 'desc' },
        take: 10,
      },
      attachments: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!project) {
    redirect('/projects');
  }

  if (session.user.role === 'CLIENT' && project.clientId !== session.user.clientId) {
    redirect('/portal');
  }

  if (session.user.role === 'DESIGNER') {
    const isMember = project.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      redirect('/projects');
    }
  }

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalHours = project.timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours as any), 0);
  const totalCost = project.timesheets.reduce(
    (sum, ts) => sum + parseFloat(ts.hours as any) * parseFloat(ts.hourlyRate as any),
    0
  );
  const hideSensitive = session.user.role === 'CLIENT';

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <Link href="/projects" className="text-sm text-gray-500 hover:text-primary transition">
            ← 返回项目列表
          </Link>
          <div className="flex items-start justify-between mt-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {project.client.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  截止: {formatDate(project.dueDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">项目进度</p>
                <p className="text-xl font-bold text-gray-900">{progress}%</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">任务完成</p>
                <p className="text-xl font-bold text-gray-900">{doneTasks}/{totalTasks}</p>
              </div>
            </div>
          </div>
          {!hideSensitive && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">总工时</p>
                  <p className="text-xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">项目预算</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(project.budget)}</p>
              </div>
            </div>
          </div>
        </div>

        {project.description && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">项目描述</h3>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">任务列表</h2>
                {session.user.role !== 'CLIENT' && (
                  <button className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    添加任务
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {project.tasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 ${
                          task.status === 'DONE' ? 'bg-emerald-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                          task.status === 'BLOCKED' ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {getStatusLabel(task.priority)}
                            </span>
                            {task.assignee && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!hideSensitive && parseFloat(task.timeSpent as any) > 0 && (
                        <span className="text-xs text-gray-500">
                          {parseFloat(task.timeSpent as any).toFixed(1)}h
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>暂无任务</p>
                  </div>
                )}
              </div>
            </div>

            {!hideSensitive && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">最近工时</h2>
                  <Link href="/timesheets" className="text-sm text-primary hover:text-primary/80 font-medium">
                    查看全部
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {project.timesheets.map((ts) => (
                    <div key={ts.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {ts.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ts.user?.name}</p>
                          <p className="text-xs text-gray-500">{ts.description || '工时记录'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{parseFloat(ts.hours as any).toFixed(1)}h</p>
                        <p className="text-xs text-gray-400">{formatDate(ts.workDate)}</p>
                      </div>
                    </div>
                  ))}
                  {project.timesheets.length === 0 && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      暂无工时记录
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">项目成员</h2>
              </div>
              <div className="p-4 space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'MANAGER' ? '项目负责人' : '项目成员'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">附件</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {project.attachments.map((att) => (
                  <div key={att.id} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{att.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {att.uploadedBy?.name} · {formatDateTime(att.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {project.attachments.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    暂无附件
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">活动日志</h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {project.auditLogs.map((log) => (
                  <div key={log.id} className="p-3">
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
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))}
                {project.auditLogs.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    暂无活动记录
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
