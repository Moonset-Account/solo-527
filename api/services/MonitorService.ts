import { db, mapApiCallLog, DbApiCallLogRow } from '../db/database.js';
import type { ApiCallLog } from '#shared/types';

export interface LogStats {
  totalCalls: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  successCount: number;
  errorCount: number;
  perEndpoint: Record<string, { count: number; avgLatencyMs: number; errorCount: number }>;
  perModel: Record<string, { count: number; tokens: number }>;
  perHour: Record<string, number>;
  recent: ApiCallLog[];
}

export class MonitorService {
  queryLogs(params?: {
    from?: string;
    to?: string;
    endpoint?: string;
    statusCode?: number;
    userId?: string;
    limit?: number;
  }): ApiCallLog[] {
    let sql = 'SELECT * FROM api_call_logs WHERE 1=1';
    const bind: unknown[] = [];

    if (params?.from) {
      sql += ' AND timestamp >= ?';
      bind.push(params.from);
    }
    if (params?.to) {
      sql += ' AND timestamp <= ?';
      bind.push(params.to);
    }
    if (params?.endpoint) {
      sql += ' AND endpoint = ?';
      bind.push(params.endpoint);
    }
    if (params?.statusCode !== undefined) {
      sql += ' AND status_code = ?';
      bind.push(params.statusCode);
    }
    if (params?.userId) {
      sql += ' AND user_id = ?';
      bind.push(params.userId);
    }

    sql += ' ORDER BY timestamp DESC';
    const limit = params?.limit ?? 200;
    sql += ` LIMIT ${Number(limit)}`;

    const rows = db.prepare(sql).all(...bind) as DbApiCallLogRow[];
    return rows.map(mapApiCallLog);
  }

  getStats(params?: { from?: string; to?: string }): LogStats {
    const logs = this.queryLogs({ ...params, limit: 10000 });

    const stats: LogStats = {
      totalCalls: logs.length,
      totalLatencyMs: 0,
      avgLatencyMs: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      successCount: 0,
      errorCount: 0,
      perEndpoint: {},
      perModel: {},
      perHour: {},
      recent: logs.slice(0, 50),
    };

    for (const log of logs) {
      stats.totalLatencyMs += log.latencyMs;
      stats.totalPromptTokens += log.promptTokens;
      stats.totalCompletionTokens += log.completionTokens;
      stats.totalTokens += log.totalTokens;

      if (log.statusCode >= 200 && log.statusCode < 400) {
        stats.successCount++;
      } else {
        stats.errorCount++;
      }

      if (!stats.perEndpoint[log.endpoint]) {
        stats.perEndpoint[log.endpoint] = { count: 0, avgLatencyMs: 0, errorCount: 0 };
      }
      const ep = stats.perEndpoint[log.endpoint];
      ep.count++;
      ep.avgLatencyMs = ((ep.avgLatencyMs * (ep.count - 1)) + log.latencyMs) / ep.count;
      if (log.statusCode >= 400) ep.errorCount++;

      if (!stats.perModel[log.model]) {
        stats.perModel[log.model] = { count: 0, tokens: 0 };
      }
      stats.perModel[log.model].count++;
      stats.perModel[log.model].tokens += log.totalTokens;

      const hourKey = log.timestamp.slice(0, 13) + ':00:00';
      stats.perHour[hourKey] = (stats.perHour[hourKey] ?? 0) + 1;
    }

    stats.avgLatencyMs = logs.length > 0 ? stats.totalLatencyMs / logs.length : 0;
    return stats;
  }
}

export default new MonitorService();
