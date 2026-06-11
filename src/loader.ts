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
  type: 'file_not_found' | 'parse_error' | 'validation_error' | 'unsupported_format' | 'unresolved_placeholder';
  message: string;
  path?: string;
  suggestion?: string;
  details?: unknown;
  fieldPath?: string;
  placeholder?: string;
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

export interface InterpolateResult {
  success: boolean;
  data?: Collection;
  errors?: LoadError[];
}

const PLACEHOLDER_REGEX = /\$\{([^}]+)\}/g;

function interpolate(str: string, vars: Record<string, string | number | boolean>): string {
  return str.replace(PLACEHOLDER_REGEX, (match, key) => {
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

interface UnresolvedPlaceholder {
  fieldPath: string;
  placeholder: string;
  isAuthField: boolean;
}

function findUnresolvedPlaceholders(
  obj: unknown,
  basePath: string,
  authFieldPaths: Set<string>
): UnresolvedPlaceholder[] {
  const results: UnresolvedPlaceholder[] = [];

  if (typeof obj === 'string') {
    const matches = obj.match(PLACEHOLDER_REGEX);
    if (matches) {
      for (const m of matches) {
        const placeholder = m.slice(2, -1).trim();
        results.push({
          fieldPath: basePath,
          placeholder,
          isAuthField: authFieldPaths.has(basePath),
        });
      }
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      results.push(...findUnresolvedPlaceholders(obj[i], `${basePath}[${i}]`, authFieldPaths));
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = basePath ? `${basePath}.${key}` : key;
      results.push(...findUnresolvedPlaceholders(value, childPath, authFieldPaths));
    }
  }

  return results;
}

const AUTH_SENSITIVE_FIELDS = new Set([
  'token',
  'username',
  'password',
  'accessToken',
  'value',
]);

function collectAuthFieldPaths(prefix: string): Set<string> {
  const paths = new Set<string>();
  for (const field of AUTH_SENSITIVE_FIELDS) {
    paths.add(`${prefix}.${field}`);
  }
  return paths;
}

function buildVariableSource(
  env?: ParsedEnvironment,
  extraVars?: Record<string, string>
): Record<string, string | number | boolean> {
  const processEnv: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) {
      processEnv[k] = v;
    }
  }

  const allVars: Record<string, string | number | boolean> = {
    ...processEnv,
    ...env?.variables,
    ...extraVars,
  };

  if (!allVars['TIMESTAMP']) {
    allVars['TIMESTAMP'] = String(Date.now());
  }
  if (!allVars['DATE']) {
    allVars['DATE'] = new Date().toISOString().slice(0, 10);
  }
  if (!allVars['RANDOM']) {
    allVars['RANDOM'] = String(Math.floor(Math.random() * 1_000_000));
  }

  return allVars;
}

function buildSuggestion(placeholder: string, fieldPath: string): string {
  const parts = [
    `变量 \${${placeholder}} 未解析，请按以下任一方式设置：`,
    `  1. 在进程环境变量中导出: export ${placeholder}="your-value"`,
  ];
  if (fieldPath.startsWith('auth.') || fieldPath.includes('.auth.')) {
    parts.push(`  2. 在 environment 文件的 variables 中添加: ${placeholder}: "your-secret"`);
    parts.push(`  3. 如果是 CI 环境，在流水线 secrets 中配置 ${placeholder}`);
    if (fieldPath.includes('token') || fieldPath.includes('Token')) {
      parts.push(`  4. 验证鉴权服务是否正常，token 是否仍在有效期内`);
    }
    if (fieldPath.includes('password')) {
      parts.push(`  4. 避免在配置文件中硬编码密码，使用密钥管理服务`);
    }
  } else {
    parts.push(`  2. 在 environment 文件的 variables 中添加: ${placeholder}: "your-value"`);
    parts.push(`  3. 在 collection 的 tests[].extract 中确认前序用例是否正确提取了该变量`);
  }
  return parts.join('\n');
}

export function mergeAndInterpolate(
  collection: ParsedCollection,
  env?: ParsedEnvironment,
  extraVars?: Record<string, string>
): InterpolateResult {
  const allVars = buildVariableSource(env, extraVars);

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

    const testAuth = test.auth || mergedAuth;
    const interpolatedTest = interpolateObject(test, allVars) as Record<string, unknown>;

    return {
      ...interpolatedTest,
      id: interpolatedTest.id as string,
      name: interpolatedTest.name as string,
      description: interpolatedTest.description,
      method: interpolatedTest.method,
      url: interpolate(fullUrl, allVars),
      headers: interpolateObject({ ...mergedHeaders, ...(test.headers || {}) }, allVars),
      queryParams: interpolateObject(test.queryParams || {}, allVars),
      body: interpolateObject(test.body, allVars),
      auth: interpolateObject(testAuth, allVars),
      timeoutMs: test.timeoutMs || mergedTimeoutMs,
      retry: {
        ...mergedRetry,
        ...test.retry,
      },
      tags: interpolatedTest.tags as string[] | undefined || [],
      dependsOn: (interpolatedTest.dependsOn as string[] | undefined) || [],
      assertions: test.assertions.map((a) => interpolateObject(a, allVars)),
    };
  });

  const merged: Collection = {
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

  const runtimeVars = new Set<string>();
  for (const test of collection.tests) {
    if (test.extract) {
      for (const varName of Object.keys(test.extract)) {
        runtimeVars.add(varName);
      }
    }
  }

  const authFieldPaths = new Set<string>();
  for (const p of collectAuthFieldPaths('auth')) authFieldPaths.add(p);
  for (let i = 0; i < merged.tests.length; i++) {
    for (const p of collectAuthFieldPaths(`tests[${i}].auth`)) authFieldPaths.add(p);
  }

  const allUnresolved = findUnresolvedPlaceholders(merged, '', authFieldPaths);
  const unresolved = allUnresolved.filter((u) => !runtimeVars.has(u.placeholder));

  const runtimeOnly = allUnresolved.filter((u) => runtimeVars.has(u.placeholder));
  const runtimeAuth = runtimeOnly.filter((u) => u.isAuthField);
  if (runtimeAuth.length > 0) {
    unresolved.unshift({
      fieldPath: runtimeAuth[0].fieldPath,
      placeholder: runtimeAuth[0].placeholder,
      isAuthField: true,
    });
  }

  if (unresolved.length > 0) {
    const errors: LoadError[] = unresolved.map((u) => {
      const isRuntime = runtimeVars.has(u.placeholder);
      const msg = isRuntime
        ? `鉴权字段 "${u.fieldPath}" 依赖运行时提取变量 \${${u.placeholder}}，加载阶段无法验证`
        : u.isAuthField
          ? `鉴权字段 "${u.fieldPath}" 中的变量 \${${u.placeholder}} 未能解析，值仍包含未替换占位符`
          : `字段 "${u.fieldPath}" 中的变量 \${${u.placeholder}} 未能解析`;
      return {
        type: 'unresolved_placeholder',
        message: msg,
        fieldPath: u.fieldPath,
        placeholder: u.placeholder,
        suggestion: isRuntime
          ? `运行时提取变量 \${${u.placeholder}} 在加载阶段不可用，但该字段属于鉴权字段。建议将鉴权凭据放入 env.variables、process.env 或 CI secrets，避免依赖前序用例提取`
          : buildSuggestion(u.placeholder, u.fieldPath),
      };
    });

    const authUnresolved = unresolved.filter((u) => u.isAuthField && !runtimeVars.has(u.placeholder));
    if (authUnresolved.length > 0) {
      errors.unshift({
        type: 'unresolved_placeholder',
        message: `检测到 ${authUnresolved.length} 个鉴权相关字段存在未解析的占位符，可能导致接口鉴权失败`,
        suggestion: `请优先处理鉴权字段的变量问题，涉及字段: ${authUnresolved.map((u) => u.fieldPath).join(', ')}`,
      });
    }

    return { success: false, errors };
  }

  return { success: true, data: merged };
}
