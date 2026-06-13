'use client';

import { TaskWithRelations } from '@/types';
import { formatDate, getActionLabel } from '@/lib/utils';
import Avatar from './Avatar';
import {
  History,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Upload,
  Trash2,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  Users,
} from 'lucide-react';

interface AuditLogTimelineProps {
  task: TaskWithRelations;
}

const iconMap = {
  create: PlusCircle,
  update_status: RefreshCw,
  update_progress: TrendingUp,
  upload_attachment: Upload,
  delete_attachment: Trash2,
  comment: MessageSquare,
  missing_attachment: AlertTriangle,
  claim: UserPlus,
  assign: Users,
};

export default function AuditLogTimeline({ task }: AuditLogTimelineProps) {
  const logs = task.audit_logs || [];

  const getActionDescription = (log: typeof logs[0]) => {
    switch (log.action) {
      case 'create':
        return `创建了事项`;
      case 'update_status':
        return `将状态从 "${log.old_value}" 改为 "${log.new_value}"`;
      case 'update_progress':
        return `将进度从 ${log.old_value}% 更新为 ${log.new_value}%`;
      case 'upload_attachment':
        return `上传了附件 "${log.new_value}"`;
      case 'delete_attachment':
        return `删除了附件 "${log.old_value}"`;
      case 'comment':
        return `发表了评论: "${log.new_value}${log.new_value && log.new_value.length > 50 ? '...' : ''}"`;
      case 'missing_attachment':
        return `⚠️ ${log.metadata?.warning || '附件缺失警告'}`;
      case 'claim':
        return `认领了此事项`;
      case 'assign':
        return `分配了责任人`;
      default:
        return getActionLabel(log.action);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'border-success-400';
      case 'update_status':
        return 'border-primary-400';
      case 'update_progress':
        return 'border-blue-400';
      case 'upload_attachment':
        return 'border-success-400';
      case 'delete_attachment':
        return 'border-danger-400';
      case 'comment':
        return 'border-purple-400';
      case 'missing_attachment':
        return 'border-warning-400';
      case 'claim':
        return 'border-cyan-400';
      case 'assign':
        return 'border-indigo-400';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-primary-900" />
        操作日志
        <span className="text-sm font-normal text-gray-500">
          ({logs.length} 条记录)
        </span>
      </h3>

      {logs.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">暂无操作记录</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, index) => {
            const Icon = iconMap[log.action] || History;
            const isWarning = log.action === 'missing_attachment';

            return (
              <div key={log.id} className="timeline-item">
                <div className={`timeline-dot ${getActionColor(log.action)} border-4`} />
                <div className="flex items-start gap-3">
                  <Avatar name={log.user?.name || '系统'} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {log.user?.name || '系统'}
                      </span>
                      <span className={isWarning ? 'text-warning-600 font-medium' : 'text-gray-600'}>
                        {getActionDescription(log)}
                      </span>
                      {isWarning && (
                        <AlertTriangle className="w-4 h-4 text-warning-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{formatDate(log.created_at)}</span>
                      {log.metadata && log.action === 'upload_attachment' && (
                        <span className="ml-2">
                          (版本: v{log.metadata.version}, 大小: {Math.round(Number(log.metadata.size) / 1024)} KB)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
