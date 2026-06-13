import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  Task,
  TaskStatus,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
  UploadAttachmentInput,
  CreateCommentInput,
  TaskWithRelations,
  Attachment,
  Comment,
  AuditLog,
  DepartmentStats,
  ReminderRule,
  Department,
} from '@/types';
import {
  mockTasks,
  mockUsers,
  mockDepartments,
  mockAttachments,
  mockComments,
  mockAuditLogs,
  mockReminderRules,
} from '@/lib/mock-data';
import { generateId, isOverdue } from '@/lib/utils';

interface AppState {
  currentUser: User | null;
  tasks: Task[];
  users: User[];
  departments: Department[];
  attachments: Attachment[];
  comments: Comment[];
  auditLogs: AuditLog[];
  reminderRules: ReminderRule[];
  filters: TaskFilters;
  isLoading: boolean;

  login: (email: string) => Promise<boolean>;
  logout: () => void;

  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => TaskWithRelations | undefined;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  claimTask: (taskId: string) => Promise<Task>;
  updateProgress: (taskId: string, progress: number) => Promise<Task>;
  updateStatus: (taskId: string, status: TaskStatus) => Promise<Task>;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;

  uploadAttachment: (input: UploadAttachmentInput) => Promise<Attachment>;
  deleteAttachment: (id: string) => Promise<void>;
  getAttachmentsForTask: (taskId: string) => Attachment[];

  addComment: (input: CreateCommentInput) => Promise<Comment>;
  getCommentsForTask: (taskId: string) => (Comment & { user?: User })[];

  getAuditLogsForTask: (taskId: string) => (AuditLog & { user?: User })[];
  getAuditLogs: () => (AuditLog & { user?: User })[];

  getDepartmentStats: () => DepartmentStats[];
  getOverdueTasks: () => TaskWithRelations[];

  getReminderRules: () => ReminderRule[];
  updateReminderRule: (id: string, rule: Partial<ReminderRule>) => Promise<ReminderRule>;
  createUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<User>;
  updateUser: (id: string, user: Partial<User>) => Promise<User>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      tasks: [],
      users: [],
      departments: [],
      attachments: [],
      comments: [],
      auditLogs: [],
      reminderRules: [],
      filters: {},
      isLoading: false,

