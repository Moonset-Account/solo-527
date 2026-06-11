import { nanoid } from 'nanoid';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import type {
  TodoItem,
  ParseOptions,
  ParseResult,
  ParseError,
} from './types.js';
import { Note2TaskError } from './errors.js';

const DEFAULT_TODO_SYMBOLS = ['- [ ]', '- [x]', '- [X]', '- [-]', '* [ ]', '* [x]', '* [X]', '* [-]'];

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function extractTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5/-]*)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return [...new Set(tags)];
}

function extractDueDate(content: string): string | undefined {
  const patterns = [
    /@due\(?(20\d{2}-\d{2}-\d{2})\)?/i,
    /📅\s*(20\d{2}-\d{2}-\d{2})/i,
    /截止日期[:：]\s*(20\d{2}-\d{2}-\d{2})/i,
    /due[:：\s]+(20\d{2}-\d{2}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function extractPriority(content: string): 'low' | 'medium' | 'high' {
  if (/[!！]{3}/.test(content) || /priority[:：]\s*high/i.test(content) || /🔴/.test(content)) {
    return 'high';
  }
  if (/[!！]{2}/.test(content) || /priority[:：]\s*medium/i.test(content) || /🟡/.test(content)) {
    return 'medium';
  }
  if (/[!！]{1}/.test(content) || /priority[:：]\s*low/i.test(content) || /🟢/.test(content)) {
    return 'low';
  }
  return 'medium';
}

function extractProject(content: string): string | undefined {
  const patterns = [
    /@project\(?(.*?)\)?(?=\s|$)/i,
    /项目[:：]\s*(\S+)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractHeadingProject(line: string): string | undefined {
  const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
  if (headingMatch) {
    const heading = headingMatch[1].trim();
    const cleaned = heading
      .replace(/#[a-zA-Z0-9_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5/-]*/g, '')
      .replace(/@\w+\(.*?\)/g, '')
      .trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return undefined;
}

function parseTodoStatus(symbol: string): 'pending' | 'done' | 'cancelled' {
  const lower = symbol.toLowerCase();
  if (lower.includes('[x]')) return 'done';
  if (lower.includes('[-]')) return 'cancelled';
  return 'pending';
}

function cleanTitle(content: string): string {
  let title = content;
  title = title.replace(/#[a-zA-Z0-9_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5/-]*/g, '');
  title = title.replace(/@\w+\(.*?\)/g, '');
  title = title.replace(/@due\(20\d{2}-\d{2}-\d{2}\)/gi, '');
  title = title.replace(/@due20\d{2}-\d{2}-\d{2}/gi, '');
  title = title.replace(/📅\s*20\d{2}-\d{2}-\d{2}/g, '');
  title = title.replace(/截止日期[:：]\s*20\d{2}-\d{2}-\d{2}/g, '');
  title = title.replace(/priority[:：]\s*(high|medium|low)/gi, '');
  title = title.replace(/[!！]+/g, '');
  title = title.replace(/[🔴🟡🟢]/g, '');
  title = title.replace(/项目[:：]\s*\S+/g, '');
  title = title.trim();
  title = title.replace(/^[-*]\s*\[[ xX\-]\]\s*/, '');
  title = title.trim();
  return title;
}

export function parseTodoLine(
  line: string,
  lineNumber: number,
  filePath: string,
  options: ParseOptions = {},
  inheritedProject?: string
): TodoItem | null {
  const todoSymbols = options.todoSymbols ?? DEFAULT_TODO_SYMBOLS;
  const defaultPriority = options.defaultPriority ?? 'medium';

  let matchedSymbol = '';
  for (const symbol of todoSymbols) {
    if (line.trim().startsWith(symbol)) {
      matchedSymbol = symbol;
      break;
    }
  }

  if (!matchedSymbol) {
    return null;
  }

  const status = parseTodoStatus(matchedSymbol);
  const tags = extractTags(line);
  const dueDate = extractDueDate(line);
  const priorityFromContent = extractPriority(line);
  const explicitProject = extractProject(line);
  const project = explicitProject || inheritedProject;
  const title = cleanTitle(line);

  if (!title) {
    return null;
  }

  const id = nanoid(12);

  return {
    id,
    title,
    status,
    priority: priorityFromContent || defaultPriority,
    dueDate,
    tags,
    project,
    sourceFile: normalizePath(filePath),
    sourceLine: lineNumber,
    rawContent: line.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function parseMarkdownContent(
  content: string,
  filePath: string,
  options: ParseOptions = {}
): { todos: TodoItem[]; errors: ParseError[] } {
  const lines = content.split('\n');
  const todos: TodoItem[] = [];
  const errors: ParseError[] = [];
  let currentProject: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    const headingProject = extractHeadingProject(line);
    if (headingProject !== undefined) {
      currentProject = headingProject;
      continue;
    }

    try {
      const todo = parseTodoLine(line, lineNumber, filePath, options, currentProject);
      if (todo) {
        todos.push(todo);
      }
    } catch (error) {
      errors.push({
        file: filePath,
        line: lineNumber,
        message: error instanceof Error ? error.message : '未知解析错误',
        code: 'PARSE_LINE_ERROR',
        suggestion: '检查该行的 Markdown 待办格式是否正确',
      });
    }
  }

  return { todos, errors };
}

export async function parseFile(
  filePath: string,
  options: ParseOptions = {}
): Promise<{ todos: TodoItem[]; errors: ParseError[] }> {
  try {
    try {
      await access(filePath, constants.R_OK);
    } catch {
      throw new Note2TaskError(
        `文件不存在: ${filePath}`,
        'FILE_NOT_FOUND',
        undefined,
        { file: filePath, suggestion: '检查文件路径是否正确，或确认文件是否存在' }
      );
    }

    const content = await readFile(filePath, 'utf-8');
    return parseMarkdownContent(content, filePath, options);
  } catch (error) {
    if (error instanceof Note2TaskError) {
      throw error;
    }
    throw new Note2TaskError(
      `读取文件失败: ${filePath}`,
      'FILE_READ_ERROR',
      undefined,
      {
        file: filePath,
        suggestion: '检查文件权限，或确认文件格式是否为纯文本 Markdown',
      }
    );
  }
}

export async function parseFiles(
  filePaths: string[],
  options: ParseOptions = {}
): Promise<ParseResult> {
  const allTodos: TodoItem[] = [];
  const allErrors: ParseError[] = [];
  let filesProcessed = 0;

  for (const filePath of filePaths) {
    try {
      const { todos, errors } = await parseFile(filePath, options);
      allTodos.push(...todos);
      allErrors.push(...errors);
      filesProcessed++;
    } catch (error) {
      if (error instanceof Note2TaskError) {
        allErrors.push({
          file: error.file ?? filePath,
          line: error.line,
          message: error.message,
          code: error.code,
          suggestion: error.suggestion,
        });
      } else {
        allErrors.push({
          file: filePath,
          message: error instanceof Error ? error.message : '未知错误',
          code: 'UNKNOWN_ERROR',
        });
      }
    }
  }

  const todosDone = allTodos.filter((t) => t.status === 'done').length;
  const todosPending = allTodos.filter((t) => t.status === 'pending').length;

  return {
    todos: allTodos,
    errors: allErrors,
    stats: {
      filesProcessed,
      todosFound: allTodos.length,
      todosDone,
      todosPending,
    },
  };
}

export { DEFAULT_TODO_SYMBOLS };
