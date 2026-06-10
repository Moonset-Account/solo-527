import { VariableResolver } from '../src/utils/variables';

describe('VariableResolver', () => {
  let resolver: VariableResolver;

  beforeEach(() => {
    resolver = new VariableResolver({
      env: { BASE_URL: 'http://localhost', TOKEN: 'token123' },
      collection: { APP_NAME: 'TestApp', VERSION: '1.0.0' },
      globals: { GLOBAL_KEY: 'global_value' },
      folder: { FOLDER_PREFIX: 'ORD_' },
      extracted: { USER_ID: 'user_001', USER_TOKEN: 'abc' },
    });
  });

  test('解析简单变量', () => {
    expect(resolver.resolveString('Hello {{env.BASE_URL}} world'))
      .toBe('Hello http://localhost world');
  });

  test('解析嵌套变量', () => {
    expect(resolver.resolveString('{{env.TOKEN}}'))
      .toBe('token123');
    expect(resolver.resolveString('{{extract.USER_ID}}'))
      .toBe('user_001');
  });

  test('无前缀变量按优先级查找', () => {
    expect(resolver.resolveString('{{USER_ID}}')).toBe('user_001');
    expect(resolver.resolveString('{{APP_NAME}}')).toBe('TestApp');
    expect(resolver.resolveString('{{GLOBAL_KEY}}')).toBe('global_value');
  });

  test('timestamp函数', () => {
    const result = resolver.resolveString('{{timestamp()}}');
    expect(parseInt(result, 10)).toBeGreaterThan(1000000000000);
  });

  test('timestamp秒级', () => {
    const result = resolver.resolveString('{{timestamp(s)}}');
    expect(parseInt(result, 10)).toBeLessThan(10000000000);
  });

  test('uuid函数生成合法UUID', () => {
    const result = resolver.resolveString('{{uuid()}}');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(result)).toBe(true);
  });

  test('random函数', () => {
    for (let i = 0; i < 100; i++) {
      const result = parseInt(resolver.resolveString('{{random(1, 10)}}'), 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  test('randomString函数', () => {
    const result = resolver.resolveString('{{randomString(32)}}');
    expect(result.length).toBe(32);
    expect(/^[A-Za-z0-9]+$/.test(result)).toBe(true);
  });

  test('lowercase和uppercase函数', () => {
    expect(resolver.resolveString("{{lowercase('HELLO')}}")).toBe('hello');
    expect(resolver.resolveString("{{uppercase('hello')}}")).toBe('HELLO');
  });

  test('base64函数', () => {
    expect(resolver.resolveString("{{base64('Hello World')}}")).toBe('SGVsbG8gV29ybGQ=');
  });

  test('encodeURI函数', () => {
    expect(resolver.resolveString("{{encodeURI('a b c')}}")).toBe('a%20b%20c');
  });

  test('strict模式下未定义变量抛出错误', () => {
    expect(() => resolver.resolveString('{{UNDEFINED_VAR}}', true))
      .toThrow(/未解析的变量/);
  });

  test('非strict模式下未定义变量返回空', () => {
    expect(resolver.resolveString('{{UNDEFINED_VAR}}', false)).toBe('');
    expect(resolver.resolveString('prefix {{UNDEFINED_VAR}} suffix')).toBe('prefix  suffix');
  });

  test('解析对象', () => {
    const obj = {
      url: '{{env.BASE_URL}}/api',
      headers: {
        'X-App': '{{collection.APP_NAME}}',
        'X-User': '{{extract.USER_ID}}',
      },
      body: {
        n: '{{random(1,5)}}',
        arr: [1, '{{collection.VERSION}}'],
      },
    };
    const resolved = resolver.resolveObject(obj);
    expect(resolved.url).toBe('http://localhost/api');
    expect((resolved.headers as any)['X-App']).toBe('TestApp');
    expect((resolved.headers as any)['X-User']).toBe('user_001');
    expect((resolved.body as any).arr[1]).toBe('1.0.0');
  });

  test('解析数组', () => {
    const arr = ['{{env.BASE_URL}}', '{{env.TOKEN}}'];
    expect(resolver.resolveObject(arr)).toEqual(['http://localhost', 'token123']);
  });

  test('setExtracted动态设置变量', () => {
    resolver.setExtracted('NEW_KEY', 'new_value');
    expect(resolver.resolveString('{{NEW_KEY}}')).toBe('new_value');
    expect(resolver.resolveString('{{extract.NEW_KEY}}')).toBe('new_value');
  });

  test('env函数读取系统环境变量', () => {
    process.env.TEST_VAR_CLI = 'hello_test';
    expect(resolver.resolveString("{{env('TEST_VAR_CLI')}}")).toBe('hello_test');
    delete process.env.TEST_VAR_CLI;
  });
});