      login: async (email: string) => {
        const user = mockUsers.find((u) => u.email === email);
        if (user) {
          set({ currentUser: user });
          get().fetchTasks();
          set({
            users: mockUsers,
            departments: mockDepartments,
            attachments: mockAttachments,
            comments: mockComments,
            auditLogs: mockAuditLogs,
            reminderRules: mockReminderRules,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      fetchTasks: async () => {
        set({ isLoading: true });
        const allTasks = mockTasks.map((task) => {
          if (task.status === 'completed') return task;
          if (isOverdue(task.deadline, task.status)) {
            return { ...task, status: 'overdue' as const };
          }
          return task;
        });
        set({ tasks: allTasks, isLoading: false });
      },

      getTaskById: (id: string) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return undefined;

        const assignee = state.users.find((u) => u.id === task.assignee_id);
        const creator = state.users.find((u) => u.id === task.creator_id);
        const department = state.departments.find((d) => d.id === task.department_id);
        const attachments = state.attachments.filter((a) => a.task_id === id);
        const comments = state.getCommentsForTask(id);
        const auditLogs = state.getAuditLogsForTask(id);

        return {
          ...task,
          assignee,
          creator,
          department,
          attachments,
          comments,
          audit_logs: auditLogs,
        };
      },

      createTask: async (input: CreateTaskInput) => {
        const state = get();
        const currentUser = state.currentUser!;
        const now = new Date().toISOString();
        const newTask: Task = {
          id: generateId(),
          ...input,
          status: 'todo',
          progress: 0,
          creator_id: currentUser.id,
          created_at: now,
          updated_at: now,
        };

        const newLog: AuditLog = {
          id: generateId(),
          task_id: newTask.id,
          user_id: currentUser.id,
          action: 'create',
          new_value: 'todo',
          metadata: { title: input.title },
          created_at: now,
        };

        set({
          tasks: [...state.tasks, newTask],
          auditLogs: [...state.auditLogs, newLog],
        });

        return newTask;
      },

      updateTask: async (id: string, input: UpdateTaskInput) => {
        const state = get();
        const now = new Date().toISOString();
        const taskIndex = state.tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) throw new Error('Task not found');

        const oldTask = state.tasks[taskIndex];
        const updatedTask = { ...oldTask, ...input, updated_at: now };

        const newLogs: AuditLog[] = [...state.auditLogs];
        const currentUserId = state.currentUser!.id;

        if (input.status && input.status !== oldTask.status) {
          newLogs.push({
            id: generateId(),
            task_id: id,
            user_id: currentUserId,
            action: 'update_status',
            old_value: oldTask.status,
            new_value: input.status,
            created_at: now,
          });

          if (input.status === 'completed' && oldTask.requires_attachment) {
            const hasAttachments = state.attachments.some((a) => a.task_id === id);
            if (!hasAttachments) {
              newLogs.push({
                id: generateId(),
                task_id: id,
                user_id: currentUserId,
                action: 'missing_attachment',
                metadata: { warning: '标记完成但未上传附件' },
                created_at: now,
              });
            }
          }
        }

        if (input.progress !== undefined && input.progress !== oldTask.progress) {
          newLogs.push({
            id: generateId(),
            task_id: id,
            user_id: currentUserId,
            action: 'update_progress',
            old_value: oldTask.progress.toString(),
            new_value: input.progress.toString(),
            created_at: now,
          });
        }

        if (input.assignee_id && input.assignee_id !== oldTask.assignee_id) {
          newLogs.push({
            id: generateId(),
            task_id: id,
            user_id: currentUserId,
            action: 'assign',
            old_value: oldTask.assignee_id,
            new_value: input.assignee_id,
            created_at: now,
          });
        }

        const newTasks = [...state.tasks];
        newTasks[taskIndex] = updatedTask;

        set({ tasks: newTasks, auditLogs: newLogs });
        return updatedTask;
      },

      claimTask: async (taskId: string) => {
        const state = get();
        const currentUser = state.currentUser!;
        return state.updateTask(taskId, {
          assignee_id: currentUser.id,
          status: 'in_progress',
        });
      },

      updateProgress: async (taskId: string, progress: number) => {
        return get().updateTask(taskId, { progress });
      },

      updateStatus: async (taskId: string, status: TaskStatus) => {
        return get().updateTask(taskId, { status });
      },

      setFilters: (filters: Partial<TaskFilters>) => {
        set({ filters: { ...get().filters, ...filters } });
      },

      resetFilters: () => {
        set({ filters: {} });
      },

      uploadAttachment: async (input: UploadAttachmentInput) => {
        const state = get();
        const currentUser = state.currentUser!;
        const now = new Date().toISOString();
        const existingAttachments = state.attachments.filter((a) => a.task_id === input.task_id);
        const version = existingAttachments.length + 1;

        const newAttachment: Attachment = {
          id: generateId(),
          task_id: input.task_id,
          version,
          file_name: input.file_name,
          file_path: `/attachments/${input.task_id}/${input.file_name}`,
          file_size: input.file_size,
          mime_type: input.mime_type,
          uploaded_by: currentUser.id,
          created_at: now,
        };

        const newLog: AuditLog = {
          id: generateId(),
          task_id: input.task_id,
          user_id: currentUser.id,
          action: 'upload_attachment',
          new_value: input.file_name,
          metadata: { version, size: input.file_size },
          created_at: now,
        };

        set({
          attachments: [...state.attachments, newAttachment],
          auditLogs: [...state.auditLogs, newLog],
        });

        return newAttachment;
      },

      deleteAttachment: async (id: string) => {
        const state = get();
        const attachment = state.attachments.find((a) => a.id === id);
        if (!attachment) throw new Error('Attachment not found');

        const now = new Date().toISOString();
        const newLog: AuditLog = {
          id: generateId(),
          task_id: attachment.task_id,
          user_id: state.currentUser!.id,
          action: 'delete_attachment',
          old_value: attachment.file_name,
          metadata: { version: attachment.version },
          created_at: now,
        };

        set({
          attachments: state.attachments.filter((a) => a.id !== id),
          auditLogs: [...state.auditLogs, newLog],
        });
      },

      getAttachmentsForTask: (taskId: string) => {
        return get().attachments.filter((a) => a.task_id === taskId);
      },

      addComment: async (input: CreateCommentInput) => {
        const state = get();
        const currentUser = state.currentUser!;
        const now = new Date().toISOString();

        const newComment: Comment = {
          id: generateId(),
          ...input,
          user_id: currentUser.id,
          created_at: now,
        };

        const newLog: AuditLog = {
          id: generateId(),
          task_id: input.task_id,
          user_id: currentUser.id,
          action: 'comment',
          new_value: input.content.substring(0, 100),
          created_at: now,
        };

        set({
          comments: [...state.comments, newComment],
          auditLogs: [...state.auditLogs, newLog],
        });

        return newComment;
      },

      getCommentsForTask: (taskId: string) => {
        const state = get();
        return state.comments
          .filter((c) => c.task_id === taskId)
          .map((comment) => ({
            ...comment,
            user: state.users.find((u) => u.id === comment.user_id),
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getAuditLogsForTask: (taskId: string) => {
        const state = get();
        return state.auditLogs
          .filter((l) => l.task_id === taskId)
          .map((log) => ({
            ...log,
            user: state.users.find((u) => u.id === log.user_id),
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getAuditLogs: () => {
        const state = get();
        return state.auditLogs
          .map((log) => ({
            ...log,
            user: state.users.find((u) => u.id === log.user_id),
          }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },

      getDepartmentStats: () => {
        const state = get();
        return state.departments.map((dept) => {
          const deptTasks = state.tasks.filter((t) => t.department_id === dept.id);
          const total = deptTasks.length;
          const completed = deptTasks.filter((t) => t.status === 'completed').length;
          const overdue = deptTasks.filter((t) => t.status === 'overdue').length;
          const inProgress = deptTasks.filter((t) => t.status === 'in_progress').length;
          const todo = deptTasks.filter((t) => t.status === 'todo').length;

          return {
            department_id: dept.id,
            department_name: dept.name,
            total_tasks: total,
            completed_tasks: completed,
            overdue_tasks: overdue,
            in_progress_tasks: inProgress,
            todo_tasks: todo,
            closure_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        });
      },

      getOverdueTasks: () => {
        const state = get();
        return state.tasks
          .filter((t) => t.status === 'overdue')
          .map((task) => {
            const assignee = state.users.find((u) => u.id === task.assignee_id);
            const creator = state.users.find((u) => u.id === task.creator_id);
            const department = state.departments.find((d) => d.id === task.department_id);
            return { ...task, assignee, creator, department };
          });
      },

      getReminderRules: () => {
        return get().reminderRules;
      },

      updateReminderRule: async (id: string, rule: Partial<ReminderRule>) => {
        const state = get();
        const index = state.reminderRules.findIndex((r) => r.id === id);
        if (index === -1) throw new Error('Rule not found');

        const updatedRule = { ...state.reminderRules[index], ...rule };
        const newRules = [...state.reminderRules];
        newRules[index] = updatedRule;

        set({ reminderRules: newRules });
        return updatedRule;
      },

      createUser: async (userInput) => {
        const state = get();
        const now = new Date().toISOString();
        const newUser: User = {
          id: generateId(),
          ...userInput,
          created_at: now,
        };
        set({ users: [...state.users, newUser] });
        return newUser;
      },

      updateUser: async (id: string, userInput) => {
        const state = get();
        const index = state.users.findIndex((u) => u.id === id);
        if (index === -1) throw new Error('User not found');

        const updatedUser = { ...state.users[index], ...userInput };
        const newUsers = [...state.users];
        newUsers[index] = updatedUser;

        set({ users: newUsers });
        return updatedUser;
      },
    }),
    {
      name: 'weekly-meeting-dashboard-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
