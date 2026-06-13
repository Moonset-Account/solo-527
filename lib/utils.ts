import { TaskStatus, TaskPriority, AuditAction } from '@/types';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

export const getDaysRemaining = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getOverdueDays = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = now.getTime() - deadlineDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isOverdue = (deadline: string, status: TaskStatus): boolean => {
  if (status === 'completed') return false;
  return getDaysRemaining(deadline) < 0;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStatusLabel = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已延期',
  };
  return labels[status];
};

export const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700 border-gray-300',
    in_progress: 'bg-primary-50 text-primary-700 border-primary-300',
    completed: 'bg-success-50 text-success-700 border-success-300',
    overdue: 'bg-danger-50 text-danger-700 border-danger-300',
  };
  return colors[status];
};

export const getPriorityLabel = (priority: TaskPriority): string => {
  const labels: Record<TaskPriority, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority];
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-warning-100 text-warning-600',
    urgent: 'bg-danger-100 text-danger-600',
  };
  return colors[priority];
};

export const getActionLabel = (action: AuditAction): string => {
  const labels: Record<AuditAction, string> = {
    create: '创建事项',
    update_status: '更新状态',
    update_progress: '更新进度',
    upload_attachment: '上传附件',
    delete_attachment: '删除附件',
    comment: '发表评论',
    missing_attachment: '附件缺失警告',
    claim: '认领事项',
    assign: '分配责任人',
  };
  return labels[action];
};

export const getActionIcon = (action: AuditAction): string => {
  const icons: Record<AuditAction, string> = {
    create: 'PlusCircle',
    update_status: 'RefreshCw',
    update_progress: 'TrendingUp',
    upload_attachment: 'Upload',
    delete_attachment: 'Trash2',
    comment: 'MessageSquare',
    missing_attachment: 'AlertTriangle',
    claim: 'UserPlus',
    assign: 'Users',
  };
  return icons[action];
};

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-primary-500',
    'bg-success-500',
    'bg-warning-500',
    'bg-danger-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};
