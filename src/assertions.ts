import { JSONPath } from 'jsonpath-plus';
import {
  Assertion,
  AssertionResult,
  AssertionType,
} from './types';

export interface AssertionContext {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  bodyText: string;
  responseTimeMs: number;
}

function formatValue(value: unknown, maxLen = 80): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (str.length > maxLen) {
      return str.slice(0, maxLen) + '...';
    }
    return str;
  } catch {
    return String(value);
  }
}

function getHeader(headers: Record<string, string>, name: string, caseInsensitive = false): string | undefined {
  if (caseInsensitive) {
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
    return key ? headers[key] : undefined;
  }
  return headers[name];
}

function assertStatusCode(
  assertion: Extract<Assertion, { type: 'statusCode' }>,
  ctx: AssertionContext
): AssertionResult {
  const passed = ctx.statusCode === assertion.value;
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `状态码为 ${ctx.statusCode}，符合预期`
      : `状态码不匹配：期望 ${assertion.value}，实际 ${ctx.statusCode}`,
    expected: assertion.value,
    actual: ctx.statusCode,
    suggestion: passed ? undefined : getStatusSuggestion(assertion.value, ctx.statusCode),
  };
}

function getStatusSuggestion(expected: number, actual: number): string {
  if (actual >= 400 && actual < 500) {
    if (actual === 400) return '请检查请求参数格式和内容是否正确';
    if (actual === 401) return '请检查鉴权配置，token/用户名密码是否有效';
    if (actual === 403) return '请检查用户权限是否足够访问该资源';
    if (actual === 404) return '请检查URL路径和服务是否部署正确';
    if (actual === 405) return '请检查HTTP方法是否正确（可能需要 POST 而不是 GET）';
    if (actual === 408) return '请检查网络连接，服务端超时，可尝试增加超时时间';
    if (actual === 429) return '请求过于频繁，请增加重试间隔或降低并发';
    return `客户端错误 (${actual})，请检查请求内容`;
  }
  if (actual >= 500) {
    if (actual === 500) return '服务端内部错误，请查看后端日志定位问题';
    if (actual === 502) return '网关错误，请检查上游服务是否正常运行';
    if (actual === 503) return '服务不可用，请确认服务是否已启动并可访问';
    if (actual === 504) return '网关超时，后端响应过慢，请检查性能';
    return `服务端错误 (${actual})，请联系后端团队排查`;
  }
  if (actual < 400 && expected >= 400) {
    return `期望失败状态码，但请求成功了 (${actual})，请检查业务逻辑`;
  }
  return `请确认期望状态码 ${expected} 是否正确`;
}

function assertStatusCodeRange(
  assertion: Extract<Assertion, { type: 'statusCodeRange' }>,
  ctx: AssertionContext
): AssertionResult {
  const passed = ctx.statusCode >= assertion.min && ctx.statusCode <= assertion.max;
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `状态码 ${ctx.statusCode} 在范围 [${assertion.min}, ${assertion.max}] 内`
      : `状态码 ${ctx.statusCode} 超出范围 [${assertion.min}, ${assertion.max}]`,
    expected: `${assertion.min}-${assertion.max}`,
    actual: ctx.statusCode,
    suggestion: passed ? undefined : getStatusSuggestion(assertion.min, ctx.statusCode),
  };
}

function assertHeader(
  assertion: Extract<Assertion, { type: 'header' }>,
  ctx: AssertionContext
): AssertionResult {
  const actual = getHeader(ctx.headers, assertion.name, assertion.caseInsensitive);
  const passed = actual !== undefined && actual === assertion.value;
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `响应头 ${assertion.name} = ${formatValue(actual)}`
      : actual === undefined
        ? `响应头 ${assertion.name} 不存在`
        : `响应头 ${assertion.name} 不匹配：期望 ${formatValue(assertion.value)}，实际 ${formatValue(actual)}`,
    expected: assertion.value,
    actual,
    suggestion: passed
      ? undefined
      : actual === undefined
        ? '请检查后端是否返回了该响应头，或检查 header 名称拼写'
        : '请检查响应头值的大小写、空格、格式是否一致',
  };
}

function assertHeaderExists(
  assertion: Extract<Assertion, { type: 'headerExists' }>,
  ctx: AssertionContext
): AssertionResult {
  const exists = Object.keys(ctx.headers).some(
    (k) => k.toLowerCase() === assertion.name.toLowerCase()
  );
  return {
    type: assertion.type,
    passed: exists,
    message: exists
      ? `响应头 ${assertion.name} 存在`
      : `响应头 ${assertion.name} 不存在`,
    actual: exists,
    suggestion: exists ? undefined : '请检查后端是否设置了该响应头',
  };
}

