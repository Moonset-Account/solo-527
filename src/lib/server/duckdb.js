import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';
import { LRUCache } from 'lru-cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', '..', 'data');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new duckdb.Database(path.join(dataDir, 'analytics.db'));
  }
  return dbInstance;
}

const queryCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5,
  updateAgeOnGet: true
});

function getCacheKey(query, params) {
  return JSON.stringify({ q: query, p: params });
}

export async function query(sql, params = []) {
  const db = getDb();
  const cacheKey = getCacheKey(sql, params);
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        queryCache.set(cacheKey, rows);
        resolve(rows);
      }
    });
  });
}

function getVal(row, key) {
  if (row[key] !== undefined && row[key] !== null) return row[key];
  const upper = key.toUpperCase();
  if (row[upper] !== undefined && row[upper] !== null) return row[upper];
  return 0;
}

function buildWhere(filters, table = 'sessions') {
  const cond = [];
  const params = [];
  
  if (filters.anchorIds?.length > 0) {
    cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')');
    params.push(...filters.anchorIds);
  }
  
  if (filters.productIds?.length > 0) {
    cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')');
    params.push(...filters.productIds);
  }
  
  if (filters.timeSlots?.length > 0) {
    cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')');
    params.push(...filters.timeSlots);
  }
  
  if (filters.activityIds?.length > 0) {
    cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')');
    params.push(...filters.activityIds);
  }
  
  if (filters.sources?.length > 0) {
    cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')');
    params.push(...filters.sources);
  }
  
  if (filters.productType) {
    cond.push('product_type = ?');
    params.push(filters.productType);
  }
  
  return { cond, params, where: cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '' };
}

export async function getFunnelData(filters = {}) {
  const { where, params } = buildWhere(filters, 'sessions');
  
  const sql = `
    SELECT
      COUNT(DISTINCT user_id) as watch_uv,
      CAST(SUM(has_interaction) AS INTEGER) as interaction_uv,
      CAST(SUM(has_cart_add) AS INTEGER) as cart_add_uv,
      CAST(SUM(has_order) AS INTEGER) as order_uv,
      CAST(SUM(CASE WHEN has_order = 1 AND has_refund = 0 THEN 1 ELSE 0 END) AS INTEGER) as paid_uv
    FROM sessions
    ${where}
  `;
  
  const rows = await query(sql, params);
  const d = rows[0] || {};
  
  return [
    { name: '观看', value: Number(getVal(d, 'watch_uv')) },
    { name: '互动', value: Number(getVal(d, 'interaction_uv')) },
    { name: '加购', value: Number(getVal(d, 'cart_add_uv')) },
    { name: '下单', value: Number(getVal(d, 'order_uv')) },
    { name: '成交', value: Number(getVal(d, 'paid_uv')) }
  ];
}

export async function getHeatmapData(filters = {}) {
  const { where, params } = buildWhere(filters, 'presentation_slots');
  
  const sql = `
    SELECT
      time_slot,
      CAST(FLOOR(start_minute / 30) * 30 AS INTEGER) as time_bucket,
      CAST(SUM(viewers_peak) AS INTEGER) as total_viewers,
      CAST(SUM(order_count) AS INTEGER) as total_orders,
      CAST(SUM(gmv) AS DECIMAL) as total_gmv
    FROM presentation_slots
    ${where}
    GROUP BY time_slot, time_bucket
    ORDER BY time_slot, time_bucket
  `;
  
  return await query(sql, params);
}

export async function getRefundReasons(filters = {}) {
  const { cond, params } = buildWhere(filters, 'sessions');
  const allCond = [...cond, 'has_refund = 1', 'refund_reason IS NOT NULL'];
  const where = allCond.length > 0 ? 'WHERE ' + allCond.join(' AND ') : '';
  
  const sql = `
    SELECT
      refund_reason,
      CAST(COUNT(*) AS INTEGER) as count,
      CAST(SUM(refund_amount) AS DECIMAL) as amount
    FROM sessions
    ${where}
    GROUP BY refund_reason
    ORDER BY count DESC
  `;
  
  return await query(sql, params);
}

