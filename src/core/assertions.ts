import { Assertion, AssertionResult, HttpResponseData, AssertionOperator } from '../types';
import { JSONPath } from 'jsonpath-plus';

export class AssertionEngine {
  static runAll(assertions: Assertion[], response: HttpResponseData): AssertionResult[] {
    return assertions.map(assert => this.runOne(assert, response));
  }

  static runOne(assertion: Assertion, response: HttpResponseData): AssertionResult {
    const startTime = Date.now();
    let passed = false;
    let actual: unknown;
    let message = '';

    try {
      switch (assertion.type) {
        case 'status':
          actual = response.status;
          passed = this.compare(assertion.operator, actual, assertion.expected);
          message = passed
            ? `状态码验证通过: ${actual} ${this.operatorSymbol(assertion.operator)} ${assertion.expected}`
            : `状态码验证失败: 期望 ${this.operatorSymbol(assertion.operator)} ${assertion.expected}, 实际 ${actual}`;
          break;

        case 'header':
          const headerName = assertion.path?.toLowerCase() || '';
          actual = response.headers[headerName];
          passed = this.compare(assertion.operator, actual, assertion.expected);
          message = passed
            ? `响应头 [${headerName}] 验证通过: ${JSON.stringify(actual)}`
            : `响应头 [${headerName}] 验证失败: 期望 ${this.operatorSymbol(assertion.operator)} ${JSON.stringify(assertion.expected)}, 实际 ${JSON.stringify(actual)}`;
          break;

        case 'body':
          if (assertion.path) {
            try {
              actual = this.extractByJsonPath(response.data, assertion.path);
            } catch (err) {
              message = `JSONPath 解析失败 [${assertion.path}]: ${(err as Error).message}`;
              return this.buildResult(assertion, false, undefined, message, startTime);
            }
          } else {
            actual = response.data;
          }
          passed = this.compare(assertion.operator, actual, assertion.expected);
          message = passed
            ? `响应体 ${assertion.path ? '[' + assertion.path + ']' : ''} 验证通过`
            : `响应体 ${assertion.path ? '[' + assertion.path + ']' : ''} 验证失败: 期望 ${this.operatorSymbol(assertion.operator)} ${JSON.stringify(assertion.expected)}, 实际 ${JSON.stringify(actual)}`;
          break;

        case 'time':
          actual = response.responseTime;
          passed = this.compare(assertion.operator, actual, assertion.expected);
          message = passed
            ? `响应时间验证通过: ${actual}ms ${this.operatorSymbol(assertion.operator)} ${assertion.expected}ms`
            : `响应时间验证失败: 期望 ${this.operatorSymbol(assertion.operator)} ${assertion.expected}ms, 实际 ${actual}ms`;
          break;

        case 'jsonpath':
          if (!assertion.path) {
            message = 'jsonpath 断言缺少 path 字段';
            return this.buildResult(assertion, false, undefined, message, startTime);
          }
          try {
            actual = this.extractByJsonPath(response.data, assertion.path);
          } catch (err) {
            message = `JSONPath 解析失败 [${assertion.path}]: ${(err as Error).message}`;
            return this.buildResult(assertion, false, undefined, message, startTime);
          }
          passed = this.compare(assertion.operator, actual, assertion.expected);
          message = passed
            ? `JSONPath [${assertion.path}] 验证通过: ${JSON.stringify(actual)}`
            : `JSONPath [${assertion.path}] 验证失败: 期望 ${this.operatorSymbol(assertion.operator)} ${JSON.stringify(assertion.expected)}, 实际 ${JSON.stringify(actual)}`;
          break;

        default:
          message = `未知的断言类型: ${assertion.type}`;
          return this.buildResult(assertion, false, undefined, message, startTime);
      }
    } catch (err) {
      message = `断言执行异常: ${(err as Error).message}`;
      return this.buildResult(assertion, false, undefined, message, startTime);
    }

    return this.buildResult(assertion, passed, actual, message, startTime);
  }

