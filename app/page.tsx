'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import TaskFilters from '@/components/TaskFilters';
import KanbanColumn from '@/components/KanbanColumn';
import CreateTaskModal from '@/components/CreateTaskModal';
import { useStore } from '@/store/useStore';
import { TaskStatus, TaskWithRelations } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const tasks = useStore((state) => state.tasks);
  const users = useStore((state) => state.users);
  const departments = useStore((state) => state.departments);
  const attachments = useStore((state) => state.attachments);
  const filters = useStore((state) => state.filters);
  const isLoading = useStore((state) => state.isLoading);
  const currentUser = useStore((state) => state.currentUser);
  const claimTask = useStore((state) => state.claimTask);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (currentUser?.role === 'user' && task.department_id !== currentUser.department_id) {
        return false;
      }

      if (currentUser?.role === 'manager' && task.department_id !== currentUser.department_id) {
        return false;
      }

      if (filters.status && task.status !== filters.status) return false;
      if (filters.department_id && task.department_id !== filters.department_id) return false;
      if (filters.assignee_id === 'unassigned' && task.assignee_id) return false;
      if (filters.assignee_id && filters.assignee_id !== 'unassigned' && task.assignee_id !== filters.assignee_id) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.deadline_to && new Date(task.deadline) > new Date(filters.deadline_to)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [tasks, filters, currentUser]);

  const tasksWithRelations = useMemo((): TaskWithRelations[] => {
    return filteredTasks.map((task) => ({
      ...task,
      assignee: users.find((u) => u.id === task.assignee_id),
      creator: users.find((u) => u.id === task.creator_id),
      department: departments.find((d) => d.id === task.department_id),
      attachments: attachments.filter((a) => a.task_id === task.id),
    }));
  }, [filteredTasks, users, departments, attachments]);

  const tasksByStatus = useMemo(() => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'completed', 'overdue'];
    return statuses.reduce((acc, status) => {
      acc[status] = tasksWithRelations.filter((t) => t.status === status);
      return acc;
    }, {} as Record<TaskStatus, TaskWithRelations[]>);
  }, [tasksWithRelations]);

  const handleClaim = async (taskId: string) => {
    await claimTask(taskId);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-900 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">周会事项看板</h1>
        <p className="text-gray-500">
          共 {filteredTasks.length} 个事项 · 
          <span className="text-danger-600"> {tasksByStatus.overdue.length} 个延期</span> · 
          <span className="text-success-600"> {tasksByStatus.completed.length} 个已完成</span>
        </p>
      </div>

      <TaskFilters onCreateTask={() => setCreateModalOpen(true)} />

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {(['todo', 'in_progress', 'completed', 'overdue'] as TaskStatus[]).map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onClaim={handleClaim}
          />
        ))}
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </AppLayout>
  );
}
