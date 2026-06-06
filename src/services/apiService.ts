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
import { eventRepository } from './eventRepository';
import { etlEngine } from './etlEngine';
import { taskQueue } from './taskQueue';
import { generateStandardExcel, generateStandardPDF, generateCSV } from './exportService';

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
    description: '查询和过滤原始用户行为事件数据，支持按事件类型、用户、团队、渠道等多维度筛选',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/v1/events', description: '分页查询原始事件', params: ['filters', 'dateRange', 'page', 'pageSize', 'eventTypes'], returns: 'PaginatedResponse<RawEvent>' },
      { method: 'GET', path: '/api/v1/events/register', description: '查询注册事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
      { method: 'GET', path: '/api/v1/events/activate', description: '查询激活事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
      { method: 'GET', path: '/api/v1/events/invite', description: '查询邀请事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
      { method: 'GET', path: '/api/v1/events/first_pay', description: '查询首次付费事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
      { method: 'GET', path: '/api/v1/events/feature_use', description: '查询功能使用事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
      { method: 'GET', path: '/api/v1/events/churn', description: '查询流失事件', params: ['filters', 'dateRange'], returns: 'RawEvent[]' },
    ],
    cacheTTL: 300000,
    rateLimit: { requests: 100, window: '1m' },
  },
  {
    id: 'aggregation.query',
    name: '聚合分析查询',
    description: '多维度聚合分析，一次性生成漏斗、Cohort、功能热度、路径分析、流失原因五大视图',
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
    description: '数据抽取、清洗、转换、加载的完整管道管理，支持全量和增量模式',
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
    description: '异步导出 CSV、Excel、PDF 格式报告，支持任务查询和文件下载',
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
    description: '查询和管理数据缓存，支持按模式清除缓存',
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

const aggregationCache = new Map<string, { data: AggregatedResult; timestamp: number }>();
const AGGREGATION_CACHE_TTL = 5 * 60 * 1000;

const generateCacheKey = (filters: FilterDimensions, dateRange: DateRange): string => {
  return [
    dateRange.start,
    dateRange.end,
    filters.users.sort().join(','),
    filters.teams.sort().join(','),
    filters.channels.sort().join(','),
    filters.versions.sort().join(','),
    filters.modules.sort().join(','),
    filters.trafficType,
  ].join('|');
};

class ApiService {

  async listCapabilities(): Promise<ApiResponse<DataCapabilityDefinition[]>> {
    await delay(150);
    return wrapResponse(DATA_CAPABILITIES);
  }

  async queryEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100,
    eventTypes?: RawEvent['eventType'][]
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(300);
    const { events, total } = await eventRepository.query({
      filters,
      dateRange,
      eventTypes,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getRegisterEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getRegisterEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getActivateEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getActivateEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getInviteEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getInviteEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getFirstPayEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getFirstPayEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getFeatureUseEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getFeatureUseEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async getChurnEvents(
    filters: FilterDimensions,
    dateRange: DateRange,
    page = 1,
    pageSize = 100
  ): Promise<ApiResponse<{ items: RawEvent[]; total: number; page: number; pageSize: number }>> {
    await delay(250);
    const { events, total } = await eventRepository.getChurnEvents({
      filters,
      dateRange,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return wrapResponse({ items: events, total, page, pageSize });
  }

  async queryAggregation(
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<ApiResponse<AggregatedResult>> {
    await delay(500);
    
    const cacheKey = generateCacheKey(filters, dateRange);
    const cached = aggregationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < AGGREGATION_CACHE_TTL) {
      console.log(`[API] 聚合查询命中缓存: ${cacheKey}`);
      return wrapResponse(cached.data);
    }

    console.log(`[API] 执行聚合查询: ${cacheKey}`);
    const { result } = await etlEngine.runFullPipeline(filters, dateRange);
    
    aggregationCache.set(cacheKey, { data: result, timestamp: Date.now() });
    if (aggregationCache.size > 50) {
      const oldestKey = aggregationCache.keys().next().value;
      if (oldestKey) aggregationCache.delete(oldestKey);
    }

    return wrapResponse(result);
  }

  async getAggregationResult(queryId: string): Promise<ApiResponse<AggregatedResult | null>> {
    await delay(200);
    
    for (const { data } of aggregationCache.values()) {
      if (data.queryId === queryId) {
        return wrapResponse(data);
      }
    }
    return wrapResponse(null);
  }

  async runETL(
    filters: FilterDimensions,
    dateRange: DateRange,
    source = 'events_db',
    mode: 'full' | 'incremental' = 'incremental'
  ): Promise<ApiResponse<QueueTask>> {
    await delay(300);
    
    const task = taskQueue.createTask(
      'etl',
      `ETL ${mode === 'full' ? '全量' : '增量'}同步`,
      { filters, dateRange, source, mode },
      'high'
    );

    eventRepository.clearCache();
    aggregationCache.clear();

    return wrapResponse(task);
  }

  async getETLStatus(taskId: string): Promise<ApiResponse<QueueTask | undefined>> {
    await delay(200);
    const task = taskQueue.getTask(taskId);
    return wrapResponse(task);
  }

  async createExport(
    queryId: string,
    format: 'csv' | 'xlsx' | 'pdf',
    filters: FilterDimensions,
    dateRange: DateRange
  ): Promise<ApiResponse<QueueTask>> {
    await delay(300);

    const cacheKey = generateCacheKey(filters, dateRange);
    let aggregatedResult: AggregatedResult | undefined;

    for (const { data } of aggregationCache.values()) {
      if (data.queryId === queryId || generateCacheKey(data.filters, data.dateRange) === cacheKey) {
        aggregatedResult = data;
        break;
      }
    }

    if (!aggregatedResult) {
      const { result } = await etlEngine.runFullPipeline(filters, dateRange);
      aggregatedResult = result;
      aggregationCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    const taskType = `export_${format}` as TaskType;
    const formatNames = { csv: 'CSV', xlsx: 'Excel', pdf: 'PDF' };
    
    const task = taskQueue.createTask(
      taskType,
      `导出 ${formatNames[format]} 报告`,
      { queryId, aggregatedResult, filters, dateRange },
      'medium'
    );

    return wrapResponse(task);
  }

  async getExportStatus(taskId: string): Promise<ApiResponse<QueueTask | undefined>> {
    await delay(200);
    const task = taskQueue.getTask(taskId);
    return wrapResponse(task);
  }

  async downloadExport(taskId: string): Promise<Blob> {
    await delay(400);
    const task = taskQueue.getTask(taskId);
    
    if (!task || task.status !== 'completed') {
      throw new Error('导出任务未完成或不存在');
    }

    const result = (task as any).result;
    if (result?.blob) {
      return result.blob;
    }

    const metadata = (task as any).metadata;
    if (metadata?.aggregatedResult) {
      const { aggregatedResult, filters, dateRange } = metadata;
      const format = (task.type as string).replace('export_', '');
      
      switch (format) {
        case 'xlsx':
          return generateStandardExcel(aggregatedResult, filters, dateRange);
        case 'pdf':
          return generateStandardPDF(aggregatedResult, filters, dateRange);
        case 'csv':
        default:
          return generateCSV(aggregatedResult, filters, dateRange);
      }
    }

    return new Blob();
  }

  async listTasks(type?: TaskType, status?: string): Promise<ApiResponse<QueueTask[]>> {
    await delay(200);
    let tasks = taskQueue.getTasks();
    
    if (type) {
      tasks = tasks.filter(t => (t as any).type === type);
    }
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    
    return wrapResponse(tasks);
  }

  async cancelTask(taskId: string): Promise<ApiResponse<boolean>> {
    await delay(200);
    const success = taskQueue.cancelTask(taskId);
    return wrapResponse(success);
  }

  async retryTask(taskId: string): Promise<ApiResponse<boolean>> {
    await delay(200);
    const success = taskQueue.retryTask(taskId);
    return wrapResponse(success);
  }

  async clearCompletedTasks(): Promise<ApiResponse<{ cleared: number }>> {
    await delay(200);
    const cleared = taskQueue.clearCompleted();
    return wrapResponse({ cleared });
  }

  async getCacheStats(): Promise<ApiResponse<CacheStats>> {
    await delay(150);
    
    let hits = 0;
    let misses = 0;
    const stored = localStorage.getItem('cache_stats');
    if (stored) {
      const stats = JSON.parse(stored);
      hits = stats.hits || 0;
      misses = stats.misses || 0;
    }

    const stats: CacheStats = {
      size: aggregationCache.size,
      hits,
      misses,
      hitRate: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 10000) / 100 : 0,
    };
    
    return wrapResponse(stats);
  }

  async clearCache(pattern?: string): Promise<ApiResponse<{ cleared: number }>> {
    await delay(300);
    
    let cleared = 0;
    if (pattern) {
      for (const key of aggregationCache.keys()) {
        if (key.includes(pattern)) {
          aggregationCache.delete(key);
          cleared++;
        }
      }
    } else {
      cleared = aggregationCache.size;
      aggregationCache.clear();
      eventRepository.clearCache();
    }

    localStorage.removeItem('cache_stats');
    return wrapResponse({ cleared });
  }

  async listCacheKeys(): Promise<ApiResponse<string[]>> {
    await delay(200);
    return wrapResponse([...aggregationCache.keys()]);
  }
}

export const apiService = new ApiService();