function assertBodyJsonPath(
  assertion: Extract<Assertion, { type: 'bodyJsonPath' }>,
  ctx: AssertionContext
): AssertionResult {
  try {
    if (typeof ctx.body !== 'object' || ctx.body === null) {
      return {
        type: assertion.type,
        passed: false,
        message: `响应体不是 JSON 对象，无法使用 JSONPath 查询`,
        expected: assertion.value,
        actual: typeof ctx.body,
        suggestion: '请确认接口返回 Content-Type: application/json，且响应体为合法 JSON',
      };
    }
    const results = JSONPath({ path: assertion.path, json: ctx.body });
    const actual = results.length === 1 ? results[0] : results.length > 1 ? results : undefined;

    const strict = assertion.strict ?? true;
    let passed: boolean;
    if (strict) {
      passed = JSON.stringify(actual) === JSON.stringify(assertion.value);
    } else {
      passed = String(actual) === String(assertion.value);
    }

    return {
      type: assertion.type,
      passed,
      message: passed
        ? `JSONPath ${assertion.path} = ${formatValue(actual)}`
        : `JSONPath ${assertion.path} 不匹配：期望 ${formatValue(assertion.value)}，实际 ${formatValue(actual)}`,
      expected: assertion.value,
      actual,
      suggestion: passed
        ? undefined
        : actual === undefined
          ? `JSONPath ${assertion.path} 未找到任何值，请检查路径是否正确`
          : '请检查 JSONPath 表达式和期望的值，注意数据类型（数字 vs 字符串）',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      type: assertion.type,
      passed: false,
      message: `JSONPath 执行异常: ${msg}`,
      expected: assertion.value,
      suggestion: '请检查 JSONPath 语法是否正确，参考 https://goessner.net/articles/JsonPath/',
    };
  }
}

function assertBodyContains(
  assertion: Extract<Assertion, { type: 'bodyContains' }>,
  ctx: AssertionContext
): AssertionResult {
  const passed = ctx.bodyText.includes(assertion.value);
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `响应体包含 "${assertion.value}"`
      : `响应体不包含 "${assertion.value}"`,
    expected: assertion.value,
    actual: formatValue(ctx.bodyText, 100),
    suggestion: passed ? undefined : '请检查接口返回内容，可能是业务逻辑或数据问题',
  };
}

function assertBodyRegex(
  assertion: Extract<Assertion, { type: 'bodyRegex' }>,
  ctx: AssertionContext
): AssertionResult {
  try {
    const regex = new RegExp(assertion.pattern, assertion.flags);
    const passed = regex.test(ctx.bodyText);
    return {
      type: assertion.type,
      passed,
      message: passed
        ? `响应体匹配正则 /${assertion.pattern}/${assertion.flags || ''}`
        : `响应体不匹配正则 /${assertion.pattern}/${assertion.flags || ''}`,
      expected: `/${assertion.pattern}/${assertion.flags || ''}`,
      actual: formatValue(ctx.bodyText, 100),
      suggestion: passed ? undefined : '请检查正则表达式语法，或在 https://regex101.com 上验证',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      type: assertion.type,
      passed: false,
      message: `正则表达式错误: ${msg}`,
      suggestion: '请检查正则表达式语法是否合法',
    };
  }
}

function assertResponseTime(
  assertion: Extract<Assertion, { type: 'responseTime' }>,
  ctx: AssertionContext
): AssertionResult {
  const passed = ctx.responseTimeMs <= assertion.maxMs;
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `响应时间 ${ctx.responseTimeMs}ms <= ${assertion.maxMs}ms`
      : `响应时间 ${ctx.responseTimeMs}ms 超过上限 ${assertion.maxMs}ms`,
    expected: `${assertion.maxMs}ms`,
    actual: `${ctx.responseTimeMs}ms`,
    suggestion: passed
      ? undefined
      : ctx.responseTimeMs > assertion.maxMs * 3
        ? '响应时间严重超标，请检查数据库查询、外部依赖调用或网络延迟'
        : '响应时间略超阈值，可考虑优化接口性能或增加阈值',
  };
}

