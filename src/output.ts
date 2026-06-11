import Table from 'cli-table3';
import chalk from 'chalk';
import type { TodoItem, SyncPreview, MachineReport } from './types.js';

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

function formatStatus(status: TodoItem['status']): string {
  switch (status) {
    case 'done':
      return chalk.green('✓ 已完成');
    case 'pending':
      return chalk.yellow('○ 待处理');
    case 'cancelled':
      return chalk.gray('✕ 已取消');
    default:
      return status;
  }
}

function formatPriority(priority: TodoItem['priority']): string {
  switch (priority) {
    case 'high':
      return chalk.red('高 🔴');
    case 'medium':
      return chalk.yellow('中 🟡');
    case 'low':
      return chalk.green('低 🟢');
    default:
      return priority;
  }
}

function formatTags(tags: string[]): string {
  if (tags.length === 0) return '-';
  return tags.map((t) => `#${t}`).join(' ');
}

export function renderTodoTable(todos: TodoItem[], title?: string): string {
  const table = new Table({
    head: [
      chalk.bold('状态'),
      chalk.bold('标题'),
      chalk.bold('优先级'),
      chalk.bold('截止日期'),
      chalk.bold('标签'),
      chalk.bold('项目'),
    ],
    colWidths: [12, 40, 10, 14, 20, 15],
    wordWrap: true,
  });

  for (const todo of todos) {
    table.push([
      formatStatus(todo.status),
      truncate(todo.title, 38),
      formatPriority(todo.priority),
      todo.dueDate || '-',
      truncate(formatTags(todo.tags), 18),
      todo.project || '-',
    ]);
  }

  let output = '';
  if (title) {
    output += chalk.bold.underline(`\n${title}\n\n`);
  }
  output += table.toString();
  output += `\n\n共 ${todos.length} 条任务\n`;

  return output;
}

export function renderSyncPreview(preview: SyncPreview): string {
  let output = '';

  output += chalk.bold.cyan('\n📋 同步预览\n');
  output += chalk.gray('─'.repeat(60) + '\n\n');

  output += chalk.green(`  ✚ 新增: ${preview.added.length} 条\n`);
  output += chalk.yellow(`  ✎ 更新: ${preview.updated.length} 条\n`);
  output += chalk.red(`  ✕ 删除: ${preview.removed.length} 条\n`);
  output += chalk.gray(`  ○ 不变: ${preview.unchanged.length} 条\n\n`);

  if (preview.added.length > 0) {
    output += chalk.green.bold('  新增任务:\n');
    for (const todo of preview.added) {
      output += `    + ${todo.title}`;
      if (todo.dueDate) output += chalk.cyan(` [${todo.dueDate}]`);
      output += '\n';
    }
    output += '\n';
  }

  if (preview.updated.length > 0) {
    output += chalk.yellow.bold('  更新任务:\n');
    for (const todo of preview.updated) {
      output += `    ~ ${todo.title}`;
      if (todo.dueDate) output += chalk.cyan(` [${todo.dueDate}]`);
      output += '\n';
    }
    output += '\n';
  }

  if (preview.removed.length > 0) {
    output += chalk.red.bold('  删除任务:\n');
    for (const todo of preview.removed) {
      output += `    - ${todo.title}`;
      if (todo.dueDate) output += chalk.cyan(` [${todo.dueDate}]`);
      output += '\n';
    }
    output += '\n';
  }

  return output;
}

export function renderStats(stats: {
  filesProcessed: number;
  todosFound: number;
  todosDone: number;
  todosPending: number;
}): string {
  const table = new Table({
    head: [chalk.bold('统计项'), chalk.bold('数量')],
    colWidths: [25, 15],
  });

  table.push(
    ['处理的文件数', stats.filesProcessed.toString()],
    ['发现的待办总数', stats.todosFound.toString()],
    [chalk.green('已完成'), stats.todosDone.toString()],
    [chalk.yellow('待处理'), stats.todosPending.toString()]
  );

  return `\n${table.toString()}\n`;
}

export function formatJson(data: unknown, pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

export function formatCsv(todos: TodoItem[]): string {
  const headers = [
    'id',
    'title',
    'status',
    'priority',
    'dueDate',
    'tags',
    'project',
    'sourceFile',
    'sourceLine',
  ];

  const escapeCsv = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const lines = [headers.join(',')];

  for (const todo of todos) {
    lines.push(
      [
        todo.id,
        escapeCsv(todo.title),
        todo.status,
        todo.priority,
        todo.dueDate || '',
        escapeCsv(todo.tags.join(';')),
        todo.project || '',
        escapeCsv(todo.sourceFile),
        todo.sourceLine.toString(),
      ].join(',')
    );
  }

  return lines.join('\n');
}

export function renderMachineReport(report: MachineReport): string {
  return formatJson(report, true);
}
