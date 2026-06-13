'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { TaskStatus, TaskWithRelations } from '@/types';
import { getStatusLabel, cn } from '@/lib/utils';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface ProgressUpdatePanelProps {
  task: TaskWithRelations;
  onUpdate: () => void;
}

export default function ProgressUpdatePanel({ task, onUpdate }: ProgressUpdatePanelProps) {
  const currentUser = useStore((state) => state.currentUser);
  const updateProgress = useStore((state) => state.updateProgress);
  const updateStatus = useStore((state) => state.updateStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localProgress, setLocalProgress] = useState(task.progress);

  const canEdit = currentUser?.role === 'admin' ||
    currentUser?.id === task.assignee_id ||
    currentUser?.id === task.creator_id ||
    (currentUser?.role === 'manager' && currentUser.department_id === task.department_id);

  const handleProgressChange = async (newProgress: number) => {
    if (!canEdit) return;
    setIsUpdating(true);
    try {
      await updateProgress(task.id, newProgress);
      if (newProgress === 100 && task.status !== 'completed') {
        await updateStatus(task.id, 'completed');
      } else if (newProgress > 0 && newProgress < 100 && task.status === 'todo') {
        await updateStatus(task.id, 'in_progress');
      }
      onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!canEdit || task.status === status) return;
    setIsUpdating(true);
    try {
      await updateStatus(task.id, status);
      if (status === 'completed') {
        setLocalProgress(100);
        await updateProgress(task.id, 100);
      }
      onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: '待办', color: 'bg-gray-500' },
    { value: 'in_progress', label: '进行中', color: 'bg-primary-500' },
    { value: 'completed', label: '已完成', color: 'bg-success-500' },
  ];

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-900" />
        进度更新
      </h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">当前进度</span>
          <span className="text-2xl font-bold text-primary-900">{localProgress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          disabled={!canEdit || isUpdating}
          className={cn(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
            !canEdit && 'opacity-50 cursor-not-allowed'
          )}
        />
        <div className="flex justify-between mt-1">
          {[0, 25, 50, 75, 100].map((val) => (
            <span key={val} className="text-xs text-gray-400">{val}%</span>
          ))}
        </div>
        {canEdit && (
          <button
            onClick={() => handleProgressChange(localProgress)}
            disabled={isUpdating || localProgress === task.progress}
            className="mt-3 w-full btn-primary"
          >
            {isUpdating ? '更新中...' : '更新进度'}
          </button>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-3">快速标记状态</p>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={!canEdit || isUpdating || task.status === option.value}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                task.status === option.value
                  ? `${option.color} text-white border-transparent`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                (!canEdit || isUpdating) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {task.requires_attachment && task.status === 'completed' && task.attachments?.length === 0 && (
        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-700">
            ⚠️ 此事项要求必须上传附件，但当前尚未上传任何附件。此操作已记录在审计日志中。
          </p>
        </div>
      )}
    </div>
  );
}
