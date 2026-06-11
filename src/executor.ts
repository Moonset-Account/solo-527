import pLimit from 'p-limit';
import {
  Collection,
  TestCase,
  TestResult,
  AttemptResult,
  RunReport,
  RunSummary,
  TestStatus,
  RetryConfig,
  AuthConfig,
  CliArgs,
  EXIT_CODES,
} from './types';
import { runAssertions, AssertionContext } from './assertions';
import { JSONPath } from 'jsonpath-plus';

interface ExecutionOptions {
  parallel: number;
  defaultMaxAttempts: number;
  failFast: boolean;
  delayMs?: number;
  tags?: string[];
  filter?: string;
}

function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'bearer': {
      const headerName = auth.headerName || 'Authorization';
      return { [headerName]: `Bearer ${auth.token}` };
    }
    case 'basic': {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      return { Authorization: `Basic ${credentials}` };
    }
    case 'apiKey': {
      if (auth.in === 'header') {
        return { [auth.key]: auth.value };
      }
      return {};
    }
    case 'oauth2': {
      const headerName = auth.headerName || 'Authorization';
      const tokenType = auth.tokenType || 'Bearer';
      return { [headerName]: `${tokenType} ${auth.accessToken}` };
    }
    case 'none':
    default:
      return {};
  }
}

function appendQueryParams(url: string, params?: Record<string, string | number | boolean>, apiKeyAuth?: Extract<AuthConfig, { type: 'apiKey' }>): string {
  const queryParts: string[] = [];
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  if (apiKeyAuth && apiKeyAuth.in === 'query') {
    queryParts.push(`${encodeURIComponent(apiKeyAuth.key)}=${encodeURIComponent(apiKeyAuth.value)}`);
  }
  if (queryParts.length === 0) return url;
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + queryParts.join('&');
}

function extractVariables(body: unknown, extractConfig?: Record<string, string>): Record<string, string> {
  if (!extractConfig || typeof body !== 'object' || body === null) return {};
  const extracted: Record<string, string> = {};
  for (const [varName, jsonPath] of Object.entries(extractConfig)) {
    try {
      const results = JSONPath({ path: jsonPath, json: body });
      if (results.length > 0) {
        extracted[varName] = typeof results[0] === 'string' ? results[0] : JSON.stringify(results[0]);
      }
    } catch {
      // 提取失败不影响测试结果
    }
  }
  return extracted;
}

interface RequestResult {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  bodyText: string;
  responseTimeMs: number;
  error?: {
    type: string;
    message: string;
    suggestion?: string;
  };
}

async function sendRequest(
  testCase: TestCase,
  timeoutMs: number
): Promise<RequestResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeaders = buildAuthHeaders(testCase.auth || { type: 'none' });
    const apiKeyAuth = testCase.auth?.type === 'apiKey' ? testCase.auth : undefined;

    const finalUrl = appendQueryParams(testCase.url, testCase.queryParams, apiKeyAuth);

    const headers: Record<string, string> = {
      ...testCase.headers,
      ...authHeaders,
    };

    let body: BodyInit | undefined;
    if (testCase.body !== undefined) {
      if (typeof testCase.body === 'string') {
        body = testCase.body;
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'text/plain';
        }
      } else {
        body = JSON.stringify(testCase.body);
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(finalUrl, {
      method: testCase.method,
      headers,
      body: testCase.method === 'GET' || testCase.method === 'HEAD' ? undefined : body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTimeMs = Date.now() - startTime;
    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      respHeaders[key] = value;
    });

    const bodyText = await response.text();
    let parsedBody: unknown = bodyText;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        parsedBody = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        // JSON 解析失败，使用原始文本
      }
    }

    return {
      statusCode: response.status,
      headers: respHeaders,
      body: parsedBody,
      bodyText,
      responseTimeMs,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (e instanceof Error) {
      if (e.name === 'AbortError' || e.message.includes('timeout') || e.message.includes('timed out')) {
        return {
          statusCode: 0,
          headers: {},
          body: null,
          bodyText: '',
          responseTimeMs,
          error: {
            type: 'TIMEOUT',
            message: `请求超时 (${timeoutMs}ms)`,
            suggestion: '可通过 --timeout 参数增加超时时间，或检查服务是否正常运行',
          },
        };
      }
      if (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND') || e.message.includes('EAI_AGAIN')) {
        return {
          statusCode: 0,
          headers: {},
          body: null,
          bodyText: '',
          responseTimeMs,
          error: {
            type: 'CONNECTION_ERROR',
            message: `连接失败: ${e.message}`,
            suggestion: '请检查 URL 是否正确、服务是否启动、网络连接是否正常',
          },
        };
      }
      return {
        statusCode: 0,
        headers: {},
        body: null,
        bodyText: '',
        responseTimeMs,
        error: {
          type: 'NETWORK_ERROR',
          message: `网络错误: ${e.message}`,
          suggestion: '请检查网络连接和目标服务状态',
        },
      };
    }

    return {
      statusCode: 0,
      headers: {},
      body: null,
      bodyText: '',
      responseTimeMs,
      error: {
        type: 'UNKNOWN_ERROR',
        message: `未知错误: ${String(e)}`,
        suggestion: '请查看完整日志排查问题',
      },
    };
  }
}

