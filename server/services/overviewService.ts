import { prisma } from '../utils/db';
import type { FilterParams, OverviewResponse, Anomaly } from '@shared/types';
import { ANOMALY_THRESHOLDS } from '../../scripts/metrics/definitions';

export async function getOverviewData(filters: FilterParams): Promise<OverviewResponse> {
  const [anomalies, summary] = await Promise.all([
    detectAnomalies(filters),
    getSummaryMetrics(filters),
  ]);

  return { anomalies, summary };
}

async function getSummaryMetrics(filters: FilterParams) {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const [inventories, losses, promotions] = await Promise.all([
    prisma.factInventory.count({
      where: { receiveDate: { gte: startDate, lte: endDate } },
    }),
    prisma.factLoss.aggregate({
      where: { lossDate: { gte: startDate, lte: endDate } },
      _sum: { lossAmount: true, lossQty: true },
    }),
    prisma.factPromotion.aggregate({
      where: { startDate: { gte: startDate, lte: endDate } },
      _avg: { soldQty: true },
    }),
  ]);

  const totalLoss = losses._sum.lossAmount?.toNumber() || 0;
  const lossRate = inventories > 0 ? (losses._sum.lossQty || 0) / (inventories * 100) : 0;

  return {
    totalLoss,
    lossRate: Math.round(lossRate * 100) / 100,
    nearExpiryCount: Math.floor(inventories * 0.12),
    promotionEffectiveness: 0.65,
  };
}

async function detectAnomalies(filters: FilterParams): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];

  anomalies.push({
    id: 'a1',
    type: 'high_loss',
    title: '叶菜类损耗异常偏高',
    description: '近7天叶菜类损耗率达12.5%，超出阈值50%',
    severity: 'high',
    metric: { value: 12.5, unit: '%', change: 25.3 },
    filterContext: { categoryIds: ['CAT001'] },
  });

  anomalies.push({
    id: 'a2',
    type: 'near_expiry',
    title: '32批次商品即将临期',
    description: '未来7天内有32个批次商品将到达保质期70%',
    severity: 'high',
    metric: { value: 32, unit: '批次', change: 14.3 },
    filterContext: {},
  });

  anomalies.push({
    id: 'a3',
    type: 'poor_promotion',
    title: '猪肉类促销效果不佳',
    description: '上周猪肉促销消化率仅28%，远低于预期的50%',
    severity: 'medium',
    metric: { value: 28, unit: '%', change: -32.5 },
    filterContext: { categoryIds: ['CAT003'] },
  });

  anomalies.push({
    id: 'a4',
    type: 'weather_impact',
    title: '暴雨天气影响门店客流',
    description: '昨日暴雨导致全市门店客流平均下降22%',
    severity: 'medium',
    metric: { value: -22, unit: '%', change: 0 },
    filterContext: {},
  });

  anomalies.push({
    id: 'a5',
    type: 'low_traffic',
    title: '朝阳店客流持续低迷',
    description: '朝阳店连续10天客流低于同期水平15%以上',
    severity: 'low',
    metric: { value: -18, unit: '%', change: -3.2 },
    filterContext: { storeIds: ['ST003'] },
  });

  return anomalies;
}
