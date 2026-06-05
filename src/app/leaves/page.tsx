import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Clock, Plus, Check, X, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate, hasPermission } from '@/lib/utils';

export default async function LeavesPage() {
  const session = await auth();
  const canApprove = hasPermission(session?.user?.role || 'USER', [
    'SUPER_ADMIN',
    'COMMITTEE',
    'DIRECTOR',
  ]);

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: canApprove
      ? undefined
      : { userId: session?.user?.id },
    include: {
      user: true,
      rehearsal: {
        include: {
          production: true,
          venue: true,
        },
      },
      approvedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    PENDING: {
      label: '待审批',
      className: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    },
    APPROVED: {
      label: '已批准',
      className: 'bg-green-100 text-green-700',
      icon: Check,
    },
    REJECTED: {
      label: '已拒绝',
      className: 'bg-red-100 text-red-700',
      icon: X,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            请假管理
          </h1>
          <p className="text-gray-500 mt-1">
            {canApprove ? '审批和管理请假申请' : '查看和提交请假申请'}
          </p>
        </div>
        <Link
          href="/leaves/new"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>提交请假</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排练
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原因
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  审批人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaveRequests.map((leave) => {
                const status = statusConfig[leave.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {leave.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {leave.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {leave.rehearsal.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {leave.rehearsal.production.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(leave.rehearsal.startTime, 'MM-dd HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {leave.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.approvedBy ? (
                        <p className="text-sm text-gray-600">
                          {leave.approvedBy.name}
                        </p>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(leave.createdAt, 'yyyy-MM-dd')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaveRequests.length === 0 && (
          <div className="text-center py-16">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无请假记录</h3>
            <p className="text-gray-500">点击上方按钮提交请假申请</p>
          </div>
        )}
      </div>
    </div>
  );
}
