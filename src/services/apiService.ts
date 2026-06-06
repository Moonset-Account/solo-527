import {
  ApiResponse,
  AggregatedResult,
  FilterDimensions,
  DateRange,
  RawEvent,
  QueueTask,
  TaskType,
  CacheStats,
  DataCapabilityDefinition,
} from '../types';

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const wrapResponse = <T>(data: T, success = true): ApiResponse<T> => ({
  success,
  data,
  requestId: generateRequestId(),
  timestamp: new Date().toISOString(),
});



export const DATA_CAPABILITIES: DataCapabilityDefinition[] = [
  {
    id: 'events.query',
    name: '原始事件查询',
    description: '查询和过滤原始用户行为事件数据',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/v1/events', description: '分页查询原始事件', params: ['filters', 'dateRange', 'page', 'pageSize'], returns: 'PaginatedResponse<RawEvent>' },
      { method: 'POST', path: '/api/v1/events/export', description: '导出原始事件', params: ['filters', 'dateRange', 'format'], returns: 'ExportTask' },
    ],
    cacheTTL: 300000,
    rateLimit: { requests: 100, window: '1m' },
  },
  {
    id: 'aggregation.query',
    name: '聚合分析查询',
    description: '多维度聚合分析，生成漏斗、Cohort、功能热度、路径分析、流失原因',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/v1/aggregation/query', description: '执行聚合查询', params: ['filters', 'dateRange'], returns: 'AggregatedResult' },
      { method: 'GET', path: '/api/v1/aggregation/:queryId', description: '获取缓存的聚合结果', params: ['queryId'], returns: 'AggregatedResult' },
    ],
    cacheTTL: 300000,
    rateLimit: { requests: 50, window: '1m' },
  },
  {
    id: 'etl.pipeline',
    name: 'ETL 数据管道',
    description: '数据抽取、清洗、转换、加载的完整管道管理',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/v1/etl/run', description: '触发 ETL 任务', params: ['source', 'mode'], returns: 'ETLTask' },
      { method: 'GET', path: '/api/v1/etl/:taskId', description: '查询 ETL 任务状态', params: ['taskId'], returns: 'ETLTask' },
      { method: 'GET', path: '/api/v1/etl/pipelines', description: '列出所有 ETL 管道', returns: 'ETLPipelineStage[]' },
    ],
    cacheTTL: 0,
    rateLimit: { requests: 10, window: '5m' },
  },
  {
    id: 'export.service',
    name: '文件导出服务',
    description: '异步导出 CSV、Excel、PDF 格式报告',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/v1/export', description: '创建导出任务', params: ['queryId', 'format', 'filters', 'dateRange'], returns: 'ExportTask' },
      { method: 'GET', path: '/api/v1/export/:taskId', description: '查询导出任务状态', params: ['taskId'], returns: 'ExportTask' },
      { method: 'GET', path: '/api/v1/export/:taskId/download', description: '下载导出文件', params: ['taskId'], returns: 'Blob' },
      { method: 'GET', path: '/api/v1/export/tasks', description: '列出导出任务历史', returns: 'ExportTask[]' },
    ],
    cacheTTL: 0,
    rateLimit: { requests: 20, window: '1m' },
  },
  {
    id: 'cache.manager',
    name: '缓存管理',
    description: '查询和管理数据缓存',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/v1/cache/stats', description: '获取缓存统计', returns: 'CacheStats' },
      { method: 'POST', path: '/api/v1/cache/clear', description: '清除缓存', params: ['pattern'] },
      { method: 'GET', path: '/api/v1/cache/keys', description: '列出缓存键', returns: 'string[]' },
    ],
    cacheTTL: 0,
    rateLimit: { requests: 30, window: '1m' },
  },
];

class ApiService {
  private baseUrl = '/api/v1';

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    await delay(300 + Math.random() * 500);
    console.log(`[API] ${method} ${this.baseUrl}${endpoint}`, body || '');
    return wrapResponse({} as T);
  }

  async listCapabilities(): Promise<ApiResponse<DataCapabilityDefinition[]>> {
    await delay(200);
    return wrapResponse(DATA_CAPABILITIES);
  }

  async queryEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(500);
    return this.request('GET', `/events?page=${page}&pageSize=${pageSize}`, { filters, dateRange });
  }

  async queryAggregation(
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<ApiResponse<AggregatedResult>> {
    await delay(800 + Math.random() * 1000);
    return this.request('POST', '/aggregation/query', { filters, dateRange });
  }

  async getAggregationResult(queryId: string): Promise<ApiResponse<AggregatedResult>> {
    await delay(200);
    return this.request('GET', `/aggregation/${queryId}`);
  }

  async runETL(source = 'events_db', mode: 'full' | 'incremental' = 'incremental'): Promise<ApiResponse<QueueTask>> {
    await delay(300);
    return this.request('POST', '/etl/run', { source, mode });
  }

  async getETLStatus(taskId: string): Promise<ApiResponse<QueueTask>> {
    await delay(200);
    return this.request('GET', `/etl/${taskId}`);
  }

  async createExport(
    queryId: string,
    format: 'csv' | 'xlsx' | 'pdf',
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<ApiResponse<QueueTask>> {
    await delay(400);
    return this.request('POST', '/export', { queryId, format, filters, dateRange });
  }

  async getExportStatus(taskId: string): Promise<ApiResponse<QueueTask>> {
    await delay(200);
    return this.request('GET', `/export/${taskId}`);
  }

  async downloadExport(_taskId: string): Promise<Blob> {
    await delay(500);
    return new Blob();
  }

  async listTasks(type?: TaskType, _status?: string): Promise<ApiResponse<QueueTask[]>> {
    await delay(300);
    return this.request('GET', `/tasks${type ? `?type=${type}` : ''}`);
  }

  async cancelTask(taskId: string): Promise<ApiResponse<boolean>> {
    await delay(200);
    return this.request('POST', `/tasks/${taskId}/cancel`);
  }

  async getCacheStats(): Promise<ApiResponse<CacheStats>> {
    await delay(150);
    return this.request('GET', '/cache/stats');
  }

  async clearCache(pattern?: string): Promise<ApiResponse<{ cleared: number }>> {
    await delay(300);
    return this.request('POST', '/cache/clear', { pattern });
  }
}

export const apiService = new ApiService();
