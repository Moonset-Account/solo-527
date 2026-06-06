import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/AppLayout';
import { formatDate, getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '@/lib/utils';
import { ArrowLeft, Clock, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';

export default async function PortalProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'CLIENT' || !session.user.clientId) {
    redirect('/');
  }

  const project = await prisma.project.findUnique({
    where: { 
      id: params.id,
      clientId: session.user.clientId,
    },
    include: {
      tasks: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      },
      attachments: {
        where: { isDeliverable: true },
        include: {
          uploadedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      auditLogs: {
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!project) {
    redirect('/portal');
  }

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1">
              状态：
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </p>
          </div>
        </div>

        {project.description && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">项目描述</h2>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">项目进度</p>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-900 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {completedTasks} / {totalTasks} 个任务完成
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">时间范围</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">开始日期</span>
                <span className="text-gray-900">{formatDate(project.startDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">截止日期</span>
                <span className="text-gray-900">{formatDate(project.dueDate)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">交付文件</p>
                <p className="text-2xl font-bold text-gray-900">{project.attachments.length}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">可下载的交付成果</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">任务列表</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {project.tasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {task.status === 'DONE' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : task.status === 'BLOCKED' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <p className="font-medium text-gray-900">{task.title}</p>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1 ml-6">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 ml-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            截止：{formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {project.tasks.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无任务</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">交付文件</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {project.attachments.map((attachment) => (
                <div key={attachment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {attachment.uploadedBy.name} · {formatDate(attachment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {project.attachments.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无交付文件</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">项目动态</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {project.auditLogs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600">
                      {log.user?.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user?.name || '系统'}</span>
                      {' '}
                      {log.action === 'CREATE' && '创建了'}
                      {log.action === 'UPDATE' && '更新了'}
                      {log.action === 'STATUS_CHANGE' && '更新了状态'}
                      {' '}
                      {log.entityType.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(log.createdAt, 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {project.auditLogs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <p>暂无动态</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
