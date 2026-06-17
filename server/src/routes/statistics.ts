import { Hono } from 'hono';
import { getPointCostStatistics, getExchangeTrend } from '../services/statistics';

const statistics = new Hono();

statistics.get('/point-cost', async (c) => {
  const query = c.req.query();

  const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = query.endDate || new Date().toISOString().split('T')[0];
  const dimension = (query.dimension as 'date' | 'product' | 'level') || 'date';

  const filters: Record<string, any> = {};
  if (query.category) filters.category = query.category;
  if (query.level) filters.level = query.level;

  const result = await getPointCostStatistics({
    startDate,
    endDate,
    dimension,
    filters,
  });

  return c.json({ success: true, data: result });
});

statistics.get('/exchange-trend', async (c) => {
  const query = c.req.query();

  const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = query.endDate || new Date().toISOString().split('T')[0];
  const period = (query.period as 'day' | 'week' | 'month') || 'day';

  const result = await getExchangeTrend({
    startDate,
    endDate,
    period,
  });

  return c.json({ success: true, data: result });
});

statistics.get('/export', async (c) => {
  const query = c.req.query();
  const type = query.type || 'point-cost';

  const startDate = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = query.endDate || new Date().toISOString().split('T')[0];

  let csvContent = '';
  let filename = '';

  if (type === 'point-cost') {
    const dimension = (query.dimension as 'date' | 'product' | 'level') || 'date';
    const result = await getPointCostStatistics({
      startDate,
      endDate,
      dimension,
    });

    csvContent = `筛选口径: 开始日期=${startDate}, 结束日期=${endDate}, 维度=${dimension}\n`;
    csvContent += `维度,订单数,消耗积分,会员数\n`;

    for (const item of result.data) {
      csvContent += `${item.label},${item.orderCount},${item.totalPoints},${item.memberCount}\n`;
    }

    csvContent += `\n汇总\n`;
    csvContent += `总订单数,${result.summary.totalOrders}\n`;
    csvContent += `总积分消耗,${result.summary.totalPoints}\n`;
    csvContent += `总会员数,${result.summary.totalMembers}\n`;
    csvContent += `笔均积分,${result.summary.avgPointsPerOrder}\n`;

    filename = `积分成本统计_${startDate}_${endDate}.csv`;
  }

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  return c.body('\uFEFF' + csvContent);
});

export default statistics;
