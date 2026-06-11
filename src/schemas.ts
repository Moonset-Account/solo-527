import { z } from 'zod';

const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

const BearerAuthSchema = z.object({
  type: z.literal('bearer'),
  token: z.string().min(1, 'Bearer token 不能为空'),
  headerName: z.string().optional(),
});

const BasicAuthSchema = z.object({
  type: z.literal('basic'),
  username: z.string().min(1, 'Basic auth username 不能为空'),
  password: z.string().min(1, 'Basic auth password 不能为空'),
});

const ApiKeyAuthSchema = z.object({
  type: z.literal('apiKey'),
  key: z.string().min(1, 'API key name 不能为空'),
  value: z.string().min(1, 'API key value 不能为空'),
  in: z.enum(['header', 'query']),
});

const OAuth2AuthSchema = z.object({
  type: z.literal('oauth2'),
  accessToken: z.string().min(1, 'OAuth2 accessToken 不能为空'),
  headerName: z.string().optional(),
  tokenType: z.string().optional(),
});

const NoneAuthSchema = z.object({ type: z.literal('none') });

const AuthConfigSchema = z.discriminatedUnion('type', [
  BearerAuthSchema,
  BasicAuthSchema,
  ApiKeyAuthSchema,
  OAuth2AuthSchema,
  NoneAuthSchema,
]);

const StatusCodeAssertionSchema = z.object({
  type: z.literal('statusCode'),
  value: z.number().int().min(100).max(599),
});

const StatusCodeRangeAssertionSchema = z.object({
  type: z.literal('statusCodeRange'),
  min: z.number().int().min(100).max(599),
  max: z.number().int().min(100).max(599),
}).refine((data) => data.min <= data.max, {
  message: 'min 必须小于或等于 max',
  path: ['min'],
});

const HeaderAssertionSchema = z.object({
  type: z.literal('header'),
  name: z.string().min(1),
  value: z.string(),
  caseInsensitive: z.boolean().optional(),
});

const HeaderExistsAssertionSchema = z.object({
  type: z.literal('headerExists'),
  name: z.string().min(1),
});

const BodyJsonPathAssertionSchema = z.object({
  type: z.literal('bodyJsonPath'),
  path: z.string().min(1, 'JSON path 不能为空'),
  value: z.unknown(),
  strict: z.boolean().optional(),
});

const BodyContainsAssertionSchema = z.object({
  type: z.literal('bodyContains'),
  value: z.string().min(1),
});

const BodyRegexAssertionSchema = z.object({
  type: z.literal('bodyRegex'),
  pattern: z.string().min(1),
  flags: z.string().optional(),
});

const ResponseTimeAssertionSchema = z.object({
  type: z.literal('responseTime'),
  maxMs: z.number().int().positive(),
});

const JsonSchemaAssertionSchema = z.object({
  type: z.literal('jsonSchema'),
  schema: z.record(z.unknown()),
});

const ContentTypeAssertionSchema = z.object({
  type: z.literal('contentType'),
  value: z.string().min(1),
});

const AssertionSchema = z.union([
  StatusCodeAssertionSchema,
  StatusCodeRangeAssertionSchema,
  HeaderAssertionSchema,
  HeaderExistsAssertionSchema,
  BodyJsonPathAssertionSchema,
  BodyContainsAssertionSchema,
  BodyRegexAssertionSchema,
  ResponseTimeAssertionSchema,
  JsonSchemaAssertionSchema,
  ContentTypeAssertionSchema,
]);

const RetryConfigSchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).optional(),
  delayMs: z.number().int().min(0).optional(),
  backoffMultiplier: z.number().min(1).optional(),
  retryOnStatus: z.array(z.number().int().min(100).max(599)).optional(),
});

const TestCaseSchema = z.object({
  id: z.string().min(1, '测试用例 id 不能为空'),
  name: z.string().min(1, '测试用例 name 不能为空'),
  description: z.string().optional(),
  method: HttpMethodSchema,
  url: z.string().min(1, 'url 不能为空'),
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.unknown().optional(),
  auth: AuthConfigSchema.optional(),
  assertions: z.array(AssertionSchema).min(1, '每个测试用例至少有一条断言'),
  timeoutMs: z.number().int().positive().optional(),
  retry: RetryConfigSchema.optional(),
  tags: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
  extract: z.record(z.string()).optional(),
  skip: z.boolean().optional(),
});

export const CollectionSchema = z.object({
  name: z.string().min(1, '集合 name 不能为空'),
  version: z.string().min(1, '集合 version 不能为空').default('1.0.0'),
  description: z.string().optional(),
  baseUrl: z.string().optional(),
  auth: AuthConfigSchema.optional(),
  headers: z.record(z.string()).optional(),
  timeoutMs: z.number().int().positive().optional(),
  retry: RetryConfigSchema.optional(),
  tests: z.array(TestCaseSchema).min(1, '集合中至少要有一个测试用例'),
}).superRefine((data, ctx) => {
  const ids = new Set<string>();
  for (const [index, test] of data.tests.entries()) {
    if (ids.has(test.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `重复的测试用例 id: ${test.id}`,
        path: ['tests', index, 'id'],
      });
    }
    ids.add(test.id);
    if (test.dependsOn) {
      for (const depId of test.dependsOn) {
        if (!ids.has(depId) && !data.tests.some(t => t.id === depId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `依赖的测试用例不存在: ${depId}`,
            path: ['tests', index, 'dependsOn'],
          });
        }
      }
    }
  }
});

export const EnvironmentSchema = z.object({
  name: z.string().min(1, '环境 name 不能为空'),
  description: z.string().optional(),
  baseUrl: z.string().optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  auth: AuthConfigSchema.optional(),
  headers: z.record(z.string()).optional(),
  timeoutMs: z.number().int().positive().optional(),
  retry: RetryConfigSchema.optional(),
});

export type ParsedCollection = z.infer<typeof CollectionSchema>;
export type ParsedEnvironment = z.infer<typeof EnvironmentSchema>;