export async function getProductRanking(filters = {}) {
  const { where, params } = buildWhere(filters, 'sessions');
  
  const sql = `
    SELECT
      product_id,
      product_name,
      product_type,
      product_category,
      CAST(COUNT(DISTINCT user_id) AS INTEGER) as exposure_uv,
      CAST(SUM(has_cart_add) AS INTEGER) as cart_add_count,
      CAST(SUM(has_order) AS INTEGER) as order_count,
      CAST(SUM(order_amount) AS DECIMAL) as gmv,
      CAST(SUM(has_refund) AS INTEGER) as refund_count,
      CAST(SUM(refund_amount) AS DECIMAL) as refund_amount
    FROM sessions
    ${where}
    GROUP BY product_id, product_name, product_type, product_category
    ORDER BY gmv DESC
    LIMIT 20
  `;
  
  return await query(sql, params);
}

export async function getAnomalySummary(filters = {}) {
  const { where, params } = buildWhere(filters, 'sessions');
  
  const sql = `
    WITH base_metrics AS (
      SELECT
        COUNT(DISTINCT user_id) as watch_uv,
        CAST(SUM(has_interaction) AS INTEGER) as interaction_uv,
        CAST(SUM(has_cart_add) AS INTEGER) as cart_add_uv,
        CAST(SUM(has_order) AS INTEGER) as order_uv,
        CAST(SUM(order_amount) AS DECIMAL) as gmv,
        CAST(SUM(has_refund) AS INTEGER) as refund_count,
        CAST(SUM(CASE WHEN has_order = 1 THEN 1 ELSE 0 END) AS INTEGER) as total_orders
      FROM sessions
      ${where}
    )
    SELECT
      watch_uv,
      interaction_uv,
      cart_add_uv,
      order_uv,
      gmv,
      refund_count,
      total_orders,
      ROUND(interaction_uv * 100.0 / watch_uv, 2) as interaction_rate,
      ROUND(cart_add_uv * 100.0 / watch_uv, 2) as cart_add_rate,
      ROUND(order_uv * 100.0 / watch_uv, 2) as conversion_rate,
      ROUND(refund_count * 100.0 / NULLIF(total_orders, 0), 2) as refund_rate
    FROM base_metrics
  `;
  
  const rows = await query(sql, params);
  const m = rows[0] || {};
  const anomalies = [];
  
  const convRate = Number(getVal(m, 'conversion_rate'));
  if (convRate > 0 && convRate < 3) {
    anomalies.push({
      type: 'warning',
      metric: '转化率',
      value: convRate + '%',
      message: '转化率低于行业平均水平5%',
      suggestion: '建议优化商品讲解话术，增加限时优惠'
    });
  }
  
  const refundRate = Number(getVal(m, 'refund_rate'));
  if (refundRate > 10) {
    anomalies.push({
      type: 'danger',
      metric: '退款率',
      value: refundRate + '%',
      message: '退款率超过预警阈值10%',
      suggestion: '建议检查商品质量问题，优化详情页描述'
    });
  }
  
  const intRate = Number(getVal(m, 'interaction_rate'));
  if (intRate > 0 && intRate < 25) {
    anomalies.push({
      type: 'warning',
      metric: '互动率',
      value: intRate + '%',
      message: '互动率偏低，观众参与度不高',
      suggestion: '建议增加抽奖、问答等互动环节'
    });
  }
  
  return { metrics: m, anomalies };
}

export async function getDimensionOptions() {
  const [anchors, products, activities] = await Promise.all([
    query('SELECT DISTINCT anchor_id, anchor_name FROM sessions ORDER BY anchor_name'),
    query('SELECT DISTINCT product_id, product_name, product_type FROM sessions ORDER BY product_name'),
    query('SELECT DISTINCT activity_id, activity_name FROM sessions ORDER BY activity_name')
  ]);
  
  return { anchors, products, activities };
}

export async function getFulfillmentStats(filters = {}) {
  const { cond, params } = buildWhere(filters, 'sessions');
  const allCond = [...cond, 'has_order = 1'];
  const where = 'WHERE ' + allCond.join(' AND ');
  
  const sql = `
    SELECT
      product_type,
      CAST(COUNT(*) AS INTEGER) as total_orders,
      CAST(SUM(CASE WHEN is_fulfilled = 1 THEN 1 ELSE 0 END) AS INTEGER) as fulfilled_orders,
      ROUND(SUM(CASE WHEN is_fulfilled = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as fulfillment_rate
    FROM sessions
    ${where}
    GROUP BY product_type
    ORDER BY product_type
  `;
  
  return await query(sql, params);
}
