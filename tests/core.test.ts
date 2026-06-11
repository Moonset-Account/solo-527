import { describe, expect, test, beforeEach } from 'vitest';
import { loadCollection, loadEnvironment, mergeAndInterpolate } from '../src/loader';
import { runAssertions } from '../src/assertions';
import { determineExitCode, buildDryRunReport } from '../src/executor';
import { writeJsonReport, writeJUnitReport } from '../src/reporter';
import type { Assertion, AssertionContext } from '../src/types';
import { CollectionSchema, EnvironmentSchema } from '../src/schemas';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Schema 校验', () => {
  test('CollectionSchema - 合法 collection 校验通过', () => {
    const result = CollectionSchema.safeParse({
      name: 'Test Collection',
      version: '1.0.0',
      tests: [{
        id: 't1',
        name: 'Test 1',
        method: 'GET',
        url: '/test',
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    });
    expect(result.success).toBe(true);
  });

  test('CollectionSchema - 重复 id 校验失败', () => {
    const result = CollectionSchema.safeParse({
      name: 'Test Collection',
      version: '1.0.0',
      tests: [
        { id: 't1', name: 'Test 1', method: 'GET', url: '/a', assertions: [{ type: 'statusCode', value: 200 }] },
        { id: 't1', name: 'Test 2', method: 'GET', url: '/b', assertions: [{ type: 'statusCode', value: 200 }] },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('CollectionSchema - 无效 HTTP 方法', () => {
    const result = CollectionSchema.safeParse({
      name: 'Test',
      version: '1.0',
      tests: [{ id: 't1', name: 'T', method: 'INVALID', url: '/', assertions: [{ type: 'statusCode', value: 200 }] }],
    });
    expect(result.success).toBe(false);
  });

  test('EnvironmentSchema - 合法 env 校验通过', () => {
    const result = EnvironmentSchema.safeParse({
      name: 'Dev',
      variables: { BASE_URL: 'http://localhost' },
    });
    expect(result.success).toBe(true);
  });
});

describe('Loader - 文件加载', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'smoke-api-test-'));
  });

  test('loadCollection - JSON 文件加载成功', () => {
    const filePath = join(tmpDir, 'coll.json');
    writeFileSync(filePath, JSON.stringify({
      name: 'Test Coll',
      version: '1.0.0',
      tests: [{ id: 't1', name: 'T1', method: 'GET', url: '/test', assertions: [{ type: 'statusCode', value: 200 }] }],
    }));
    const result = loadCollection(filePath);
    expect(result.success).toBe(true);
    expect(result.data?.tests.length).toBe(1);
  });

  test('loadCollection - YAML 文件加载成功', () => {
    const filePath = join(tmpDir, 'coll.yaml');
    writeFileSync(filePath, `
name: Test Coll YAML
version: 1.0.0
tests:
  - id: t1
    name: T1
    method: GET
    url: /test
    assertions:
      - type: statusCode
        value: 200
`);
    const result = loadCollection(filePath);
    expect(result.success).toBe(true);
    expect(result.data?.tests[0].method).toBe('GET');
  });

  test('loadCollection - 文件不存在返回错误', () => {
    const result = loadCollection(join(tmpDir, 'not-exist.json'));
    expect(result.success).toBe(false);
    expect(result.errors?.[0].type).toBe('file_not_found');
    expect(result.errors?.[0].suggestion).toBeDefined();
  });

  test('loadCollection - 无效 JSON 返回解析错误', () => {
    const filePath = join(tmpDir, 'invalid.json');
    writeFileSync(filePath, '{ invalid json }');
    const result = loadCollection(filePath);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].type).toBe('parse_error');
    expect(result.errors?.[0].suggestion).toBeDefined();
  });

  test('loadCollection - 不支持的格式', () => {
    const filePath = join(tmpDir, 'coll.txt');
    writeFileSync(filePath, 'plain text');
    const result = loadCollection(filePath);
    expect(result.success).toBe(false);
    expect(result.errors?.[0].type).toBe('unsupported_format');
  });

  test('loadEnvironment - 可选参数，未传返回 undefined', () => {
    const result = loadEnvironment();
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });
});

