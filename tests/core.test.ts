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
    expect(result.name).toBe('开发 测试集合');
    expect(result.tests[0].url).toBe('http://localhost:3000/api/users/123');
    expect(result.tests[0].headers?.Authorization).toBe('Bearer abc');
    expect(result.tests[0].queryParams?.include).toBe('profile');
  });

  test('mergeAndInterpolate - baseUrl 自动拼接', () => {
    const collection: any = {
      name: 'C', version: '1.0',
      baseUrl: 'https://api.example.com/',
      tests: [{ id: 't1', name: 'T', method: 'GET', url: '/users', assertions: [] }],
    };
    const result = mergeAndInterpolate(collection);
    expect(result.tests[0].url).toBe('https://api.example.com/users');
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
