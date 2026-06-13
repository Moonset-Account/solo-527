'use client';

import { TaskStatus, TaskWithRelations } from '@/types';
import { getStatusLabel, getStatusColor } from '@/lib/utils';
import TaskCard from './TaskCard';
import { ListTodo, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  onClaim: (taskId: string) => void;
}

const iconMap = {
  todo: ListTodo,
  in_progress: Clock,
  completed: CheckCircle,
  overdue: AlertTriangle,
};

export default function KanbanColumn({ status, tasks, onClaim }: KanbanColumnProps) {
  const Icon = iconMap[status];
  const colorClass = getStatusColor(status);

  return (
    <div className="kanban-column flex flex-col max-h-[calc(100vh-280px)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={colorClass.replace('text-', 'bg-').split(' ')[0] + ' rounded-md p-1.5'}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-gray-900">{getStatusLabel(status)}</h2>
          <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">暂无事项</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={onClaim} />
          ))
        )}
      </div>
    </div>
  );
}