function assertJsonSchema(
  assertion: Extract<Assertion, { type: 'jsonSchema' }>,
  ctx: AssertionContext
): AssertionResult {
  try {
    if (typeof ctx.body !== 'object' || ctx.body === null) {
      return {
        type: assertion.type,
        passed: false,
        message: '响应体不是 JSON 对象，无法验证 JSON Schema',
        suggestion: '请确认接口返回 Content-Type: application/json',
      };
    }
    const errors = validateJsonSchema(assertion.schema as Record<string, unknown>, ctx.body);
    return {
      type: assertion.type,
      passed: errors.length === 0,
      message: errors.length === 0
        ? '响应体符合 JSON Schema'
        : `响应体不符合 JSON Schema: ${errors.join('; ')}`,
      actual: errors.length > 0 ? errors : undefined,
      suggestion: errors.length === 0 ? undefined : '请检查响应体字段类型、必填字段和数据结构',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      type: assertion.type,
      passed: false,
      message: `JSON Schema 验证异常: ${msg}`,
      suggestion: '请检查 JSON Schema 格式是否正确',
    };
  }
}

function validateJsonSchema(schema: Record<string, unknown>, data: unknown): string[] {
  const errors: string[] = [];
  const type = schema['type'];

  if (type === 'object' && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const required = schema['required'] as string[] | undefined;
    if (required) {
      for (const field of required) {
        if (!(field in (data as Record<string, unknown>))) {
          errors.push(`缺少必填字段: ${field}`);
        }
      }
    }
    const properties = schema['properties'] as Record<string, Record<string, unknown>> | undefined;
    if (properties) {
      for (const [key, propSchema] of Object.entries(properties)) {
        if (key in (data as Record<string, unknown>)) {
          const subErrors = validateJsonSchema(propSchema, (data as Record<string, unknown>)[key]);
          errors.push(...subErrors.map((e) => `${key}.${e}`));
        }
      }
    }
  } else if (type === 'array' && Array.isArray(data)) {
    const items = schema['items'] as Record<string, unknown> | undefined;
    if (items) {
      data.forEach((item, index) => {
        const subErrors = validateJsonSchema(items, item);
        errors.push(...subErrors.map((e) => `[${index}].${e}`));
      });
    }
  } else if (type !== undefined) {
    const actualType = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;
    const types = Array.isArray(type) ? type : [type];
    if (!types.includes(actualType)) {
      errors.push(`类型不匹配: 期望 ${types.join('|')}, 实际 ${actualType}`);
    }
  }

  return errors;
}

function assertContentType(
  assertion: Extract<Assertion, { type: 'contentType' }>,
  ctx: AssertionContext
): AssertionResult {
  const contentType = getHeader(ctx.headers, 'content-type', true) || '';
  const passed = contentType.includes(assertion.value);
  return {
    type: assertion.type,
    passed,
    message: passed
      ? `Content-Type 包含 "${assertion.value}" (实际: ${contentType})`
      : `Content-Type 不包含 "${assertion.value}" (实际: ${contentType || '未设置'})`,
    expected: assertion.value,
    actual: contentType,
    suggestion: passed ? undefined : '请检查后端是否正确设置了 Content-Type 响应头',
  };
}

export function runAssertions(
  assertions: Assertion[],
  ctx: AssertionContext
): AssertionResult[] {
  return assertions.map((assertion) => {
    switch (assertion.type) {
      case 'statusCode':
        return assertStatusCode(assertion, ctx);
      case 'statusCodeRange':
        return assertStatusCodeRange(assertion, ctx);
      case 'header':
        return assertHeader(assertion, ctx);
      case 'headerExists':
        return assertHeaderExists(assertion, ctx);
      case 'bodyJsonPath':
        return assertBodyJsonPath(assertion, ctx);
      case 'bodyContains':
        return assertBodyContains(assertion, ctx);
      case 'bodyRegex':
        return assertBodyRegex(assertion, ctx);
      case 'responseTime':
        return assertResponseTime(assertion, ctx);
      case 'jsonSchema':
        return assertJsonSchema(assertion, ctx);
      case 'contentType':
        return assertContentType(assertion, ctx);
      default:
        const _exhaustive: never = assertion;
        return {
          type: (assertion as { type: AssertionType }).type,
          passed: false,
          message: `未知断言类型: ${(_exhaustive as unknown as { type: string }).type}`,
          suggestion: '请检查断言 type 字段是否正确',
        };
    }
  });
}
