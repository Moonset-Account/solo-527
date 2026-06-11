export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2';

export interface BearerAuth {
  type: 'bearer';
  token: string;
  headerName?: string;
}

export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

export interface ApiKeyAuth {
  type: 'apiKey';
  key: string;
  value: string;
  in: 'header' | 'query';
}

export interface OAuth2Auth {
  type: 'oauth2';
  accessToken: string;
  headerName?: string;
  tokenType?: string;
}

export type AuthConfig = BearerAuth | BasicAuth | ApiKeyAuth | OAuth2Auth | { type: 'none' };

export type AssertionType =
  | 'statusCode'
  | 'statusCodeRange'
  | 'header'
  | 'headerExists'
  | 'bodyJsonPath'
  | 'bodyContains'
  | 'bodyRegex'
  | 'responseTime'
  | 'jsonSchema'
  | 'contentType';

export interface StatusCodeAssertion {
  type: 'statusCode';
  value: number;
}

export interface StatusCodeRangeAssertion {
  type: 'statusCodeRange';
  min: number;
  max: number;
}

export interface HeaderAssertion {
  type: 'header';
  name: string;
  value: string;
  caseInsensitive?: boolean;
}

export interface HeaderExistsAssertion {
  type: 'headerExists';
  name: string;
}

export interface BodyJsonPathAssertion {
  type: 'bodyJsonPath';
  path: string;
  value: unknown;
  strict?: boolean;
}

export interface BodyContainsAssertion {
  type: 'bodyContains';
  value: string;
}

export interface BodyRegexAssertion {
  type: 'bodyRegex';
  pattern: string;
  flags?: string;
}

export interface ResponseTimeAssertion {
  type: 'responseTime';
  maxMs: number;
}

export interface JsonSchemaAssertion {
  type: 'jsonSchema';
  schema: Record<string, unknown>;
}

export interface ContentTypeAssertion {
  type: 'contentType';
  value: string;
}

export type Assertion =
  | StatusCodeAssertion
  | StatusCodeRangeAssertion
  | HeaderAssertion
  | HeaderExistsAssertion
  | BodyJsonPathAssertion
  | BodyContainsAssertion
  | BodyRegexAssertion
  | ResponseTimeAssertion
  | JsonSchemaAssertion
  | ContentTypeAssertion;

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryOnStatus?: number[];
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
  body?: unknown;
  auth?: AuthConfig;
  assertions: Assertion[];
  timeoutMs?: number;
  retry?: Partial<RetryConfig>;
  tags?: string[];
  dependsOn?: string[];
  extract?: Record<string, string>;
  skip?: boolean;
}

export interface Collection {
  name: string;
  version: string;
  description?: string;
  baseUrl?: string;
  auth?: AuthConfig;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: Partial<RetryConfig>;
  tests: TestCase[];
}

export interface Environment {
  name: string;
  description?: string;
  baseUrl?: string;
  variables: Record<string, string | number | boolean>;
  auth?: AuthConfig;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retry?: Partial<RetryConfig>;
}

export interface AssertionResult {
  type: AssertionType;
  passed: boolean;
  message: string;
  expected?: unknown;
  actual?: unknown;
  suggestion?: string;
}

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface AttemptResult {
  attempt: number;
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
  assertionResults: AssertionResult[];
}

export interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  tags?: string[];
  totalAttempts: number;
  responseTimeMs: number;
  statusCode?: number;
  error?: {
    type: string;
    message: string;
    suggestion?: string;
  };
  assertionResults: AssertionResult[];
  failedAssertions: AssertionResult[];
  attempts: AttemptResult[];
  extractedVars?: Record<string, string>;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  totalTimeMs: number;
  startedAt: string;
  finishedAt: string;
}

export interface RunReport {
  collectionName: string;
  collectionVersion: string;
  environment?: string;
  summary: RunSummary;
  results: TestResult[];
  cliVersion: string;
  config: {
    parallel: number;
    retryMaxAttempts: number;
    timeoutMs: number;
  };
}

export interface CliArgs {
  collection: string;
  env?: string;
  parallel: number;
  retry: number;
  timeout?: number;
  json: boolean;
  junit?: string;
  output?: string;
  dryRun: boolean;
  verbose: boolean;
  tags?: string[];
  filter?: string;
  failFast: boolean;
  delay?: number;
  color: boolean;
  report?: string;
  version?: boolean;
}

export const EXIT_CODES = {
  SUCCESS: 0,
  TEST_FAILURE: 1,
  CONFIG_ERROR: 2,
  RUNTIME_ERROR: 3,
  INTERRUPTED: 130,
} as const;

export type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];
