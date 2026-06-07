import { Router, type Request, type Response } from 'express';
import type { ExportTask, ExportFormat, FilterParams } from '../../shared/types.js';
import { getFilteredConsultationIds, getFunnelAggregation, getChannelQualityAggregation, getConsultantLoadAggregation, getFollowUpTrendAggregation, getAnomaliesAggregation } from '../data/aggregations.js';
import { buildCacheKey } from '../data/redisCache.js';

const router = Router();

const exportTasks = new Map<string, ExportTask>();

function randomId(): string {
  return `export_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function generateExportData(viewType: string, filters: FilterParams): Promise<string> {
  const params: FilterParams = {
    projectIds: filters.projectIds,
    consultantIds: filters.consultantIds,
    channelIds: filters.channelIds,
    customerStage: filters.customerStage,
    months: filters.months,
  };
  const customerStage = filters.customerStage;
  const consultationIds = await getFilteredConsultationIds(params, customerStage);

  switch (viewType) {
    case 'funnel': {
      const cacheKey = buildCacheKey('funnel_export', { ids: consultationIds.length, ...params, customerStage });
      const agg = await getFunnelAggregation(consultationIds, cacheKey);
      const headers = ['阶段', '数量', '转化率'];
      const rows = [
        ['咨询', String(agg.totalConsultations), '100%'],
        ['预约', String(agg.totalAppointments), agg.totalConsultations > 0 ? `${((agg.totalAppointments / agg.totalConsultations) * 100).toFixed(1)}%` : '0%'],
        ['到店', String(agg.totalVisits), agg.totalAppointments > 0 ? `${((agg.totalVisits / agg.totalAppointments) * 100).toFixed(1)}%` : '0%'],
        ['方案', String(agg.totalPlans), agg.totalVisits > 0 ? `${((agg.totalPlans / agg.totalVisits) * 100).toFixed(1)}%` : '0%'],
        ['付款', String(agg.totalPayments), agg.totalPlans > 0 ? `${((agg.totalPayments / agg.totalPlans) * 100).toFixed(1)}%` : '0%'],
        ['复诊', String(agg.totalFollowUps), agg.totalPayments > 0 ? `${((agg.totalFollowUps / agg.totalPayments) * 100).toFixed(1)}%` : '0%'],
      ];
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    case 'channel': {
      const cacheKey = buildCacheKey('channel_export', { ids: consultationIds.length, ...params, customerStage });
      const channels = await getChannelQualityAggregation(consultationIds, cacheKey);
      const headers = ['排名', '渠道', '转化率', '到店率', '成单率'];
      const rows = channels.map((ch) => [String(ch.rank), ch.name, `${ch.conversionRate.toFixed(1)}%`, `${ch.visitRate.toFixed(1)}%`, `${ch.dealRate.toFixed(1)}%`]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    case 'consultant': {
      const cacheKey = buildCacheKey('consultant_export', { ids: consultationIds.length, ...params, customerStage });
      const consultants = await getConsultantLoadAggregation(consultationIds, cacheKey);
      const headers = ['顾问', '客户数', '转化率', '潜客', '已预约', '已到店', '已方案', '已付款', '已复诊'];
      const rows = consultants.map((co) => [
        co.name, String(co.totalCustomers), `${(co.conversionRate * 100).toFixed(1)}%`,
        String(co.stageDistribution.lead ?? 0), String(co.stageDistribution.appointed ?? 0),
        String(co.stageDistribution.visited ?? 0), String(co.stageDistribution.planned ?? 0),
        String(co.stageDistribution.paid ?? 0), String(co.stageDistribution.followed_up ?? 0),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    case 'follow-up': {
      const cacheKey = buildCacheKey('followup_export', { ids: consultationIds.length, ...params, customerStage });
      const trend = await getFollowUpTrendAggregation(consultationIds, cacheKey);
      const headers = ['月份', '复诊率', '平均间隔天数'];
      const rows = trend.monthly.map((m) => [m.month, `${(m.followUpRate * 100).toFixed(1)}%`, String(m.avgIntervalDays)]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    case 'anomalies': {
      const anomalies = await getAnomaliesAggregation(consultationIds, params, customerStage);
      const headers = ['级别', '标题', '描述', '指标', '当前值', '预期值', '关联视角'];
      const rows = anomalies.map((a) => [
        a.level, a.title, `"${a.description}"`, a.metric,
        String(a.currentValue), String(a.expectedValue), a.relatedView,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    default:
      return 'Unsupported view type';
  }
}

router.post('/', (req: Request, res: Response): void => {
  const { viewType, filters, format } = req.body as {
    viewType: string;
    filters: FilterParams;
    format: ExportFormat;
  };

  if (!viewType || !format) {
    res.status(400).json({ error: 'Missing viewType or format' });
    return;
  }

  const task: ExportTask = {
    id: randomId(),
    viewType,
    filters,
    format,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  exportTasks.set(task.id, task);

  setTimeout(() => {
    const t = exportTasks.get(task.id);
    if (t) {
      t.status = 'processing';
      generateExportData(viewType, filters)
        .then((csvData) => {
          const t2 = exportTasks.get(task.id);
          if (t2) {
            t2.status = 'completed';
            t2.completedAt = new Date().toISOString();
            t2.downloadUrl = `/api/exports/${t2.id}/download`;
            (t2 as ExportTask & { _csvData?: string })._csvData = csvData;
          }
        })
        .catch(() => {
          const t2 = exportTasks.get(task.id);
          if (t2) {
            t2.status = 'failed';
            t2.completedAt = new Date().toISOString();
          }
        });
    }
  }, 500);

  res.status(201).json(task);
});

router.get('/', (_req: Request, res: Response): void => {
  const tasks = Array.from(exportTasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json(tasks);
});

router.get('/:id/download', (req: Request, res: Response): void => {
  const task = exportTasks.get(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Export task not found' });
    return;
  }
  if (task.status !== 'completed') {
    res.status(400).json({ error: 'Export not ready yet' });
    return;
  }

  const csvData = (task as ExportTask & { _csvData?: string })._csvData;
  const csv = csvData ?? `${task.id},${task.viewType},${task.createdAt},${task.status}`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=export_${task.id}.csv`);
  res.send(csv);
});

export default router;
