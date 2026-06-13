'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import type { TaskPriority } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import Avatar from '@/components/Avatar';
import {
  ListTodo,
  UserPlus,
  Calendar,
  Clock,
  Building2,
  User,
  Save,
  Edit2,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';

export default function AdminTasksPage() {
  const router = useRouter();
  const tasks = useStore((state) => state.tasks);
  const users = useStore((state) => state.users);
  const departments = useStore((state) => state.departments);
  const updateTask = useStore((state) => state.updateTask);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [editForm, setEditForm] = useState<{
    assignee_id: string;
    deadline: string;
    priority: TaskPriority;
    department_id: string;
  }>({
    assignee_id: '',
    deadline: '',
    priority: 'medium',
    department_id: '',
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || task.department_id === filterDept;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleEdit = (task: typeof tasks[0]) => {
    setEditingTaskId(task.id);
    setEditForm({
      assignee_id: task.assignee_id || '',
      deadline: task.deadline,
      priority: task.priority,
      department_id: task.department_id,
    });
  };

  const handleSave = async () => {
    if (!editingTaskId) return;
    setIsSaving(editingTaskId);
    try {
      await updateTask(editingTaskId, editForm);
      setEditingTaskId(null);
    } finally {
      setIsSaving(null);
    }
  };

  const unassignedCount = tasks.filter(t => !t.assignee_id).length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <ListTodo className="w-7 h-7 text-primary-900" />
          事项配置
        </h1>
        <p className="text-gray-500">为事项分配责任人、设置截止时间和优先级</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 bg-warning-50 border-warning-200">
          <div className="flex items-center gap-3">
            <div className="bg-warning-100 p-2 rounded-lg">
              <UserPlus className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-warning-600">待分配事项</p>
              <p className="text-2xl font-bold text-warning-700">{unassignedCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总事项数</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">可分配用户</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
                placeholder="搜索事项..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="select"
            >
              <option value="all">全部部门</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="todo">待办</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="overdue">已延期</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-80">事项</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">优先级</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部门</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">责任人</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">截止日期</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const isEditing = editingTaskId === task.id;
                const department = departments.find(d => d.id === task.department_id);
                const assignee = users.find(u => u.id === task.assignee_id);

                if (isEditing) {
                  return (
                    <tr key={task.id} className="border-b border-gray-100 bg-primary-50/30">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{task.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                          className="select text-sm"
                        >
                          <option value="low">低</option>
                          <option value="medium">中</option>
                          <option value="high">高</option>
                          <option value="urgent">紧急</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.department_id}
                          onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                          className="select text-sm"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.assignee_id}
                          onChange={(e) => setEditForm({ ...editForm, assignee_id: e.target.value })}
                          className="select text-sm"
                        >
                          <option value="">未分配</option>
                          {users
                            .filter(u => u.department_id === editForm.department_id)
                            .map((user) => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="date"
                          value={editForm.deadline}
                          onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                          className="input text-sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving === task.id}
                            className="btn-primary text-sm py-2 px-3"
                          >
                            {isSaving === task.id ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={task.id}
                    className={cn(
                      'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                      !task.assignee_id && 'bg-warning-50/50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {!task.assignee_id && (
                          <p className="text-xs text-warning-600 mt-1 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            待分配责任人
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {department?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={assignee.name} size="sm" />
                          <span className="text-sm text-gray-900">{assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-warning-600 font-medium flex items-center gap-1">
                          <UserPlus className="w-4 h-4" />
                          未分配
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                          title="查看详情"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p>没有找到匹配的事项</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