describe('变量插值 & 合并', () => {
  test('mergeAndInterpolate - 替换 ${VAR} 变量', () => {
    const collection: any = {
      name: '${ENV_NAME} 测试集合',
      version: '1.0.0',
      baseUrl: 'http://localhost:3000',
      tests: [{
        id: 't1',
        name: '测试 ${USER_ID}',
        method: 'GET',
        url: '/api/users/${USER_ID}',
        headers: { Authorization: 'Bearer ${TOKEN}' },
        queryParams: { include: '${INCLUDE}' },
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const env: any = {
      name: 'dev',
      variables: { ENV_NAME: '开发', USER_ID: '123', TOKEN: 'abc', INCLUDE: 'profile' },
    };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    expect(result.data!.name).toBe('开发 测试集合');
    expect(result.data!.tests[0].url).toBe('http://localhost:3000/api/users/123');
    expect(result.data!.tests[0].headers?.Authorization).toBe('Bearer abc');
    expect(result.data!.tests[0].queryParams?.include).toBe('profile');
  });

  test('mergeAndInterpolate - baseUrl 自动拼接', () => {
    const collection: any = {
      name: 'C', version: '1.0',
      baseUrl: 'https://api.example.com/',
      tests: [{ id: 't1', name: 'T', method: 'GET', url: '/users', assertions: [] }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(true);
    expect(result.data!.tests[0].url).toBe('https://api.example.com/users');
  });

  test('mergeAndInterpolate - 进程环境变量参与解析', () => {
    process.env.SMOKE_TEST_API_TOKEN = 'from-process-env';
    try {
      const collection: any = {
        name: 'P', version: '1.0',
        baseUrl: 'https://api.example.com',
        auth: { type: 'bearer', token: '${SMOKE_TEST_API_TOKEN}' },
        tests: [{ id: 't1', name: 'T', method: 'GET', url: '/x', assertions: [{ type: 'statusCode', value: 200 }] }],
      };
      const result = mergeAndInterpolate(collection);
      expect(result.success).toBe(true);
      expect((result.data!.auth as any).token).toBe('from-process-env');
    } finally {
      delete process.env.SMOKE_TEST_API_TOKEN;
    }
  });

  test('mergeAndInterpolate - env.variables 优先级高于 process.env', () => {
    process.env.SMOKE_PRIORITY_VAR = 'from-process';
    try {
      const collection: any = {
        name: 'P', version: '1.0', baseUrl: 'http://x',
        tests: [{ id: 't1', name: '${SMOKE_PRIORITY_VAR}', method: 'GET', url: '/', assertions: [] }],
      };
      const env: any = {
        name: 'e',
        variables: { SMOKE_PRIORITY_VAR: 'from-env-file' },
      };
      const result = mergeAndInterpolate(collection, env);
      expect(result.success).toBe(true);
      expect(result.data!.tests[0].name).toBe('from-env-file');
    } finally {
      delete process.env.SMOKE_PRIORITY_VAR;
    }
  });

  test('mergeAndInterpolate - 全局 auth 字段占位符解析', () => {
    const collection: any = {
      name: 'A', version: '1.0',
      baseUrl: 'http://x',
      auth: { type: 'bearer', token: '${GLOBAL_TOKEN}' },
      tests: [{ id: 't1', name: 'T', method: 'GET', url: '/', assertions: [{ type: 'statusCode', value: 200 }] }],
    };
    const env: any = { name: 'e', variables: { GLOBAL_TOKEN: 'global-secret-42' } };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    expect((result.data!.auth as any).token).toBe('global-secret-42');
  });

  test('mergeAndInterpolate - 用例级 basic auth 占位符解析', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/',
        auth: { type: 'basic', username: '${BASIC_USER}', password: '${BASIC_PASS}' },
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const env: any = { name: 'e', variables: { BASIC_USER: 'admin', BASIC_PASS: 's3cret' } };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    const auth = result.data!.tests[0].auth as any;
    expect(auth.username).toBe('admin');
    expect(auth.password).toBe('s3cret');
  });

  test('mergeAndInterpolate - apiKey auth value 占位符解析', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/',
        auth: { type: 'apiKey', key: 'X-API-Key', value: '${API_KEY_VALUE}', in: 'header' },
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const env: any = { name: 'e', variables: { API_KEY_VALUE: 'sk-live-abc123' } };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    expect((result.data!.tests[0].auth as any).value).toBe('sk-live-abc123');
  });

  test('mergeAndInterpolate - oauth2 accessToken 占位符解析', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/',
        auth: { type: 'oauth2', accessToken: '${OAUTH_TOKEN}' },
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const env: any = { name: 'e', variables: { OAUTH_TOKEN: 'ya29.a0Ab' } };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    expect((result.data!.tests[0].auth as any).accessToken).toBe('ya29.a0Ab');
  });

  test('mergeAndInterpolate - 未解析鉴权占位符返回配置错误', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      auth: { type: 'bearer', token: '${MISSING_AUTH_TOKEN}' },
      tests: [{ id: 't1', name: 'T', method: 'GET', url: '/', assertions: [{ type: 'statusCode', value: 200 }] }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(false);
    const authErrors = result.errors!.filter((e) => e.type === 'unresolved_placeholder');
    expect(authErrors.length).toBeGreaterThanOrEqual(1);
    const fieldErr = authErrors.find((e) => e.fieldPath === 'auth.token');
    expect(fieldErr).toBeDefined();
    expect(fieldErr!.placeholder).toBe('MISSING_AUTH_TOKEN');
    expect(fieldErr!.suggestion).toContain('export MISSING_AUTH_TOKEN');
    expect(fieldErr!.suggestion).toContain('CI 环境');
  });

  test('mergeAndInterpolate - 用例级未解析鉴权占位符带具体对象路径', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      tests: [
        { id: 't1', name: 'T1', method: 'GET', url: '/', assertions: [{ type: 'statusCode', value: 200 }] },
        {
          id: 't2', name: 'T2', method: 'GET', url: '/',
          auth: { type: 'basic', username: 'u', password: '${T2_PASSWORD}' },
          assertions: [{ type: 'statusCode', value: 200 }],
        },
      ],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(false);
    const err = result.errors!.find((e) => e.fieldPath === 'tests[1].auth.password');
    expect(err).toBeDefined();
    expect(err!.placeholder).toBe('T2_PASSWORD');
    expect(err!.message).toContain('鉴权字段');
    expect(err!.suggestion).toContain('避免在配置文件中硬编码密码');
  });

  test('mergeAndInterpolate - 未解析非鉴权占位符也返回错误', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/users/${USER_ID}',
        assertions: [{ type: 'bodyJsonPath', path: '$.name', value: '${EXPECTED_NAME}' }],
      }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(false);
    const urlErr = result.errors!.find((e) => e.fieldPath === 'tests[0].url');
    expect(urlErr).toBeDefined();
    expect(urlErr!.placeholder).toBe('USER_ID');
    expect(urlErr!.suggestion).toContain('tests[].extract');
  });

  test('mergeAndInterpolate - 鉴权错误置顶并汇总提示', () => {
    const collection: any = {
      name: 'A', version: '1.0', baseUrl: 'http://x',
      auth: { type: 'bearer', token: '${BAD_TOKEN}' },
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/${PATH_VAR}',
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(false);
    expect(result.errors![0].message).toContain('鉴权相关字段');
    expect(result.errors![0].suggestion).toContain('auth.token');
  });

  test('mergeAndInterpolate - 内置 TIMESTAMP/DATE/RANDOM 变量可用', () => {
    const collection: any = {
      name: 'B', version: '${DATE}', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'test-${TIMESTAMP}-${RANDOM}', method: 'GET', url: '/',
        assertions: [{ type: 'statusCode', value: 200 }],
      }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.success).toBe(true);
    expect(result.data!.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.data!.tests[0].name).toMatch(/^test-\d+-\d+$/);
  });

  test('mergeAndInterpolate - assertions 中的占位符统一解析', () => {
    const expectedPattern = 'user_\\d+';
    const collection: any = {
      name: 'B', version: '1.0', baseUrl: 'http://x',
      tests: [{
        id: 't1', name: 'T', method: 'GET', url: '/',
        assertions: [
          { type: 'header', name: 'X-Tenant', value: '${EXPECTED_TENANT}' },
          { type: 'bodyRegex', pattern: '${REGEX_PATTERN}', flags: 'i' },
        ],
      }],
    };
    const env: any = { name: 'e', variables: { EXPECTED_TENANT: 'acme', REGEX_PATTERN: expectedPattern } };
    const result = mergeAndInterpolate(collection, env);
    expect(result.success).toBe(true);
    const assertions = result.data!.tests[0].assertions as any[];
    expect(assertions[0].value).toBe('acme');
    expect(assertions[1].pattern).toBe(expectedPattern);
    expect(assertions[1].pattern.length).toBe(expectedPattern.length);
  });
});

