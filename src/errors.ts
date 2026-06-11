import { ExitCodes, type ExitCode, type ReportError, type MachineReport } from './types.js';

const VERSION = '0.1.0';

export class Note2TaskError extends Error {
  code: string;
  exitCode: ExitCode;
  suggestion?: string;
  file?: string;
  line?: number;
  objectId?: string;

  constructor(
    message: string,
    code: string,
    exitCode: ExitCode = ExitCodes.GENERAL_ERROR,
    options: Partial<{
      suggestion: string;
      file: string;
      line: number;
      objectId: string;
    }> = {}
  ) {
    super(message);
    this.name = 'Note2TaskError';
    this.code = code;
    this.exitCode = exitCode;
    this.suggestion = options.suggestion;
    this.file = options.file;
    this.line = options.line;
    this.objectId = options.objectId;
  }

  toReportError(): ReportError {
    return {
      code: this.code,
      message: this.message,
      suggestion: this.suggestion,
      file: this.file,
      line: this.line,
      objectId: this.objectId,
    };
  }
}

export function createMachineReport(options: {
  command: string;
  exitCode: ExitCode;
  success: boolean;
  errors?: ReportError[];
  data?: MachineReport['data'];
  summary?: MachineReport['summary'];
  startTimestamp?: number;
}): MachineReport {
  const now = new Date().toISOString();
  const durationMs = options.startTimestamp ? Date.now() - options.startTimestamp : 0;

  const defaultSummary = {
    total: 0,
    processed: 0,
    errors: options.errors?.length ?? 0,
    warnings: 0,
  };

  return {
    version: VERSION,
    command: options.command,
    timestamp: now,
    exitCode: options.exitCode,
    success: options.success,
    summary: { ...defaultSummary, ...options.summary },
    data: options.data,
    errors: options.errors ?? [],
    performance: {
      durationMs,
    },
  };
}

export function formatErrorForUser(error: Note2TaskError | Error): string {
  if (error instanceof Note2TaskError) {
    let msg = `\n❌ 错误 [${error.code}]: ${error.message}\n`;
    if (error.file) {
      msg += `   文件: ${error.file}`;
      if (error.line !== undefined) {
        msg += ` (第 ${error.line} 行)`;
      }
      msg += '\n';
    }
    if (error.objectId) {
      msg += `   对象: ${error.objectId}\n`;
    }
    if (error.suggestion) {
      msg += `   💡 建议: ${error.suggestion}\n`;
    }
    return msg;
  }
  return `\n❌ 错误: ${error.message}\n`;
}

export { VERSION };
