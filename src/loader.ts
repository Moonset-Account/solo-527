import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { parse as parseYaml } from 'yaml';
import { ZodError } from 'zod';
import { CollectionSchema, EnvironmentSchema, ParsedCollection, ParsedEnvironment } from './schemas';
import { Collection } from './types';

export interface LoadResult<T> {
  success: boolean;
  data?: T;
  errors?: LoadError[];
}

export interface LoadError {
  type: 'file_not_found' | 'parse_error' | 'validation_error' | 'unsupported_format';
  message: string;
  path?: string;
  suggestion?: string;
  details?: unknown;
}

function readFile(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function detectFormat(filePath: string): 'json' | 'yaml' | null {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  return null;
}

function parseContent(content: string, format: 'json' | 'yaml', filePath: string): LoadResult<unknown> {
  try {
    const data = format === 'json' ? JSON.parse(content) : parseYaml(content);
    return { success: true, data };
  } catch (e) {
    const errors: LoadError[] = [];
    if (e instanceof SyntaxError || e instanceof Error) {
      errors.push({
        type: 'parse_error',
        message: `解析 ${format.toUpperCase()} 文件失败: ${e.message}`,
        path: filePath,
        suggestion: format === 'json'
          ? '请检查 JSON 语法是否正确，确保引号、逗号、括号匹配'
          : '请检查 YAML 缩进和语法是否正确',
      });
    }
    return { success: false, errors };
  }
}

function formatZodErrors(zodError: ZodError, filePath: string): LoadError[] {
  return zodError.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    let suggestion: string | undefined;

    if (issue.code === 'invalid_type') {
      suggestion = `期望类型: ${issue.expected}, 实际类型: ${issue.received}`;
    } else if (issue.code === 'too_small') {
      suggestion = `值太小，最小为 ${issue.minimum}`;
    } else if (issue.code === 'too_big') {
      suggestion = `值太大，最大为 ${issue.maximum}`;
    } else if (issue.code === 'custom') {
      suggestion = issue.message;
    }

    return {
      type: 'validation_error',
      message: `${path}: ${issue.message}`,
      path: filePath,
      suggestion,
      details: issue,
    };
  });
}

export function loadCollection(filePath: string): LoadResult<ParsedCollection> {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    return {
      success: false,
      errors: [{
        type: 'file_not_found',
        message: `Collection 文件不存在: ${absolutePath}`,
        path: absolutePath,
        suggestion: '请检查 --collection 参数路径是否正确，文件是否已创建',
      }],
    };
  }

  const format = detectFormat(absolutePath);
  if (!format) {
    return {
      success: false,
      errors: [{
        type: 'unsupported_format',
        message: `不支持的文件格式: ${extname(absolutePath)}`,
        path: absolutePath,
        suggestion: '请使用 .json 或 .yaml/.yml 格式的 collection 文件',
      }],
    };
  }

  const content = readFile(absolutePath);
  if (content === null) {
    return {
      success: false,
      errors: [{
        type: 'file_not_found',
        message: `无法读取 collection 文件: ${absolutePath}`,
        path: absolutePath,
        suggestion: '请检查文件权限和磁盘状态',
      }],
    };
  }

  const parseResult = parseContent(content, format, absolutePath);
  if (!parseResult.success || parseResult.data === undefined) {
    return { success: false, errors: parseResult.errors };
  }

  const validateResult = CollectionSchema.safeParse(parseResult.data);
  if (!validateResult.success) {
    return {
      success: false,
      errors: formatZodErrors(validateResult.error, absolutePath),
    };
  }

  return { success: true, data: validateResult.data as ParsedCollection };
}

