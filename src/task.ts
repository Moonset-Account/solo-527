import type {
  TodoItem,
  FilterOptions,
  SyncPreview,
} from './types';
import { parseISO, isSameDay, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { Note2TaskError } from './errors';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u4e00-\u9fa5\s]/g, '')
    .trim();
}

function generateStableKey(todo: TodoItem): string {
  const normalizedTitle = normalizeTitle(todo.title);
  const projectKey = todo.project?.toLowerCase() || '';
  const fileKey = todo.sourceFile.toLowerCase();
  return `${projectKey}:${normalizedTitle}:${fileKey}`;
}

export function deduplicateTodos(todos: TodoItem[]): {
  todos: TodoItem[];
  duplicates: Array<{ original: TodoItem; duplicate: TodoItem; reason: string }>;
} {
  const seen = new Map<string, TodoItem>();
  const duplicates: Array<{ original: TodoItem; duplicate: TodoItem; reason: string }> = [];
  const result: TodoItem[] = [];

  for (const todo of todos) {
    const key = generateStableKey(todo);

    if (seen.has(key)) {
      const original = seen.get(key)!;
      duplicates.push({
        original,
        duplicate: todo,
        reason: '标题+项目+源文件 相同',
      });
      if (todo.status === 'done' && original.status !== 'done') {
        seen.set(key, { ...todo, id: original.id });
      }
    } else {
      seen.set(key, todo);
      result.push(todo);
    }
  }

  const uniqueTodos = Array.from(seen.values());

  return { todos: uniqueTodos, duplicates };
}

export function filterTodos(
  todos: TodoItem[],
  options: FilterOptions
): TodoItem[] {
  let result = [...todos];

  if (options.status && options.status !== 'all') {
    result = result.filter((t) => t.status === options.status);
  }

  if (options.tag && options.tag.length > 0) {
    const tagSet = new Set(options.tag.map((t) => t.toLowerCase()));
    result = result.filter((t) =>
      t.tags.some((tag) => tagSet.has(tag.toLowerCase()))
    );
  }

  if (options.project) {
    const projectLower = options.project.toLowerCase();
    result = result.filter(
      (t) => t.project?.toLowerCase() === projectLower
    );
  }

  if (options.due) {
    try {
      const dueFilter = parseDueFilter(options.due);
      result = result.filter((t) => {
        if (!t.dueDate) return false;
        try {
          const dueDate = parseISO(t.dueDate);
          return dueFilter(dueDate);
        } catch {
          return false;
        }
      });
    } catch (error) {
      throw new Note2TaskError(
        `无效的截止日期过滤格式: ${options.due}`,
        'INVALID_DUE_FILTER',
        undefined,
        {
          suggestion: '使用格式：YYYY-MM-DD、today、tomorrow、this-week、overdue',
        }
      );
    }
  }

  if (options.from) {
    try {
      const fromDate = parseISO(options.from);
      result = result.filter((t) => {
        if (!t.dueDate) return true;
        try {
          const dueDate = parseISO(t.dueDate);
          return isAfter(dueDate, startOfDay(fromDate)) || isSameDay(dueDate, fromDate);
        } catch {
          return true;
        }
      });
    } catch (error) {
      throw new Note2TaskError(
        `无效的起始日期格式: ${options.from}`,
        'INVALID_FROM_DATE',
        undefined,
        {
          suggestion: '使用格式：YYYY-MM-DD',
        }
      );
    }
  }

  return result;
}

function parseDueFilter(filter: string): (date: Date) => boolean {
  const now = new Date();
  const today = startOfDay(now);

  switch (filter.toLowerCase()) {
    case 'today':
      return (date) => isSameDay(date, today);

    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return (date) => isSameDay(date, tomorrow);
    }

    case 'this-week': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return (date) =>
        (isAfter(date, weekStart) || isSameDay(date, weekStart)) &&
        (isBefore(date, endOfDay(weekEnd)) || isSameDay(date, weekEnd));
    }

    case 'overdue':
      return (date) => isBefore(date, today);

    case 'upcoming':
      return (date) => isAfter(date, today) || isSameDay(date, today);

    default: {
      if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
        const targetDate = parseISO(filter);
        return (date) => isSameDay(date, targetDate);
      }
      throw new Error(`无效的过滤格式: ${filter}`);
    }
  }
}

export function generateSyncPreview(
  sourceTodos: TodoItem[],
  existingTodos: TodoItem[]
): SyncPreview {
  const sourceMap = new Map<string, TodoItem>();
  const existingMap = new Map<string, TodoItem>();

  for (const todo of sourceTodos) {
    sourceMap.set(generateStableKey(todo), todo);
  }

  for (const todo of existingTodos) {
    existingMap.set(generateStableKey(todo), todo);
  }

  const added: TodoItem[] = [];
  const updated: TodoItem[] = [];
  const removed: TodoItem[] = [];
  const unchanged: TodoItem[] = [];

  for (const [key, sourceTodo] of sourceMap) {
    const existingTodo = existingMap.get(key);
    if (!existingTodo) {
      added.push(sourceTodo);
    } else if (hasChanges(sourceTodo, existingTodo)) {
      updated.push(sourceTodo);
    } else {
      unchanged.push(sourceTodo);
    }
  }

  for (const [key, existingTodo] of existingMap) {
    if (!sourceMap.has(key)) {
      removed.push(existingTodo);
    }
  }

  return { added, updated, removed, unchanged };
}

function hasChanges(a: TodoItem, b: TodoItem): boolean {
  return (
    a.title !== b.title ||
    a.status !== b.status ||
    a.priority !== b.priority ||
    a.dueDate !== b.dueDate ||
    JSON.stringify(a.tags.sort()) !== JSON.stringify(b.tags.sort()) ||
    a.project !== b.project
  );
}

export function sortTodos(
  todos: TodoItem[],
  sortBy: 'dueDate' | 'priority' | 'title' | 'source' = 'dueDate'
): TodoItem[] {
  const result = [...todos];

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  result.sort((a, b) => {
    switch (sortBy) {
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }

      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority];

      case 'title':
        return a.title.localeCompare(b.title);

      case 'source':
        if (a.sourceFile !== b.sourceFile) {
          return a.sourceFile.localeCompare(b.sourceFile);
        }
        return a.sourceLine - b.sourceLine;

      default:
        return 0;
    }
  });

  return result;
}
