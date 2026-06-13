'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import type { TaskWithRelations } from '@/types';
import { formatDate, getDaysRemaining, getOverdueDays, cn } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import ProgressBar from '@/components/ProgressBar';
import Avatar from '@/components/Avatar';
import ProgressUpdatePanel from '@/components/ProgressUpdatePanel';
import AttachmentUploader from '@/components/AttachmentUploader';
import CommentSection from '@/components/CommentSection';
import AuditLogTimeline from '@/components/AuditLogTimeline';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  UserPlus,
  Paperclip,
  MessageSquare,
  History,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const getTaskById = useStore((state) => state.getTaskById);
  const tasksLoaded = useStore((state) => state.tasks.length > 0);
  const [task, setTask] = useState<TaskWithRelations | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!tasksLoaded) return;
    const loadedTask = getTaskById(taskId);
    setTask(loadedTask);
    if (!loadedTask) {
      router.push('/');
    }
  }, [taskId, getTaskById, router, refreshKey, tasksLoaded]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!tasksLoaded || !task) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const daysRemaining = getDaysRemaining(task.deadline);
  const isOverdue = task.status === 'overdue';
  const isUrgent = daysRemaining <= 2 && task.status !== 'completed';
  const overdueDays = getOverdueDays(task.deadline);

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回看板
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <StatusBadge status={task.status} size="sm" />
              <PriorityBadge priority={task.priority} size="sm" />
              {task.requires_attachment && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Paperclip className="w-3.5 h-3.5" />
                  需上传附件
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">截止日期</span>
          </div>
          <p className={cn(
            'font-semibold',
            isOverdue && 'text-danger-600',
            isUrgent && !isOverdue && 'text-warning-600'
          )}>
            {formatDate(task.deadline)}
            {isOverdue && (
              <span className="ml-2 text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                超期 {overdueDays} 天
              </span>
            )}
            {isUrgent && !isOverdue && daysRemaining >= 0 && (
              <span className="ml-2 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                剩余 {daysRemaining} 天
              </span>
            )}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">所属部门</span>
          </div>
          <p className="font-semibold text-gray-900">
            {task.department?.name || '未分配'}
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm">责任人</span>
          </div>
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar name={task.assignee.name} size="sm" />
              <span className="font-semibold text-gray-900">{task.assignee.name}</span>
            </div>
          ) : (
            <p className="font-semibold text-gray-400 flex items-center gap-1">
              <UserPlus className="w-4 h-4" />
              暂未认领
            </p>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">完成进度</span>
          </div>
          <ProgressBar progress={task.progress} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ProgressUpdatePanel task={task} onUpdate={handleRefresh} />
          
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">事项信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建人</span>
                <div className="flex items-center gap-2">
                  <Avatar name={task.creator?.name || '未知'} size="sm" />
                  <span className="text-gray-900">{task.creator?.name || '未知'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-900">{formatDate(task.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">更新时间</span>
                <span className="text-gray-900">{formatDate(task.updated_at)}</span>
              </div>
              {task.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span className="text-success-600 font-medium">{formatDate(task.completed_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Paperclip className="w-4 h-4" />
                  附件数量
                </span>
                <span className={cn(
                  'font-medium',
                  task.requires_attachment && (!task.attachments || task.attachments.length === 0)
                    ? 'text-danger-600'
                    : 'text-gray-900'
                )}>
                  {task.attachments?.length || 0} 个
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  评论数量
                </span>
                <span className="text-gray-900">{task.comments?.length || 0} 条</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <History className="w-4 h-4" />
                  操作记录
                </span>
                <span className="text-gray-900">{task.audit_logs?.length || 0} 条</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <AttachmentUploader task={task} onUpdate={handleRefresh} />
          <CommentSection task={task} onUpdate={handleRefresh} />
          <AuditLogTimeline task={task} />
        </div>
      </div>
    </AppLayout>
  );
}
