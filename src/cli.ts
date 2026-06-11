import { writeFile, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { glob } from 'glob';
import pLimit from 'p-limit';
import { parseFiles } from './parser.js';
import { deduplicateTodos, filterTodos, sortTodos, generateSyncPreview } from './task.js';
import {
  renderTodoTable,
  renderSyncPreview,
  renderStats,
  formatJson,
  formatCsv,
  renderMachineReport,
} from './output.js';
import { createMachineReport, Note2TaskError, formatErrorForUser, VERSION } from './errors.js';
import { ExitCodes, type CLIArguments, type MachineReport, type ReportError, type TodoItem } from './types.js';
import { withRetry, isRetriableError } from './retry.js';
import { parseArgs } from './cli-args.js';

const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RETRIES = 3;

async function resolveInputPaths(inputs: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const input of inputs) {
    if (input.includes('*') || input.includes('?') || input.includes('[')) {
      const matches = await glob(input, { nodir: true });
      files.push(...matches);
    } else {
      files.push(input);
    }
  }

  return [...new Set(files)];
}

function getInputFiles(args: CLIArguments): string[] {
  if (args.files && args.files.length > 0) {
    return args.files;
  }

  const all = args._
    .filter((a): a is string => typeof a === 'string')
    .filter((a) => !a.startsWith('-'));

  if (all.length === 0) return [];

  const first = all[0];
  if (['parse', 'preview', 'sync-preview', 'report'].includes(first)) {
    return all.slice(1);
  }

  return all;
}

