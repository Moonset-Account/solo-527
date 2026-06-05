import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { History, User, FileText, Clock, Search } from 'lucide-react';
import { formatDate, hasPermission } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const session = await auth();

  if (!hasPermission(session?.user?.role || 'USER', ['SUPER_ADMIN'])) {
    redirect('/dashboard');
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: searchParams.userId
      ? { userId: searchParams.userId }
      : undefined,
    include: {
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const actionLabels: Record<string, { label: string; className: string }> = {
    CREATE: { label: '创建', className: 'bg-green-100 text-green-700' },
    UPDATE: { label: '更新', className: 'bg-blue-100 text-blue-700' },
    DELETE: { label: '删除', className: 'bg-red-100 text-red-700' },
    APPROVE: { label: '审批', className: 'bg-purple-100 text-purple-700' },
    REJECT: { label: '拒绝', className: 'bg-orange-100 text-orange-700' },
    CHECK_IN: { label: '验票', className: 'bg-teal-100 text-teal-700' },
  };

  const entityLabels: Record<string, string> = {
    Production: '剧目',
    Character: '角色',
    Venue: '场地',
    Rehearsal: '排练',
    Show: '演出',
    Order: '订单',
    Ticket: '门票',
    User: '用户',
    FinanceRecord: '财务记录',
    LeaveRequest: '请假申请',
    SeatChangeLog: '座位变更',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          操作日志
        </h1>
        <p className="text-gray-500 mt-1">查看系统所有操作记录和审计追踪</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              最近操作记录
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <History className="h-4 w-4" />
              <span>共 {auditLogs.length} 条记录</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实体类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实体ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.map((log: any) => {
                const action = actionLabels[log.action] || {
                  label: log.action,
                  className: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(log.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">系统</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${action.className}`}
                      >
                        {action.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entityLabels[log.entity] || log.entity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {log.entityId.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {auditLogs.length === 0 && (
          <div className="text-center py-16">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无操作记录
            </h3>
            <p className="text-gray-500">系统还没有任何操作日志</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">审计说明</h3>
        <p className="text-sm text-blue-700">
          所有重要操作（创建、更新、删除、审批等）都会被记录到此日志中，包含操作人、操作时间、IP地址等信息，便于后续追溯和审计。日志数据会长期保存，请勿随意删除。
        </p>
      </div>
    </div>
  );
}
