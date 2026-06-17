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
    const category = query.category || '';
    const level = query.level || '';
    const filters: Record<string, any> = {};
    if (category) filters.category = category;
    if (level) filters.level = level;

    const result = await getPointCostStatistics({
      startDate,
      endDate,
      dimension,
      filters,
    });

    const criteria: string[] = [`开始日期=${startDate}`, `结束日期=${endDate}`, `维度=${dimension}`];
    if (category) criteria.push(`商品分类=${category}`);
    if (level) criteria.push(`会员等级=${level}`);

    csvContent = `筛选口径: ${criteria.join(', ')}\n`;
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
  } else if (type === 'reach') {
    const { getReachTaskById, getReachLogs } = await import('../services/reach');
    const taskId = query.taskId || '';
    const status = query.status || '';

    const task = taskId ? await getReachTaskById(taskId) : null;
    const criteria: string[] = [];
    if (task) criteria.push(`任务名称=${task.name}`);
    if (status) criteria.push(`状态=${status === 'success' ? '成功' : status === 'failed' ? '失败' : '全部'}`);

    csvContent = `筛选口径: ${criteria.length > 0 ? criteria.join(', ') : '全部'}\n`;
    csvContent += `会员昵称,手机号,状态,失败原因,重试次数,时间\n`;

    if (taskId) {
      const result = await getReachLogs(taskId, {
        status: status || undefined,
        page: 1,
        pageSize: 10000,
      });

      for (const log of result.items) {
        const memberName = (log as any).member?.nickname || '-';
        const phone = log.memberPhone || (log as any).member?.phone || '-';
        const statusText = log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '待执行';
        csvContent += `${memberName},${phone},${statusText},${log.errorMessage || '-'},${log.retryCount},${log.createdAt}\n`;
      }
    }

    filename = `触达日志_${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type === 'orders') {
    const { getAdminOrders } = await import('../services/order');
    const status = query.status || '';
    const keyword = query.keyword || '';
    const criteria: string[] = [`开始日期=${startDate}`, `结束日期=${endDate}`];
    if (status) criteria.push(`状态=${status}`);
    if (keyword) criteria.push(`关键词=${keyword}`);

    csvContent = `筛选口径: ${criteria.join(', ')}\n`;
    csvContent += `订单号,会员昵称,手机号,商品名称,数量,消耗积分,状态,下单时间,核销时间\n`;

    const result = await getAdminOrders({
      page: 1,
      pageSize: 10000,
      status: status || undefined,
      keyword: keyword || undefined,
      startDate,
      endDate,
    });

    for (const item of result.items as any[]) {
      const memberName = item.member?.nickname || '-';
      const phone = item.member?.phone || '-';
      const productName = item.product?.name || '-';
      const statusText = item.status === 'pending' ? '待核销' : item.status === 'redeemed' ? '已核销' : item.status === 'cancelled' ? '已取消' : '已过期';
      csvContent += `${item.orderNo},${memberName},${phone},${productName},${item.quantity},${item.totalPoints},${statusText},${item.createdAt},${item.redeemedAt || '-'}\n`;
    }

    filename = `订单记录_${startDate}_${endDate}.csv`;
  }

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  return c.body('\uFEFF' + csvContent);
});

export default statistics;