async function exportToFile(content: string, outputPath: string): Promise<void> {
  try {
    await writeFile(outputPath, content, 'utf-8');
  } catch (error) {
    throw new Note2TaskError(
      `导出文件失败: ${outputPath}`,
      'EXPORT_FAILED',
      ExitCodes.EXPORT_FAILED,
      {
        file: outputPath,
        suggestion: '检查输出路径是否有写入权限，或目录是否存在',
      }
    );
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function runParseCommand(args: CLIArguments): Promise<{
  exitCode: number;
  report: MachineReport;
  output: string;
}> {
  const startTime = Date.now();
  const errors: ReportError[] = [];

  const inputs = getInputFiles(args);
  if (inputs.length === 0) {
    const report = createMachineReport({
      command: 'parse',
      exitCode: ExitCodes.NO_INPUT_FILES,
      success: false,
      errors: [
        {
          code: 'NO_INPUT_FILES',
          message: '没有指定输入文件',
          suggestion: '请指定一个或多个 Markdown 文件路径，支持 glob 模式',
        },
      ],
      startTimestamp: startTime,
    });
    return {
      exitCode: ExitCodes.NO_INPUT_FILES,
      report,
      output: renderMachineReport(report),
    };
  }

  const filePaths = await resolveInputPaths(inputs);
  if (filePaths.length === 0) {
    const report = createMachineReport({
      command: 'parse',
      exitCode: ExitCodes.NO_INPUT_FILES,
      success: false,
      errors: [
        {
          code: 'NO_MATCHING_FILES',
          message: '没有找到匹配的文件',
          suggestion: '检查 glob 模式或文件路径是否正确',
        },
      ],
      startTimestamp: startTime,
    });
    return {
      exitCode: ExitCodes.NO_INPUT_FILES,
      report,
      output: renderMachineReport(report),
    };
  }

  const concurrency = args.concurrency ?? DEFAULT_CONCURRENCY;
  const retries = args.retries ?? DEFAULT_RETRIES;

  const limit = pLimit(concurrency);

  const parsePromises = filePaths.map((filePath) =>
    limit(() =>
      withRetry(
        () => parseFileSafe(filePath),
        {
          retries,
          delayMs: 100,
          backoff: 'exponential',
          shouldRetry: isRetriableError,
        }
      ).then(
        (retryResult) => retryResult.result
      ).catch((error) => ({
        todos: [],
        errors: [
          {
            file: filePath,
            message: error instanceof Error ? error.message : '未知错误',
            code: error instanceof Note2TaskError ? error.code : 'PARSE_FAILED',
            suggestion: error instanceof Note2TaskError ? error.suggestion : undefined,
          },
        ],
        stats: { filesProcessed: 0, todosFound: 0, todosDone: 0, todosPending: 0 },
      }))
    )
  );

  const results = await Promise.all(parsePromises);

  let allTodos: TodoItem[] = [];
  let totalFilesProcessed = 0;

  for (const result of results) {
    allTodos = allTodos.concat(result.todos);
    errors.push(...result.errors.map((e) => ({
      code: e.code,
      message: e.message,
      suggestion: 'suggestion' in e ? e.suggestion : undefined,
      file: e.file,
      line: 'line' in e ? e.line : undefined,
    })));
    totalFilesProcessed += result.stats.filesProcessed;
  }

  const { todos: uniqueTodos, duplicates } = deduplicateTodos(allTodos);

  const filteredTodos = filterTodos(uniqueTodos, {
    from: args.from,
    tag: args.tag,
    due: args.due,
    project: args.project,
    status: args.status,
  });

  const sortedTodos = sortTodos(filteredTodos, 'dueDate');

  let output = '';
  const format = args.format ?? 'table';

  if (format === 'json') {
    output = formatJson(sortedTodos, true);
  } else if (format === 'csv') {
    output = formatCsv(sortedTodos);
  } else {
    output += renderTodoTable(sortedTodos, '任务列表');
    output += renderStats({
      filesProcessed: totalFilesProcessed,
      todosFound: sortedTodos.length,
      todosDone: sortedTodos.filter((t) => t.status === 'done').length,
      todosPending: sortedTodos.filter((t) => t.status === 'pending').length,
    });
    if (duplicates.length > 0) {
      output += `\nℹ️  去重了 ${duplicates.length} 条重复任务\n`;
    }
  }

  if (args.export) {
    let exportContent = output;
    if (format === 'table') {
      exportContent = formatJson(sortedTodos, true);
    }
    await exportToFile(exportContent, args.export);
    if (format === 'table') {
      output += `\n✅ 已导出 ${sortedTodos.length} 条任务到 ${args.export}\n`;
    }
  }

  const hasErrors = errors.some((e) => e.code !== 'NO_MATCHING_FILES');
  const exitCode = hasErrors ? ExitCodes.PARSE_ERROR : ExitCodes.SUCCESS;

  const report = createMachineReport({
    command: 'parse',
    exitCode,
    success: !hasErrors,
    errors,
    data: { todos: sortedTodos },
    summary: {
      total: filePaths.length,
      processed: totalFilesProcessed,
      errors: errors.length,
      warnings: duplicates.length,
    },
    startTimestamp: startTime,
  });

  return { exitCode, report, output };
}

async function parseFileSafe(filePath: string) {
  const result = await parseFiles([filePath]);
  return result;
}

async function runPreviewCommand(args: CLIArguments): Promise<{
  exitCode: number;
  report: MachineReport;
  output: string;
}> {
  const startTime = Date.now();
  const errors: ReportError[] = [];

  const sources = getInputFiles(args);
  if (sources.length === 0) {
    const report = createMachineReport({
      command: 'preview',
      exitCode: ExitCodes.NO_INPUT_FILES,
      success: false,
      errors: [
        {
          code: 'NO_INPUT_FILES',
          message: '没有指定源文件',
          suggestion: '请指定源 Markdown 文件路径',
        },
      ],
      startTimestamp: startTime,
    });
    return {
      exitCode: ExitCodes.NO_INPUT_FILES,
      report,
      output: renderMachineReport(report),
    };
  }

  const sourcePaths = await resolveInputPaths(sources);
  const sourceResult = await parseFiles(sourcePaths);
  errors.push(...sourceResult.errors.map((e) => ({
    code: e.code,
    message: e.message,
    suggestion: e.suggestion,
    file: e.file,
    line: e.line,
  })));

  const { todos: sourceTodos } = deduplicateTodos(sourceResult.todos);

  let existingTodos: TodoItem[] = [];
  if (args.export) {
    try {
      if (await fileExists(args.export)) {
        const content = await readFile(args.export, 'utf-8');
        existingTodos = JSON.parse(content) as TodoItem[];
      }
    } catch (error) {
      errors.push({
        code: 'EXISTING_READ_ERROR',
        message: `读取现有任务文件失败: ${args.export}`,
        suggestion: '检查文件格式是否为有效的 JSON',
        file: args.export,
      });
    }
  }

  const preview = generateSyncPreview(sourceTodos, existingTodos);

  let output = '';
  const format = args.format ?? 'table';

  if (format === 'json') {
    output = formatJson(preview, true);
  } else {
    output += renderSyncPreview(preview);
  }

  const report = createMachineReport({
    command: 'preview',
    exitCode: errors.length > 0 ? ExitCodes.SYNC_FAILED : ExitCodes.SUCCESS,
    success: errors.length === 0,
    errors,
    data: { syncPreview: preview },
    summary: {
      total: sourceTodos.length,
      processed: sourceTodos.length,
      errors: errors.length,
      warnings: 0,
    },
    startTimestamp: startTime,
  });

  return {
    exitCode: errors.length > 0 ? ExitCodes.SYNC_FAILED : ExitCodes.SUCCESS,
    report,
    output,
  };
}

async function runReportCommand(args: CLIArguments): Promise<{
  exitCode: number;
  report: MachineReport;
  output: string;
}> {
  const parseResult = await runParseCommand(args);
  const report = parseResult.report;

  if (args.report) {
    await exportToFile(formatJson(report, true), args.report);
  }

  return {
    exitCode: parseResult.exitCode,
    report,
    output: renderMachineReport(report),
  };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv) as CLIArguments;

  try {
    let result: {
      exitCode: number;
      report: MachineReport;
      output: string;
    };

    const command = (args as any)._?.[0] || 'parse';

    switch (command) {
      case 'parse':
        result = await runParseCommand(args);
        break;
      case 'preview':
      case 'sync-preview':
        result = await runPreviewCommand(args);
        break;
      case 'report':
        result = await runReportCommand(args);
        break;
      default:
        result = await runParseCommand(args);
    }

    if (args.report) {
      await exportToFile(formatJson(result.report, true), args.report);
    }

    if (args.quiet) {
      if (result.exitCode !== 0 && args.format === 'json') {
        console.log(formatJson(result.report));
      }
    } else {
      console.log(result.output);
    }

    return result.exitCode;
  } catch (error) {
    const report = createMachineReport({
      command: (args as any)._?.[0] || 'parse',
      exitCode: ExitCodes.GENERAL_ERROR,
      success: false,
      errors: [
        {
          code: error instanceof Note2TaskError ? error.code : 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : '未知错误',
          suggestion:
            error instanceof Note2TaskError
              ? error.suggestion
              : '请检查输入参数是否正确，或使用 --help 查看帮助',
        },
      ],
      startTimestamp: Date.now(),
    });

    if (args.format === 'json' || args.report) {
      console.log(formatJson(report));
    } else {
      console.error(formatErrorForUser(error as Error));
    }

    if (args.report) {
      try {
        await exportToFile(formatJson(report, true), args.report);
      } catch {
        // ignore
      }
    }

    return ExitCodes.GENERAL_ERROR;
  }
}

export { VERSION };
