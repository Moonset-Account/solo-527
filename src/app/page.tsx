import Link from 'next/link';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Upload,
  Bell,
  ChevronRight,
  TrendingUp,
  FileWarning,
  Users,
} from 'lucide-react';
import { db } from '@/lib/mock-db';
import { contractStatusLabels, riskLevelLabels, formatDate, formatFileSize, cn } from '@/lib/utils';
import { ContractStatus, RiskLevel, OperationType } from '@prisma/client';

const userId = 'user-1';

export default function DashboardPage() {
  const pendingReview = db.contracts.count({ where: { status: ContractStatus.PENDING_REVIEW } });
  const underReview = db.contracts.count({ where: { status: ContractStatus.UNDER_REVIEW } });
  const highRisk = db.contracts.findMany({ where: { riskLevel: RiskLevel.HIGH } }).length;
  const materialIncomplete = db.contracts.count({ where: { materialComplete: false } });
  const approved = db.contracts.count({ where: { status: ContractStatus.APPROVED } });

  const unreadReminders = db.reminders.findMany({
    where: { userId, isRead: false },
  });

  const recentContracts = db.contracts.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const myAssigned = db.contracts.findMany({
    where: { assigneeId: userId, status: { in: [ContractStatus.UNDER_REVIEW, ContractStatus.PENDING_REVIEW, ContractStatus.REVISE_REQUESTED] } },
    orderBy: { deadline: 'asc' },
    take: 5,
  });

  const recentLogs = db.operationLogs.findMany({
    take: 8,
  });

  const users = db.users.findMany();
  const userMap = new Map(users.map(u => [u.id, u]));

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case ContractStatus.APPROVED:
      case ContractStatus.STAMPED:
      case ContractStatus.COMPLETED:
        return 'badge-success';
      case ContractStatus.REJECTED:
        return 'badge-danger';
      case ContractStatus.UNDER_REVIEW:
      case ContractStatus.REVISE_REQUESTED:
        return 'badge-warning';
      case ContractStatus.PENDING_REVIEW:
        return 'badge-primary';
      default:
        return 'badge-gray';
    }
  }

  function getRiskBadgeClass(risk: string | null) {
    switch (risk) {
      case RiskLevel.CRITICAL:
      case RiskLevel.HIGH:
        return 'badge-danger';
      case RiskLevel.MEDIUM:
        return 'badge-warning';
      case RiskLevel.LOW:
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日常入口</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，法务负责人工作台</p>
        </div>
        <Link href="/contracts?upload=1" className="btn-primary">
          <Upload className="mr-2 h-4 w-4" />
          上传合同
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审阅合同</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{pendingReview + underReview}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            <span className="text-primary-600 font-medium">{pendingReview}</span> 份待分配审阅
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">高风险合同</p>
              <p className="mt-1 text-3xl font-bold text-danger-600">{highRisk}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            需要重点关注的风险合同
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">材料不完整</p>
              <p className="mt-1 text-3xl font-bold text-warning-600">{materialIncomplete}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <FileCheck className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            待补充证据材料
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本月已通过</p>
              <p className="mt-1 text-3xl font-bold text-success-600">{approved}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 flex items-center">
            <TrendingUp className="mr-1 h-3 w-3 text-success-600" />
            较上月增长 12%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-600" />
                待办提醒
              </h2>
              <Link href="/reminders" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                全部提醒 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {unreadReminders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p>暂无新的待办提醒</p>
                </div>
              ) : (
                unreadReminders.slice(0, 5).map((reminder) => {
                  const contract = reminder.contractId
                    ? db.contracts.findUnique({ where: { id: reminder.contractId } })
                    : null;
                  return (
                    <div key={reminder.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer">
                      <div className={cn(
                        'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                        reminder.type === 'RISK_ALERT' ? 'bg-danger-100 text-danger-600' :
                        reminder.type === 'MATERIAL_INCOMPLETE' ? 'bg-warning-100 text-warning-600' :
                        'bg-primary-100 text-primary-600'
                      )}>
                        {reminder.type === 'RISK_ALERT' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : reminder.type === 'MATERIAL_INCOMPLETE' ? (
                          <FileWarning className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500 truncate">{reminder.message}</p>
                        <p className="mt-1 text-xs text-gray-400">{formatDate(reminder.createdAt)}</p>
                      </div>
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary-500"></span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" />
                待我审阅
              </h2>
              <Link href="/contracts?filter=mine" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                全部合同 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {myAssigned.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p>暂无待您审阅的合同</p>
                </div>
              ) : (
                myAssigned.map((contract: any) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{contract.title}</p>
                          <span className={cn('badge', getStatusBadgeClass(contract.status))}>
                            {contractStatusLabels[contract.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          编号: {contract.contractNumber || '未编号'} · {formatFileSize(contract.fileSize)}
                        </p>
                        {contract.riskLevel && (
                          <span className={cn('mt-2 badge', getRiskBadgeClass(contract.riskLevel))}>
                            {riskLevelLabels[contract.riskLevel]}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        {contract.deadline && (
                          <p className="text-xs text-danger-600 font-medium">
                            截止: {formatDate(contract.deadline).split(' ')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-warning-600" />
                材料完整看板
              </h2>
              <Link href="/material-board" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                详情 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">材料完整</span>
                <span className="text-sm font-medium text-success-600">{db.contracts.count({ where: { materialComplete: true } })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">材料不完整</span>
                <span className="text-sm font-medium text-danger-600">{db.contracts.count({ where: { materialComplete: false } })}</span>
              </div>
              <div className="pt-2">
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-success-500 rounded-full"
                    style={{
                      width: `${(db.contracts.count({ where: { materialComplete: true } }) / db.contracts.findMany().length) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-gray-500 text-right">
                  完成率 {Math.round((db.contracts.count({ where: { materialComplete: true } }) / db.contracts.findMany().length) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                最近操作
              </h2>
              <Link href="/operation-logs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                全部日志 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentLogs.map((log: any) => {
                const user = userMap.get(log.userId);
                const typeLabels: Record<string, string> = {
                  UPLOAD: '上传',
                  VIEW: '查看',
                  REVIEW: '审阅',
                  APPROVE: '通过',
                  REJECT: '驳回',
                  DOWNLOAD: '下载',
                  STAMP: '盖章',
                  UPDATE_RULE: '规则',
                  UPDATE_PERMISSION: '权限',
                  RISK_FLAG: '风险',
                };
                return (
                  <div key={log.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="badge badge-primary mt-0.5 flex-shrink-0">
                        {typeLabels[log.operationType] || log.operationType}
                      </span>
                      <p className="text-sm text-gray-700 line-clamp-2">{log.description}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <span>{user?.name || '未知'}</span>
                      <span>·</span>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                团队成员
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {users.slice(0, 4).map((user: any) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.role === 'LEGAL_MANAGER' ? '法务负责人' :
                       user.role === 'PRO_BONO_LAWYER' ? '公益律师' :
                       user.role === 'REVIEWER' ? '合同审阅人' : '系统管理员'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
