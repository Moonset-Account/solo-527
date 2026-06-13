'use client';

import { useStore } from '@/store/useStore';
import { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority } from '@/types';
import { Search, Filter, X, Calendar, Users, Building2 } from 'lucide-react';
import { getStatusLabel, getPriorityLabel } from '@/lib/utils';

interface TaskFiltersProps {
  onCreateTask: () => void;
}

export default function TaskFilters({ onCreateTask }: TaskFiltersProps) {
  const filters = useStore((state) => state.filters);
  const setFilters = useStore((state) => state.setFilters);
  const resetFilters = useStore((state) => state.resetFilters);
  const departments = useStore((state) => state.departments);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);

  const handleFilterChange = (key: keyof TaskFiltersType, value: string | undefined) => {
    setFilters({ [key]: value });
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  const visibleUsers = currentUser?.role === 'admin'
    ? users
    : users.filter(u => u.department_id === currentUser?.department_id);

  const visibleDepartments = currentUser?.role === 'admin'
    ? departments
    : departments.filter(d => d.id === currentUser?.department_id);

  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          <span>筛选条件</span>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            重置
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onCreateTask}
          className="btn-primary"
        >
          + 新建事项
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索事项..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="input pl-9"
          />
        </div>

        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filters.department_id || ''}
            onChange={(e) => handleFilterChange('department_id', e.target.value || undefined)}
            className="select pl-9 appearance-none"
          >
            <option value="">全部部门</option>
            {visibleDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filters.assignee_id || ''}
            onChange={(e) => handleFilterChange('assignee_id', e.target.value || undefined)}
            className="select pl-9 appearance-none"
          >
            <option value="">全部责任人</option>
            <option value="unassigned">未分配</option>
            {visibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', (e.target.value as TaskStatus) || undefined)}
            className="select appearance-none"
          >
            <option value="">全部状态</option>
            {(['todo', 'in_progress', 'completed', 'overdue'] as TaskStatus[]).map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', (e.target.value as TaskPriority) || undefined)}
            className="select appearance-none"
          >
            <option value="">全部优先级</option>
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={filters.deadline_to || ''}
            onChange={(e) => handleFilterChange('deadline_to', e.target.value || undefined)}
            className="input pl-9"
            placeholder="截止日期前"
          />
        </div>
      </div>
    </div>
  );
}
