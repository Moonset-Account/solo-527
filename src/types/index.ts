export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key' | 'custom';

export type AssertionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'regex'
  | 'exists'
  | 'notExists'
  | 'typeOf'
  | 'in'
  | 'notIn'
  | 'hasLength'
  | 'includes'
  | 'startsWith'
  | 'endsWith';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  addTo?: 'header' | 'query';
  headerPrefix?: string;
  customHeaderName?: string;
  customHeaderValue?: string;
}

export interface Assertion {
  id?: string;
  name: string;
  type: 'status' | 'header' | 'body' | 'time' | 'jsonpath';
  path?: string;
  operator: AssertionOperator;
  expected?: unknown;
  actual?: unknown;
  passed?: boolean;
  message?: string;
  errorLocation?: {
    file?: string;
    line?: number;
    assertionName?: string;
  };
}

export interface RequestDefinition {
  id?: string;
  name: string;
  method: HttpMethod;
  url: string;
  description?: string;
  tags?: string[];
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean>;
  body?: unknown;
  bodyType?: 'json' | 'form' | 'text' | 'xml' | 'multipart';
  auth?: Partial<AuthConfig>;
  assertions?: Assertion[];
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  preRequestScript?: string;
  postResponseScript?: string;
  extract?: Record<string, { path: string; storeIn?: string }>;
  skip?: boolean;
  dependsOn?: string[];
}

export interface Folder {
  id?: string;
  name: string;
  description?: string;
  requests: RequestDefinition[];
  folders?: Folder[];
  auth?: Partial<AuthConfig>;
  headers?: Record<string, string>;
  variables?: Record<string, string>;
}

export interface Collection {
  schema?: string;
  name: string;
  version?: string;
  description?: string;
  baseUrl?: string;
  auth?: AuthConfig;
  headers?: Record<string, string>;
  variables?: Record<string, string>;
  requests: RequestDefinition[];
  folders?: Folder[];
  settings?: CollectionSettings;
}

export interface CollectionSettings {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
}

export interface Environment {
  name: string;
  description?: string;
  baseUrl?: string;
  variables: Record<string, string>;
  auth?: Partial<AuthConfig>;
  headers?: Record<string, string>;
}

export interface TestCase {
  id: string;
  name: string;
  fullName: string;
  folder?: string;
  request: RequestDefinition;
  resolvedUrl: string;
  resolvedHeaders: Record<string, string>;
  resolvedQueryParams: Record<string, string | number | boolean>;
  resolvedBody?: unknown;
  resolvedAuth?: AuthConfig;
  assertions: Assertion[];
  timeout: number;
  retries: number;
  retryDelay: number;
  tags: string[];
  skip: boolean;
  dependsOn: string[];
  file?: string;
  line?: number;
}

export interface HttpResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  size: number;
}

export interface TestCaseResult {
  testCase: TestCase;
  passed: boolean;
  skipped: boolean;
  response?: HttpResponseData;
  assertions: AssertionResult[];
  retries: number;
  duration: number;
  error?: TestError;
  stdout?: string[];
  stderr?: string[];
}

export interface AssertionResult extends Assertion {
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  message: string;
  duration?: number;
  errorLocation?: {
    file?: string;
    line?: number;
    assertionName?: string;
  };
}

export interface TestError {
  type: 'request' | 'assertion' | 'timeout' | 'unknown';
  message: string;
  stack?: string;
  code?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  duration: number;
  startedAt: Date;
  finishedAt: Date;
  successRate: number;
}

export interface TestRunReport {
  collection: {
    name: string;
    version?: string;
  };
  environment?: {
    name: string;
  };
  summary: TestRunSummary;
  results: TestCaseResult[];
  cliOptions: CLIOptions;
}

export interface LogLevel {
  level: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}

export interface CLIOptions {
  collection?: string;
  env?: string;
  parallel?: number;
  junit?: string;
  logLevel: LogLevel['level'];
  verbose: boolean;
  silent: boolean;
  dryRun: boolean;
  bail: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  filter?: string;
  tags?: string[];
  excludeTags?: string[];
  noColor: boolean;
  output?: string;
  reportFormat?: 'console' | 'json' | 'junit' | 'all';
  version: boolean;
  help: boolean;
  globals?: Record<string, string>;
  config?: string;
  failOnZeroTests: boolean;
  insecure: boolean;
  followRedirects: boolean;
  strictVariables: boolean;
}

export type OutputFormat = 'json' | 'junit' | 'html';
