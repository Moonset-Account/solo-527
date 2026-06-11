export interface TodoItem {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  project?: string;
  sourceFile: string;
  sourceLine: number;
  rawContent: string;
  createdAt?: string;
  completedAt?: string;
}

export interface ParseOptions {
  todoSymbols?: string[];
  dateFormat?: string;
  defaultPriority?: 'low' | 'medium' | 'high';
}

export interface ParseResult {
  todos: TodoItem[];
  errors: ParseError[];
  stats: {
    filesProcessed: number;
    todosFound: number;
    todosDone: number;
    todosPending: number;
  };
}

export interface ParseError {
  file: string;
  line?: number;
  message: string;
  code: string;
  suggestion?: string;
}

export interface FilterOptions {
  from?: string;
  tag?: string[];
  due?: string;
  project?: string;
  status?: 'pending' | 'done' | 'all';
}

export interface SyncPreview {
  added: TodoItem[];
  updated: TodoItem[];
  removed: TodoItem[];
  unchanged: TodoItem[];
}

export interface MachineReport {
  version: string;
  command: string;
  timestamp: string;
  exitCode: number;
  success: boolean;
  summary: {
    total: number;
    processed: number;
    errors: number;
    warnings: number;
  };
  data?: {
    todos?: TodoItem[];
    syncPreview?: SyncPreview;
  };
  errors: ReportError[];
  performance?: {
    durationMs: number;
  };
}

export interface ReportError {
  code: string;
  message: string;
  suggestion?: string;
  file?: string;
  line?: number;
  objectId?: string;
}

export type OutputFormat = 'table' | 'json' | 'csv';

export interface CLIArguments {
  _: (string | number)[];
  files?: string[];
  from?: string;
  tag?: string[];
  due?: string;
  export?: string;
  format?: OutputFormat;
  project?: string;
  status?: 'pending' | 'done' | 'all';
  output?: string;
  report?: string;
  concurrency?: number;
  retries?: number;
  verbose?: boolean;
  quiet?: boolean;
  preview?: boolean;
  sync?: boolean;
  $0?: string;
}

export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENTS: 2,
  PARSE_ERROR: 3,
  NO_INPUT_FILES: 4,
  EXPORT_FAILED: 5,
  SYNC_FAILED: 6,
} as const;

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes];