export function loadEnvironment(filePath?: string): LoadResult<ParsedEnvironment | undefined> {
  if (!filePath) {
    return { success: true, data: undefined };
  }

  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    return {
      success: false,
      errors: [{
        type: 'file_not_found',
        message: `Environment 文件不存在: ${absolutePath}`,
        path: absolutePath,
        suggestion: '请检查 --env 参数路径是否正确，或移除 --env 参数不使用环境变量',
      }],
    };
  }

  const format = detectFormat(absolutePath);
  if (!format) {
    return {
      success: false,
      errors: [{
        type: 'unsupported_format',
        message: `不支持的文件格式: ${extname(absolutePath)}`,
        path: absolutePath,
        suggestion: '请使用 .json 或 .yaml/.yml 格式的 environment 文件',
      }],
    };
  }

  const content = readFile(absolutePath);
  if (content === null) {
    return {
      success: false,
      errors: [{
        type: 'file_not_found',
        message: `无法读取 environment 文件: ${absolutePath}`,
        path: absolutePath,
        suggestion: '请检查文件权限和磁盘状态',
      }],
    };
  }

  const parseResult = parseContent(content, format, absolutePath);
  if (!parseResult.success || parseResult.data === undefined) {
    return { success: false, errors: parseResult.errors };
  }

  const validateResult = EnvironmentSchema.safeParse(parseResult.data);
  if (!validateResult.success) {
    return {
      success: false,
      errors: formatZodErrors(validateResult.error, absolutePath),
    };
  }

  return { success: true, data: validateResult.data as ParsedEnvironment };
}

function interpolate(str: string, vars: Record<string, string | number | boolean>): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const k = key.trim();
    if (k in vars) {
      return String(vars[k]);
    }
    return match;
  });
}

function interpolateObject<T>(obj: T, vars: Record<string, string | number | boolean>): T {
  if (typeof obj === 'string') {
    return interpolate(obj, vars) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, vars)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[interpolate(key, vars)] = interpolateObject(value, vars);
    }
    return result as unknown as T;
  }
  return obj;
}

export function mergeAndInterpolate(
  collection: ParsedCollection,
  env?: ParsedEnvironment,
  extraVars?: Record<string, string>
): Collection {
  const allVars: Record<string, string | number | boolean> = {
    ...env?.variables,
    ...extraVars,
  };

  const baseUrl = env?.baseUrl || collection.baseUrl || '';

  const mergedAuth = env?.auth || collection.auth || { type: 'none' as const };
  const mergedHeaders = { ...collection.headers, ...env?.headers };
  const mergedTimeoutMs = env?.timeoutMs || collection.timeoutMs || 30000;
  const mergedRetry = {
    maxAttempts: env?.retry?.maxAttempts ?? collection.retry?.maxAttempts ?? 1,
    delayMs: env?.retry?.delayMs ?? collection.retry?.delayMs ?? 1000,
    backoffMultiplier: env?.retry?.backoffMultiplier ?? collection.retry?.backoffMultiplier ?? 2,
    retryOnStatus: env?.retry?.retryOnStatus ?? collection.retry?.retryOnStatus ?? [429, 500, 502, 503, 504],
  };

  const tests = collection.tests.map((test) => {
    let fullUrl = test.url;
    if (baseUrl && !fullUrl.match(/^https?:\/\//)) {
      fullUrl = baseUrl.replace(/\/$/, '') + '/' + fullUrl.replace(/^\//, '');
    }

    return {
      ...test,
      url: interpolate(fullUrl, allVars),
      headers: interpolateObject({ ...mergedHeaders, ...test.headers }, allVars),
      queryParams: interpolateObject(test.queryParams || {}, allVars),
      body: interpolateObject(test.body, allVars),
      auth: test.auth || mergedAuth,
      timeoutMs: test.timeoutMs || mergedTimeoutMs,
      retry: {
        ...mergedRetry,
        ...test.retry,
      },
      tags: test.tags || [],
      dependsOn: test.dependsOn || [],
      assertions: test.assertions.map((a) => interpolateObject(a, allVars)),
    };
  });

  return {
    name: interpolate(collection.name, allVars),
    version: interpolate(collection.version, allVars),
    description: collection.description ? interpolate(collection.description, allVars) : undefined,
    baseUrl: interpolate(baseUrl, allVars),
    auth: interpolateObject(mergedAuth, allVars),
    headers: interpolateObject(mergedHeaders, allVars),
    timeoutMs: mergedTimeoutMs,
    retry: mergedRetry,
    tests: tests as Collection['tests'],
  };
}