function shouldRetry(
  requestResult: RequestResult,
  attempt: number,
  maxAttempts: number,
  retryConfig: RetryConfig
): boolean {
  if (attempt >= maxAttempts) return false;
  if (requestResult.error) return true;
  if (retryConfig.retryOnStatus && retryConfig.retryOnStatus.includes(requestResult.statusCode)) {
    return true;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSingleTest(
  testCase: TestCase,
  options: ExecutionOptions
): Promise<TestResult> {
  if (testCase.skip) {
    return {
      id: testCase.id,
      name: testCase.name,
      status: 'skipped',
      tags: testCase.tags,
      totalAttempts: 0,
      responseTimeMs: 0,
      assertionResults: [],
      failedAssertions: [],
      attempts: [],
    };
  }

  const retryConfig: RetryConfig = {
    maxAttempts: testCase.retry?.maxAttempts ?? options.defaultMaxAttempts,
    delayMs: testCase.retry?.delayMs ?? 1000,
    backoffMultiplier: testCase.retry?.backoffMultiplier ?? 2,
    retryOnStatus: testCase.retry?.retryOnStatus ?? [429, 500, 502, 503, 504],
  };

  const timeoutMs = testCase.timeoutMs ?? 30000;

  const attempts: AttemptResult[] = [];
  let lastResult: RequestResult | null = null;
  let lastAssertionResults: ReturnType<typeof runAssertions> = [];

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    const requestResult = await sendRequest(testCase, timeoutMs);
    lastResult = requestResult;

    let assertionResults: ReturnType<typeof runAssertions> = [];
    if (!requestResult.error) {
      const ctx: AssertionContext = {
        statusCode: requestResult.statusCode,
        headers: requestResult.headers,
        body: requestResult.body,
        bodyText: requestResult.bodyText,
        responseTimeMs: requestResult.responseTimeMs,
      };
      assertionResults = runAssertions(testCase.assertions, ctx);
    }
    lastAssertionResults = assertionResults;

    const attemptResult: AttemptResult = {
      attempt,
      statusCode: requestResult.statusCode,
      responseTimeMs: requestResult.responseTimeMs,
      error: requestResult.error?.message,
      assertionResults,
    };
    attempts.push(attemptResult);

    const allPassed = !requestResult.error && assertionResults.every((a) => a.passed);
    if (allPassed) {
      const extractedVars = extractVariables(requestResult.body, testCase.extract);
      return {
        id: testCase.id,
        name: testCase.name,
        status: 'passed',
        tags: testCase.tags,
        totalAttempts: attempt,
        responseTimeMs: requestResult.responseTimeMs,
        statusCode: requestResult.statusCode,
        assertionResults,
        failedAssertions: [],
        attempts,
        extractedVars,
      };
    }

    if (shouldRetry(requestResult, attempt, retryConfig.maxAttempts, retryConfig)) {
      const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
      await sleep(delay);
      continue;
    }
    break;
  }

  const failedAssertions = lastAssertionResults.filter((a) => !a.passed);
  const status: TestStatus = lastResult?.error ? 'error' : 'failed';
  const extractedVars = lastResult ? extractVariables(lastResult.body, testCase.extract) : {};

  return {
    id: testCase.id,
    name: testCase.name,
    status,
    tags: testCase.tags,
    totalAttempts: attempts.length,
    responseTimeMs: lastResult?.responseTimeMs ?? 0,
    statusCode: lastResult?.statusCode,
    error: lastResult?.error,
    assertionResults: lastAssertionResults,
    failedAssertions,
    attempts,
    extractedVars,
  };
}

function filterTests(collection: Collection, options: ExecutionOptions): TestCase[] {
  let tests = collection.tests;

  if (options.tags && options.tags.length > 0) {
    tests = tests.filter((t) => t.tags?.some((tag) => options.tags!.includes(tag)));
  }

  if (options.filter) {
    try {
      const regex = new RegExp(options.filter, 'i');
      tests = tests.filter((t) => regex.test(t.name) || regex.test(t.id));
    } catch {
      // 如果正则不合法，退化为包含匹配
      tests = tests.filter(
        (t) =>
          t.name.toLowerCase().includes(options.filter!.toLowerCase()) ||
          t.id.toLowerCase().includes(options.filter!.toLowerCase())
      );
    }
  }

  return tests;
}

export async function runCollection(
  collection: Collection,
  args: CliArgs,
  cliVersion: string
): Promise<RunReport> {
  const options: ExecutionOptions = {
    parallel: Math.max(1, Math.min(args.parallel, 100)),
    defaultMaxAttempts: Math.max(1, Math.min(args.retry, 10)),
    failFast: args.failFast,
    delayMs: args.delay,
    tags: args.tags,
    filter: args.filter,
  };

  const testsToRun = filterTests(collection, options);

  const results: TestResult[] = [];
  const startedAt = new Date().toISOString();

  if (options.delayMs && options.delayMs > 0) {
    for (const testCase of testsToRun) {
      const result = await runSingleTest(testCase, options);
      results.push(result);
      if (options.failFast && (result.status === 'failed' || result.status === 'error')) {
        break;
      }
      await sleep(options.delayMs);
    }
  } else {
    const limit = pLimit(options.parallel);
    const seenDependencies = new Set<string>();
    const completedWithError = { value: false };

    const runTestWithDeps = async (testCase: TestCase): Promise<void> => {
      if (completedWithError.value && options.failFast) return;

      if (testCase.dependsOn && testCase.dependsOn.length > 0) {
        await Promise.all(
          testCase.dependsOn.map(async (depId) => {
            while (!seenDependencies.has(depId)) {
              await sleep(50);
              if (completedWithError.value && options.failFast) return;
            }
          })
        );
        if (completedWithError.value && options.failFast) return;
      }

      const result = await runSingleTest(testCase, options);
      results.push(result);
      seenDependencies.add(testCase.id);

      if (options.failFast && (result.status === 'failed' || result.status === 'error')) {
        completedWithError.value = true;
      }
    };

    const promises = testsToRun.map((tc) => limit(() => runTestWithDeps(tc)));
    await Promise.all(promises);

    results.sort((a, b) => {
      const aIdx = testsToRun.findIndex((t) => t.id === a.id);
      const bIdx = testsToRun.findIndex((t) => t.id === b.id);
      return aIdx - bIdx;
    });
  }

  const finishedAt = new Date().toISOString();

  const summary: RunSummary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    totalTimeMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    startedAt,
    finishedAt,
  };

  return {
    collectionName: collection.name,
    collectionVersion: collection.version,
    environment: collection.baseUrl,
    summary,
    results,
    cliVersion,
    config: {
      parallel: options.parallel,
      retryMaxAttempts: options.defaultMaxAttempts,
      timeoutMs: args.timeout ?? 30000,
    },
  };
}

