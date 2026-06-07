import { Router, type Request, type Response } from 'express';
import { getFilteredConsultationIds, getFunnelAggregation, getAnomaliesAggregation, getChannelQualityAggregation, getConsultantLoadAggregation, getFollowUpTrendAggregation, getFilterOptionsAggregation } from '../data/aggregations.js';
import { buildCacheKey } from '../data/redisCache.js';
import type { FilterParams } from '../../shared/types.js';

function parseFilterParams(req: Request): { params: FilterParams; customerStage?: string } {
  const projectIds = req.query.projectIds
    ? (Array.isArray(req.query.projectIds) ? req.query.projectIds as string[] : [req.query.projectIds as string])
    : undefined;
  const consultantIds = req.query.consultantIds
    ? (Array.isArray(req.query.consultantIds) ? req.query.consultantIds as string[] : [req.query.consultantIds as string])
    : undefined;
  const channelIds = req.query.channelIds
    ? (Array.isArray(req.query.channelIds) ? req.query.channelIds as string[] : [req.query.channelIds as string])
    : undefined;
  const months = req.query.months
    ? (Array.isArray(req.query.months) ? req.query.months as string[] : [req.query.months as string])
    : undefined;
  const customerStage = req.query.customerStage as string | undefined;

  return {
    params: { projectIds, consultantIds, channelIds, customerStage, months },
    customerStage,
  };
}

const router = Router();

router.get('/anomalies', async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, customerStage } = parseFilterParams(req);
    const consultationIds = getFilteredConsultationIds(params, customerStage);
    const anomalies = await getAnomaliesAggregation(consultationIds, params, customerStage);
    res.json({ anomalies });
  } catch (error) {
    console.error('Anomalies error:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

router.get('/funnel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, customerStage } = parseFilterParams(req);
    const consultationIds = getFilteredConsultationIds(params, customerStage);
    const cacheKey = buildCacheKey('funnel', { ids: consultationIds.length, ...params, customerStage });
    const agg = await getFunnelAggregation(consultationIds, cacheKey);

    const stages = [
      { name: '咨询', count: agg.totalConsultations, rate: 1, prevRate: 0.98 },
      { name: '预约', count: agg.totalAppointments, rate: agg.totalConsultations > 0 ? agg.totalAppointments / agg.totalConsultations : 0, prevRate: 0.72 },
      { name: '到店', count: agg.totalVisits, rate: agg.totalAppointments > 0 ? agg.totalVisits / agg.totalAppointments : 0, prevRate: 0.68 },
      { name: '方案', count: agg.totalPlans, rate: agg.totalVisits > 0 ? agg.totalPlans / agg.totalVisits : 0, prevRate: 0.6 },
      { name: '付款', count: agg.totalPayments, rate: agg.totalPlans > 0 ? agg.totalPayments / agg.totalPlans : 0, prevRate: 0.55 },
      { name: '复诊', count: agg.totalFollowUps, rate: agg.totalPayments > 0 ? agg.totalFollowUps / agg.totalPayments : 0, prevRate: 0.4 },
    ];

    res.json({ stages });
  } catch (error) {
    console.error('Funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

router.get('/channel-quality', async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, customerStage } = parseFilterParams(req);
    const consultationIds = getFilteredConsultationIds(params, customerStage);
    const cacheKey = buildCacheKey('channel', { ids: consultationIds.length, ...params, customerStage });
    const channels = await getChannelQualityAggregation(consultationIds, cacheKey);
    res.json({ channels });
  } catch (error) {
    console.error('Channel quality error:', error);
    res.status(500).json({ error: 'Failed to fetch channel quality data' });
  }
});

router.get('/consultant-load', async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, customerStage } = parseFilterParams(req);
    const consultationIds = getFilteredConsultationIds(params, customerStage);
    const cacheKey = buildCacheKey('consultant', { ids: consultationIds.length, ...params, customerStage });
    const consultants = await getConsultantLoadAggregation(consultationIds, cacheKey);
    res.json({ consultants });
  } catch (error) {
    console.error('Consultant load error:', error);
    res.status(500).json({ error: 'Failed to fetch consultant load data' });
  }
});

router.get('/follow-up-trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, customerStage } = parseFilterParams(req);
    const consultationIds = getFilteredConsultationIds(params, customerStage);
    const cacheKey = buildCacheKey('followup', { ids: consultationIds.length, ...params, customerStage });
    const result = await getFollowUpTrendAggregation(consultationIds, cacheKey);
    res.json(result);
  } catch (error) {
    console.error('Follow-up trend error:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up trend data' });
  }
});

router.get('/filter-options', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getFilterOptionsAggregation();
    res.json(result);
  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

export default router;
