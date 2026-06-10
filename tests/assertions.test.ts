import { AssertionEngine } from '../src/core/assertions';
import { Assertion, HttpResponseData } from '../src/types';

describe('AssertionEngine', () => {
  const mockResponse: HttpResponseData = {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': 'req-123',
      'content-length': '1234',
    },
    data: {
      code: 0,
      message: 'success',
      data: {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'admin',
        tags: ['a', 'b', 'c'],
        profile: {
          age: 30,
          city: 'Beijing',
        },
      },
      list: [1, 2, 3, 4, 5],
    },
    responseTime: 156,
    size: 1234,
  };

  test('status equals 断言通过', () => {
    const assert: Assertion = {
      name: '状态码测试',
      type: 'status',
      operator: 'equals',
      expected: 200,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('status equals 断言失败', () => {
    const assert: Assertion = {
      name: '状态码测试',
      type: 'status',
      operator: 'equals',
      expected: 201,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(false);
  });

  test('status in 断言', () => {
    const assert: Assertion = {
      name: '状态码in测试',
      type: 'status',
      operator: 'in',
      expected: [200, 201, 204],
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('header contains 断言', () => {
    const assert: Assertion = {
      name: 'Content-Type测试',
      type: 'header',
      path: 'Content-Type',
      operator: 'contains',
      expected: 'application/json',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('header equals 断言', () => {
    const assert: Assertion = {
      name: 'X-Request-ID测试',
      type: 'header',
      path: 'x-request-id',
      operator: 'equals',
      expected: 'req-123',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('time lessThan 断言', () => {
    const assert: Assertion = {
      name: '响应时间测试',
      type: 'time',
      operator: 'lessThan',
      expected: 500,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
    expect(result.actual).toBe(156);
  });

  test('time greaterThan 失败', () => {
    const assert: Assertion = {
      name: '响应时间测试',
      type: 'time',
      operator: 'greaterThan',
      expected: 500,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(false);
  });

  test('body equals 对象路径', () => {
    const assert: Assertion = {
      name: '用户名称',
      type: 'body',
      path: '$.data.name',
      operator: 'equals',
      expected: 'Alice',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
    expect(result.actual).toBe('Alice');
  });

  test('body equals 数字比较', () => {
    const assert: Assertion = {
      name: '用户ID',
      type: 'body',
      path: '$.data.id',
      operator: 'equals',
      expected: 1,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('jsonpath exists 断言', () => {
    const assert: Assertion = {
      name: 'profile存在',
      type: 'jsonpath',
      path: '$.data.profile',
      operator: 'exists',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('jsonpath notExists 失败断言', () => {
    const assert: Assertion = {
      name: '不存在字段',
      type: 'jsonpath',
      path: '$.data.not_exist_field',
      operator: 'notExists',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('typeOf 断言', () => {
    const assert: Assertion = {
      name: 'name是字符串',
      type: 'body',
      path: '$.data.name',
      operator: 'typeOf',
      expected: 'string',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('contains 字符串包含', () => {
    const assert: Assertion = {
      name: 'email包含@',
      type: 'body',
      path: '$.data.email',
      operator: 'contains',
      expected: '@',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('includes 数组包含', () => {
    const assert: Assertion = {
      name: 'tags包含a',
      type: 'body',
      path: '$.data.tags',
      operator: 'includes',
      expected: 'a',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('hasLength 数组长度', () => {
    const assert: Assertion = {
      name: 'tags有3个元素',
      type: 'body',
      path: '$.data.tags',
      operator: 'hasLength',
      expected: 3,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('startsWith 字符串前缀', () => {
    const assert: Assertion = {
      name: 'email前缀',
      type: 'body',
      path: '$.data.email',
      operator: 'startsWith',
      expected: 'alice',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('endsWith 字符串后缀', () => {
    const assert: Assertion = {
      name: 'email后缀',
      type: 'body',
      path: '$.data.email',
      operator: 'endsWith',
      expected: 'example.com',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('regex 正则匹配', () => {
    const assert: Assertion = {
      name: '邮箱格式',
      type: 'body',
      path: '$.data.email',
      operator: 'regex',
      expected: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('greaterThan 数字比较', () => {
    const assert: Assertion = {
      name: '年龄大于18',
      type: 'body',
      path: '$.data.profile.age',
      operator: 'greaterThan',
      expected: 18,
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('notEquals 不等于', () => {
    const assert: Assertion = {
      name: '角色非普通用户',
      type: 'body',
      path: '$.data.role',
      operator: 'notEquals',
      expected: 'user',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });

  test('runAll 返回所有结果', () => {
    const assertions: Assertion[] = [
      { name: '1', type: 'status', operator: 'equals', expected: 200 },
      { name: '2', type: 'status', operator: 'equals', expected: 400 },
      { name: '3', type: 'time', operator: 'lessThan', expected: 1000 },
    ];
    const results = AssertionEngine.runAll(assertions, mockResponse);
    expect(results.length).toBe(3);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
    expect(results[2].passed).toBe(true);
  });

  test('未知断言类型返回失败', () => {
    const assert: Assertion = {
      name: '未知类型',
      type: 'unknown_type' as any,
      operator: 'equals',
      expected: 'x',
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('未知的断言类型');
  });

  test('深度对象equals比较', () => {
    const assert: Assertion = {
      name: 'profile相等',
      type: 'body',
      path: '$.data.profile',
      operator: 'equals',
      expected: { age: 30, city: 'Beijing' },
    };
    const result = AssertionEngine.runOne(assert, mockResponse);
    expect(result.passed).toBe(true);
  });
});