describe('断言引擎', () => {
  const makeCtx = (overrides: Partial<AssertionContext> = {}): AssertionContext => ({
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'x-request-id': 'req-123' },
    body: { id: 1, name: 'Alice', roles: ['admin', 'user'], meta: { active: true } },
    bodyText: '{"id":1,"name":"Alice"}',
    responseTimeMs: 120,
    ...overrides,
  });

  test('statusCode - 通过', () => {
    const result = runAssertions([{ type: 'statusCode', value: 200 }], makeCtx());
    expect(result[0].passed).toBe(true);
  });

  test('statusCode - 失败有建议', () => {
    const result = runAssertions([{ type: 'statusCode', value: 200 }], makeCtx({ statusCode: 401 }));
    expect(result[0].passed).toBe(false);
    expect(result[0].suggestion).toContain('鉴权');
  });

  test('statusCodeRange - 范围检查', () => {
    const assertions: Assertion[] = [{ type: 'statusCodeRange', min: 200, max: 299 }];
    expect(runAssertions(assertions, makeCtx({ statusCode: 201 }))[0].passed).toBe(true);
    expect(runAssertions(assertions, makeCtx({ statusCode: 400 }))[0].passed).toBe(false);
  });

  test('header - 大小写不敏感匹配', () => {
    const assertions: Assertion[] = [{ type: 'header', name: 'X-Request-ID', value: 'req-123', caseInsensitive: true }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });

  test('headerExists - 存在性检查', () => {
    const assertions: Assertion[] = [{ type: 'headerExists', name: 'content-type' }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });

  test('bodyJsonPath - JSONPath 匹配', () => {
    const assertions: Assertion[] = [
      { type: 'bodyJsonPath', path: '$.name', value: 'Alice' },
      { type: 'bodyJsonPath', path: '$.roles[0]', value: 'admin' },
    ];
    const results = runAssertions(assertions, makeCtx());
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(true);
  });

  test('bodyJsonPath - 路径不存在有建议', () => {
    const assertions: Assertion[] = [{ type: 'bodyJsonPath', path: '$.notExist', value: 'x' }];
    const result = runAssertions(assertions, makeCtx());
    expect(result[0].passed).toBe(false);
    expect(result[0].suggestion).toBeDefined();
  });

  test('bodyContains - 包含检查', () => {
    const assertions: Assertion[] = [{ type: 'bodyContains', value: 'Alice' }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });

  test('bodyRegex - 正则匹配', () => {
    const assertions: Assertion[] = [{ type: 'bodyRegex', pattern: '"id":\\d+', flags: 'g' }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });

  test('responseTime - 时间检查', () => {
    const assertions: Assertion[] = [{ type: 'responseTime', maxMs: 200 }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
    expect(runAssertions(assertions, makeCtx({ responseTimeMs: 300 }))[0].passed).toBe(false);
  });

  test('contentType - MIME 类型检查', () => {
    const assertions: Assertion[] = [{ type: 'contentType', value: 'application/json' }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });

  test('jsonSchema - schema 校验', () => {
    const assertions: Assertion[] = [{
      type: 'jsonSchema',
      schema: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      },
    }];
    expect(runAssertions(assertions, makeCtx())[0].passed).toBe(true);
  });
});

describe('退出码 & 报告', () => {
  const mockReport = (statuses: string[]) => {
    return {
      collectionName: 'Test',
      collectionVersion: '1.0',
      cliVersion: '1.0.0',
      environment: 'test',
      config: { parallel: 1, retryMaxAttempts: 1, timeoutMs: 30000 },
      summary: {
        total: statuses.length,
        passed: statuses.filter(s => s === 'passed').length,
        failed: statuses.filter(s => s === 'failed').length,
        skipped: statuses.filter(s => s === 'skipped').length,
        errors: statuses.filter(s => s === 'error').length,
        totalTimeMs: 100,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      },
      results: statuses.map((s, i) => ({
        id: `t${i}`, name: `Test ${i}`, status: s as any,
        totalAttempts: 1, responseTimeMs: 10,
        assertionResults: [], failedAssertions: [], attempts: [],
      })),
    } as any;
  };

  test('determineExitCode - 全部通过返回 0', () => {
    expect(determineExitCode(mockReport(['passed', 'passed']))).toBe(0);
  });

  test('determineExitCode - 有失败返回 1', () => {
    expect(determineExitCode(mockReport(['passed', 'failed']))).toBe(1);
  });

  test('determineExitCode - 有错误返回 1', () => {
    expect(determineExitCode(mockReport(['passed', 'error']))).toBe(1);
  });

  test('determineExitCode - 无测试返回 1', () => {
    expect(determineExitCode(mockReport([]))).toBe(1);
  });
});

describe('报告输出', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'smoke-api-report-'));
  });

  test('writeJsonReport - 写入文件', () => {
    const report = {
      collectionName: 'C', collectionVersion: '1.0', cliVersion: '1.0.0',
      summary: { total: 1, passed: 1, failed: 0, skipped: 0, errors: 0, totalTimeMs: 100, startedAt: '', finishedAt: '' },
      results: [],
      config: { parallel: 1, retryMaxAttempts: 1, timeoutMs: 30000 },
    } as any;
    const outPath = join(tmpDir, 'report.json');
    writeJsonReport(report, outPath);
    expect(existsSync(outPath)).toBe(true);
    const content = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(content.collectionName).toBe('C');
  });

  test('writeJUnitReport - 写入 XML', () => {
    const report = {
      collectionName: 'Coll', collectionVersion: '1.0', cliVersion: '1.0.0',
      summary: { total: 2, passed: 1, failed: 1, skipped: 0, errors: 0, totalTimeMs: 200, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() },
      results: [
        {
          id: 't1', name: 'Pass Test', status: 'passed', tags: ['smoke'],
          totalAttempts: 1, responseTimeMs: 50, statusCode: 200,
          assertionResults: [], failedAssertions: [], attempts: [],
        },
        {
          id: 't2', name: 'Fail Test', status: 'failed',
          totalAttempts: 2, responseTimeMs: 100, statusCode: 500,
          assertionResults: [{ type: 'statusCode', passed: false, message: 'status mismatch', expected: 200, actual: 500, suggestion: 'check server' }],
          failedAssertions: [{ type: 'statusCode', passed: false, message: 'status mismatch' }],
          attempts: [],
        },
      ],
      config: { parallel: 1, retryMaxAttempts: 2, timeoutMs: 30000 },
    } as any;
    const outPath = join(tmpDir, 'junit.xml');
    writeJUnitReport(report, outPath);
    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, 'utf-8');
    expect(content).toContain('<?xml');
    expect(content).toContain('testsuites');
    expect(content).toContain('t1');
    expect(content).toContain('t2');
    expect(content).toContain('failure');
  });
});

describe('Dry Run 报告', () => {
  test('buildDryRunReport - 所有用例标记为 skipped', () => {
    const collection: any = {
      name: 'Dry Test', version: '1.0', baseUrl: 'http://localhost',
      tests: [
        { id: 't1', name: 'A', method: 'GET', url: '/a', assertions: [], tags: ['smoke'] },
        { id: 't2', name: 'B', method: 'POST', url: '/b', assertions: [] },
      ],
    };
    const args: any = { collection: 'x', parallel: 5, retry: 2, timeout: 10000, failFast: false };
    const report = buildDryRunReport(collection, args, '2.0.0');
    expect(report.summary.total).toBe(2);
    expect(report.summary.skipped).toBe(2);
    expect(report.cliVersion).toBe('2.0.0');
    expect(report.config.parallel).toBe(5);
    expect(report.results[0].status).toBe('skipped');
  });
});
