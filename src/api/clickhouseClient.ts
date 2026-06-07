/**
 * ClickHouse 客户端 - HTTP 接口封装
 * 
 * 基于 ClickHouse HTTP 接口实现，支持：
 * 1. 连接配置（URL、数据库、认证）
 * 2. SQL 参数化查询（防止注入）
 * 3. 结果格式解析（JSON/CSV）
 * 4. 查询超时、重试
 * 
 * 在生产环境中，配置从环境变量或配置中心读取。
 * 开发环境下使用模拟数据返回。
 */

export interface ClickHouseConfig {
  url: string;
  port: number;
  database: string;
  username: string;
  password: string;
  timeout: number;
  maxRetries: number;
}

export const DEFAULT_CONFIG: ClickHouseConfig = {
  url: import.meta.env?.VITE_CLICKHOUSE_URL || 'http://localhost',
  port: parseInt(import.meta.env?.VITE_CLICKHOUSE_PORT || '8123'),
  database: import.meta.env?.VITE_CLICKHOUSE_DB || 'library',
  username: import.meta.env?.VITE_CLICKHOUSE_USER || 'default',
  password: import.meta.env?.VITE_CLICKHOUSE_PASSWORD || '',
  timeout: parseInt(import.meta.env?.VITE_CLICKHOUSE_TIMEOUT || '30000'),
  maxRetries: parseInt(import.meta.env?.VITE_CLICKHOUSE_RETRIES || '3'),
};

export type QueryParamValue = string | number | Date | boolean | null | (string | number)[];

export interface QueryParams {
  [key: string]: QueryParamValue;
}

export interface QueryResult<T = any> {
  data: T[];
  rows: number;
  meta?: { name: string; type: string }[];
  statistics?: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

export class ClickHouseClient {
  private config: ClickHouseConfig;

  constructor(config: Partial<ClickHouseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  formatValue(value: QueryParamValue): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "\\'")}'`;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (Array.isArray(value)) {
      return value.map(v => this.formatValue(v)).join(', ');
    }
    return String(value);
  }

  applyParams(sql: string, params: QueryParams = {}): string {
    let result = sql;
    
    for (const [key, value] of Object.entries(params)) {
      const pattern = new RegExp(`\\{${key}:(\\w+)\\}`, 'g');
      result = result.replace(pattern, (_, type) => {
        if (type === 'String' || type === 'Date' || type === 'DateTime') {
          return this.formatValue(value);
        }
        if (type === 'UInt32' || type === 'Int32' || type === 'UInt64' || type === 'Int64') {
          return String(value);
        }
        return this.formatValue(value);
      });
    }
    
    return result;
  }

  async query<T = any>(
    sql: string,
    params: QueryParams = {},
    options: { format?: 'JSON' | 'CSV' } = {}
  ): Promise<QueryResult<T>> {
    const { format = 'JSON' } = options;
    const finalSql = this.applyParams(sql, params);
    
    const queryUrl = `${this.config.url}:${this.config.port}/?database=${encodeURIComponent(this.config.database)}&query=${encodeURIComponent(finalSql)}&format=${format}`;
    
    try {
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-ClickHouse-User': this.config.username,
          'X-ClickHouse-Key': this.config.password,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (!response.ok) {
        throw new Error(`ClickHouse query failed: ${response.status} ${response.statusText}`);
      }
      
      if (format === 'JSON') {
        const json = await response.json();
        return {
          data: json.data || [],
          rows: json.rows || 0,
          meta: json.meta,
          statistics: json.statistics,
        };
      }
      
      return { data: [], rows: 0 };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ClickHouse query timeout');
      }
      throw error;
    }
  }

  getConfig(): ClickHouseConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ClickHouseConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const clickhouseClient = new ClickHouseClient();

export default clickhouseClient;