  private static buildResult(
    assertion: Assertion,
    passed: boolean,
    actual: unknown,
    message: string,
    startTime: number
  ): AssertionResult {
    return {
      ...assertion,
      passed,
      actual,
      expected: assertion.expected,
      message,
      duration: Date.now() - startTime,
    };
  }

  private static operatorSymbol(op: AssertionOperator): string {
    const symbols: Record<AssertionOperator, string> = {
      equals: '==',
      notEquals: '!=',
      contains: 'contains',
      notContains: 'not contains',
      greaterThan: '>',
      lessThan: '<',
      regex: 'matches',
      exists: 'exists',
      notExists: 'not exists',
      typeOf: 'is type',
      in: 'in',
      notIn: 'not in',
      hasLength: 'length ==',
      includes: 'includes',
      startsWith: 'starts with',
      endsWith: 'ends with',
    };
    return symbols[op] || op;
  }

  private static extractByJsonPath(data: unknown, path: string): unknown {
    try {
      const results = JSONPath({ path, json: data as any }) as unknown as unknown[];
      if (!results || results.length === 0) return undefined;
      return results.length === 1 ? results[0] : results;
    } catch (err) {
      if (typeof data === 'object' && data !== null) {
        const directPath = path.replace(/^\$\.?/, '');
        const parts = directPath.split('.');
        let current: unknown = data;
        for (const part of parts) {
          if (current === null || current === undefined) return undefined;
          if (typeof current === 'object') {
            current = (current as Record<string, unknown>)[part];
          } else {
            return undefined;
          }
        }
        return current;
      }
      throw err;
    }
  }

  private static compare(op: AssertionOperator, actual: unknown, expected: unknown): boolean {
    const coerceNumber = (v: unknown): number | unknown => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = parseFloat(v);
        return isNaN(n) ? v : n;
      }
      return v;
    };

    const actualNum = coerceNumber(actual);
    const expectedNum = coerceNumber(expected);

    switch (op) {
      case 'equals':
        return this.deepEqual(actual, expected);
      case 'notEquals':
        return !this.deepEqual(actual, expected);
      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return actual.some(item => this.deepEqual(item, expected));
        }
        if (typeof actual === 'object' && actual !== null && typeof expected === 'string') {
          return expected in (actual as Record<string, unknown>);
        }
        return false;
      case 'notContains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return !actual.some(item => this.deepEqual(item, expected));
        }
        return true;
      case 'greaterThan':
        return typeof actualNum === 'number' && typeof expectedNum === 'number' && actualNum > expectedNum;
      case 'lessThan':
        return typeof actualNum === 'number' && typeof expectedNum === 'number' && actualNum < expectedNum;
      case 'regex':
        if (typeof actual !== 'string') return false;
        try {
          const regex = typeof expected === 'string' ? new RegExp(expected) : expected as RegExp;
          return regex.test(actual);
        } catch {
          return false;
        }
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'notExists':
        return actual === undefined || actual === null;
      case 'typeOf':
        return typeof actual === expected;
      case 'in':
        if (Array.isArray(expected)) {
          return expected.some(item => this.deepEqual(item, actual));
        }
        if (typeof expected === 'string' && typeof actual === 'string') {
          return expected.includes(actual);
        }
        return false;
      case 'notIn':
        if (Array.isArray(expected)) {
          return !expected.some(item => this.deepEqual(item, actual));
        }
        return true;
      case 'hasLength':
        if (Array.isArray(actual) || typeof actual === 'string') {
          const len = actual.length;
          const expLen = typeof expected === 'number' ? expected : parseInt(String(expected), 10);
          return len === expLen;
        }
        return false;
      case 'includes':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return actual.some(item => this.deepEqual(item, expected));
        }
        return false;
      case 'startsWith':
        return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
      case 'endsWith':
        return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
      default:
        return false;
    }
  }

  private static deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (typeof a !== typeof b) {
      const aStr = String(a);
      const bStr = String(b);
      if (aStr === bStr) return true;
      if (!isNaN(parseFloat(aStr)) && !isNaN(parseFloat(bStr))) {
        return parseFloat(aStr) === parseFloat(bStr);
      }
      return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!this.deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )) return false;
    }
    return true;
  }
}
