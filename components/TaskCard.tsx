'use client';

import { useRouter } from 'next/navigation';
import { TaskWithRelations } from '@/types';
import { formatDateShort, getDaysRemaining, cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import Avatar from './Avatar';
import { Calendar, User, UserPlus, Paperclip } from 'lucide-react';

interface TaskCardProps {
  task: TaskWithRelations;
  onClaim?: (taskId: string) => void;
}

export default function TaskCard({ task, onClaim }: TaskCardProps) {
  const router = useRouter();
  const daysRemaining = getDaysRemaining(task.deadline);

  const handleClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClaim?.(task.id);
  };

  const isUrgent = daysRemaining <= 2 && task.status !== 'completed';
  const isOverdue = task.status === 'overdue';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'kanban-card group',
        isOverdue && 'border-danger-300 bg-danger-50/30',
        isUrgent && !isOverdue && 'border-warning-300'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} size="sm" />
          <PriorityBadge priority={task.priority} size="sm" />
        </div>
        {task.requires_attachment && (
          <Paperclip className={cn(
            'w-4 h-4',
            task.attachments && task.attachments.length > 0 ? 'text-success-500' : 'text-gray-400'
          )} />
        )}
      </div>

      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-900 transition-colors">
        {task.title}
      </h3>

      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {task.description}
      </p>

      <div className="mb-3">
        <ProgressBar progress={task.progress} showLabel size="sm" />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span className={cn(isOverdue && 'text-danger-600 font-medium', isUrgent && !isOverdue && 'text-warning-600')}>
            {formatDateShort(task.deadline)}
            {isOverdue && ` (超期${Math.abs(daysRemaining)}天)`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.attachments && task.attachments.length > 0 && (
            <span className="text-gray-400">{task.attachments.length}个附件</span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={task.assignee.name} size="sm" />
            <span className="text-sm text-gray-600">{task.assignee.name}</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <UserPlus className="w-4 h-4" />
            认领
          </button>
        )}

        {task.department && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {task.department.name}
          </span>
        )}
      </div>
    </div>
  );
}
