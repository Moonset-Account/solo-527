'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import { formatDate, getActionLabel } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import {
  History,
  Search,
  Filter,
  AlertTriangle,
  Upload,
  Trash2,
  UserPlus,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  Download,
} from 'lucide-react';

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

const colorMap = {
  create: 'bg-success-100 text-success-600',
  update_status: 'bg-primary-100 text-primary-600',
  update_progress: 'bg-blue-100 text-blue-600',
  upload_attachment: 'bg-success-100 text-success-600',
  delete_attachment: 'bg-danger-100 text-danger-600',
  comment: 'bg-purple-100 text-purple-600',
  missing_attachment: 'bg-warning-100 text-warning-600',
  claim: 'bg-cyan-100 text-cyan-600',
  assign: 'bg-indigo-100 text-indigo-600',
};

export default function AuditLogPage() {
  const auditLogs = useStore((state) => state.getAuditLogs());
  const users = useStore((state) => state.users);
  const tasks = useStore((state) => state.tasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  const actions = [
    'create',
    'update_status',
    'update_progress',
    'upload_attachment',
    'delete_attachment',
    'comment',
    'missing_attachment',
    'claim',
    'assign',
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const user = users.find(u => u.id === log.user_id);
      const task = tasks.find(t => t.id === log.task_id);
      const searchText = `${task?.title} ${user?.name} ${log.action} ${log.old_value} ${log.new_value}`.toLowerCase();
      const matchesSearch = searchText.includes(searchTerm.toLowerCase());
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesUser = filterUser === 'all' || log.user_id === filterUser;
      return matchesSearch && matchesAction && matchesUser;
    });
  }, [auditLogs, searchTerm, filterAction, filterUser, users, tasks]);

  const stats = useMemo(() => {
    const missingCount = auditLogs.filter(l => l.action === 'missing_attachment').length;
    const uploadCount = auditLogs.filter(l => l.action === 'upload_attachment').length;
    const deleteCount = auditLogs.filter(l => l.action === 'delete_attachment').length;
    return { missingCount, uploadCount, deleteCount };
  }, [auditLogs]);

  const getTaskTitle = (taskId?: string) => {
    if (!taskId) return '系统操作';
    return tasks.find(t => t.id === taskId)?.title || '未知事项';
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '系统';
    return users.find(u => u.id === userId)?.name || '未知用户';
  };

  const getActionDescription = (log: typeof filteredLogs[0]) => {
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
        return `发表了评论`;
      case 'missing_attachment':
        return `⚠️ 附件缺失警告: ${log.metadata?.warning || '缺少必需附件'}`;
      case 'claim':
        return `认领了此事项`;
      case 'assign':
        return `分配了责任人`;
      default:
        return getActionLabel(log.action);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <History className="w-7 h-7 text-primary-900" />
              审计日志
            </h1>
            <p className="text-gray-500">完整记录所有用户操作和系统事件，特别是附件相关操作</p>
          </div>
          <button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success-100 p-2 rounded-lg">
              <Upload className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">附件上传</p>
              <p className="text-2xl font-bold text-success-600">{stats.uploadCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-danger-100 p-2 rounded-lg">
              <Trash2 className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">附件删除</p>
              <p className="text-2xl font-bold text-danger-600">{stats.deleteCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-warning-50 border-warning-200">
          <div className="flex items-center gap-3">
            <div className="bg-warning-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-warning-600">附件缺失警告</p>
              <p className="text-2xl font-bold text-warning-700">{stats.missingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索操作日志..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="select"
            >
              <option value="all">全部操作</option>
              {actions.map((action) => (
                <option key={action} value={action}>{getActionLabel(action)}</option>
              ))}
            </select>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="select"
            >
              <option value="all">全部用户</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">关联事项</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">详情</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const Icon = iconMap[log.action] || History;
                const isWarning = log.action === 'missing_attachment';
                const isDelete = log.action === 'delete_attachment';

                return (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isWarning ? 'bg-warning-50/30' : isDelete ? 'bg-danger-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm whitespace-nowrap">{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={getUserName(log.user_id)} size="sm" />
                        <span className="text-sm text-gray-900">{getUserName(log.user_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 font-medium">
                        {getTaskTitle(log.task_id)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className={`text-sm ${isWarning ? 'text-warning-700 font-medium' : isDelete ? 'text-danger-700' : 'text-gray-600'}`}>
                          {getActionDescription(log)}
                        </p>
                        {log.metadata && log.action === 'upload_attachment' && (
                          <p className="text-xs text-gray-400 mt-1">
                            版本: v{log.metadata.version} · 大小: {Math.round(Number(log.metadata.size) / 1024)} KB
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>没有找到匹配的操作记录</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        共 {filteredLogs.length} 条记录
      </div>
    </AppLayout>
  );
}