export function determineExitCode(report: RunReport): number {
  if (report.summary.failed > 0 || report.summary.errors > 0) {
    return EXIT_CODES.TEST_FAILURE;
  }
  if (report.summary.total === 0) {
    return EXIT_CODES.TEST_FAILURE;
  }
  return EXIT_CODES.SUCCESS;
}

export function buildDryRunReport(
  collection: Collection,
  args: CliArgs,
  cliVersion: string
): RunReport {
  const testsToRun = filterTests(collection, {
    parallel: args.parallel,
    defaultMaxAttempts: args.retry,
    failFast: args.failFast,
    tags: args.tags,
    filter: args.filter,
  });

  const now = new Date().toISOString();
  const results: TestResult[] = testsToRun.map((tc) => ({
    id: tc.id,
    name: tc.name,
    status: 'skipped',
    tags: tc.tags,
    totalAttempts: 0,
    responseTimeMs: 0,
    assertionResults: [],
    failedAssertions: [],
    attempts: [],
  }));

  return {
    collectionName: collection.name,
    collectionVersion: collection.version,
    environment: collection.baseUrl,
    summary: {
      total: results.length,
      passed: 0,
      failed: 0,
      skipped: results.length,
      errors: 0,
      totalTimeMs: 0,
      startedAt: now,
      finishedAt: now,
    },
    results,
    cliVersion,
    config: {
      parallel: Math.max(1, Math.min(args.parallel, 100)),
      retryMaxAttempts: Math.max(1, Math.min(args.retry, 10)),
      timeoutMs: args.timeout ?? 30000,
    },
  };
}
