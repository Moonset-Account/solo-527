import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { AuthConfig, HttpResponseData, TestCase } from '../types';
import { logger } from '../utils/logger';
import { RequestError } from '../utils/errors';

export interface ExecuteOptions {
  timeout?: number;
  insecure?: boolean;
  followRedirects?: boolean;
}

export class AuthApplier {
  static apply(config: AxiosRequestConfig, auth: AuthConfig): void {
    switch (auth.type) {
      case 'bearer':
        if (!auth.token) {
          throw new RequestError('Bearer token 未配置', {
            code: 'MISSING_BEARER_TOKEN',
            suggestions: [
              '在 collection.auth 中设置 token',
              '在 environment.auth 中设置 token',
              '使用环境变量配置: {{env.BEARER_TOKEN}}',
            ],
          });
        }
        config.headers = config.headers || {};
        const prefix = auth.headerPrefix || 'Bearer';
        config.headers['Authorization'] = `${prefix} ${auth.token}`;
        break;

      case 'basic':
        if (!auth.username || !auth.password) {
          throw new RequestError('Basic 认证需要 username 和 password', {
            code: 'MISSING_BASIC_CREDENTIALS',
            suggestions: ['在 auth 配置中设置 username 和 password'],
          });
        }
        config.headers = config.headers || {};
        const basicToken = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${basicToken}`;
        break;

      case 'api-key':
        if (!auth.apiKeyName || !auth.apiKeyValue) {
          throw new RequestError('API Key 认证需要 apiKeyName 和 apiKeyValue', {
            code: 'MISSING_API_KEY',
            suggestions: ['在 auth 配置中设置 apiKeyName 和 apiKeyValue'],
          });
        }
        if (auth.addTo === 'query') {
          config.params = config.params || {};
          config.params[auth.apiKeyName] = auth.apiKeyValue;
        } else {
          config.headers = config.headers || {};
          config.headers[auth.apiKeyName] = auth.apiKeyValue;
        }
        break;

      case 'custom':
        if (!auth.customHeaderName || !auth.customHeaderValue) {
          throw new RequestError('自定义认证需要 customHeaderName 和 customHeaderValue', {
            code: 'MISSING_CUSTOM_AUTH',
            suggestions: ['在 auth 配置中设置 customHeaderName 和 customHeaderValue'],
          });
        }
        config.headers = config.headers || {};
        config.headers[auth.customHeaderName] = auth.customHeaderValue;
        break;

      case 'none':
      default:
        break;
    }
  }
}

export class RequestExecutor {
  private client: AxiosInstance;
  private options: ExecuteOptions;

  constructor(options: ExecuteOptions = {}) {
    this.options = options;
    this.client = axios.create({
      timeout: options.timeout || 30000,
      maxRedirects: options.followRedirects !== false ? 5 : 0,
      validateStatus: () => true,
    });
  }

  updateOptions(options: Partial<ExecuteOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.timeout) {
      this.client.defaults.timeout = options.timeout;
    }
  }

  private buildAxiosConfig(testCase: TestCase): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      method: testCase.request.method.toLowerCase() as AxiosRequestConfig['method'],
      url: testCase.resolvedUrl,
      headers: { ...testCase.resolvedHeaders },
      params: { ...testCase.resolvedQueryParams },
      timeout: testCase.timeout || this.options.timeout || 30000,
    };

    if (this.options.insecure) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    if (testCase.resolvedBody !== undefined && testCase.resolvedBody !== null) {
      const bodyType = testCase.request.bodyType || 'json';
      if (bodyType === 'json' && typeof testCase.resolvedBody === 'object') {
        config.data = testCase.resolvedBody;
        if (!config.headers!['Content-Type']) {
          config.headers!['Content-Type'] = 'application/json';
        }
      } else if (bodyType === 'form') {
        const params = new URLSearchParams();
        const body = testCase.resolvedBody as Record<string, string>;
        for (const [k, v] of Object.entries(body)) {
          params.append(k, String(v));
        }
        config.data = params;
        if (!config.headers!['Content-Type']) {
          config.headers!['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      } else if (bodyType === 'text') {
        config.data = String(testCase.resolvedBody);
        if (!config.headers!['Content-Type']) {
          config.headers!['Content-Type'] = 'text/plain';
        }
      } else if (bodyType === 'xml') {
        config.data = String(testCase.resolvedBody);
        if (!config.headers!['Content-Type']) {
          config.headers!['Content-Type'] = 'application/xml';
        }
      } else {
        config.data = testCase.resolvedBody;
      }
    }

    if (testCase.resolvedAuth && testCase.resolvedAuth.type !== 'none') {
      AuthApplier.apply(config, testCase.resolvedAuth);
    }

    return config;
  }

  async execute(testCase: TestCase): Promise<{ response: HttpResponseData; retries: number }> {
    const maxRetries = testCase.retries;
    const retryDelay = testCase.retryDelay;

    let lastError: Error | null = null;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attemptCount = attempt + 1;
      try {
        logger.verbose(`执行请求 [${testCase.name}] 第 ${attemptCount} 次尝试`);
        const config = this.buildAxiosConfig(testCase);

        const startTime = Date.now();
        let axiosResponse: AxiosResponse;

        try {
          axiosResponse = await this.client.request(config);
        } catch (axiosErr) {
          const err = axiosErr as AxiosError;
          if (err.response) {
            axiosResponse = err.response;
          } else {
            throw err;
          }
        }

        const responseTime = Date.now() - startTime;

        const responseHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(axiosResponse.headers || {})) {
          responseHeaders[key.toLowerCase()] = String(value);
        }

        const data = axiosResponse.data;
        let size = 0;
        try {
          size = typeof data === 'string'
            ? Buffer.byteLength(data, 'utf8')
            : Buffer.byteLength(JSON.stringify(data || ''), 'utf8');
        } catch {
          size = 0;
        }

        const responseData: HttpResponseData = {
          status: axiosResponse.status,
          statusText: axiosResponse.statusText,
          headers: responseHeaders,
          data,
          responseTime,
          size,
        };

        logger.debug(`请求 [${testCase.name}] 完成: HTTP ${axiosResponse.status} (${responseTime}ms)`);
        return { response: responseData, retries: attempt };

      } catch (err) {
        lastError = err as Error;
        const isTimeout = (err as AxiosError).code === 'ECONNABORTED' || (err as Error).message.includes('timeout');
        const isNetwork = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes((err as AxiosError).code || '');

        if (attempt < maxRetries && (isTimeout || isNetwork)) {
          logger.warn(`请求 [${testCase.name}] 失败 (${err instanceof Error ? err.message : String(err)}), ${retryDelay}ms 后重试...`);
          await new Promise(r => setTimeout(r, retryDelay));
          continue;
        }

        if (attempt < maxRetries) {
          logger.verbose(`请求 [${testCase.name}] 非网络类错误，不重试: ${err instanceof Error ? err.message : String(err)}`);
          break;
        }
      }
    }

    const errMsg = lastError ? lastError.message : '未知错误';
    throw new RequestError(`请求 [${testCase.name}] 执行失败: ${errMsg} (已重试 ${maxRetries} 次)`, {
      code: 'REQUEST_FAILED',
      cause: lastError || undefined,
      suggestions: [
        '检查目标服务是否正常运行',
        '验证网络连接和防火墙配置',
        '增加 timeout 时间 (当前: ' + (testCase.timeout || this.options.timeout || 30000) + 'ms)',
        '增加 retries 次数 (当前: ' + maxRetries + ')',
      ],
    });
  }
}
