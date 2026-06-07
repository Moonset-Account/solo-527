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
  return JSON.stringify({ query, params });
}

export async function query(sql, params = []) {
  const cacheKey = getCacheKey(sql, params);
  
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }
  
  return new Promise((resolve, reject) => {
    const db = getDb();
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

export function buildWhereClause(filters) {
  const conditions = [];
  const params = [];
  
  if (filters.anchorIds?.length > 0) {
    conditions.push(`anchor_id IN (${filters.anchorIds.map(() => '?').join(',')})`);
    params.push(...filters.anchorIds);
  }
  
  if (filters.productIds?.length > 0) {
    conditions.push(`product_id IN (${filters.productIds.map(() => '?').join(',')})`);
    params.push(...filters.productIds);
  }
  
  if (filters.timeSlots?.length > 0) {
    conditions.push(`time_slot IN (${filters.timeSlots.map(() => '?').join(',')})`);
    params.push(...filters.timeSlots);
  }
  
  if (filters.activityIds?.length > 0) {
    conditions.push(`activity_id IN (${filters.activityIds.map(() => '?').join(',')})`);
    params.push(...filters.activityIds);
  }
  
  if (filters.sources?.length > 0) {
    conditions.push(`source_channel IN (${filters.sources.map(() => '?').join(',')})`);
    params.push(...filters.sources);
  }
  
  if (filters.productType) {
    conditions.push('product_type = ?');
    params.push(filters.productType);
  }
  
  if (filters.dateStart) {
    conditions.push('date >= ?');
    params.push(filters.dateStart);
  }
  
  if (filters.dateEnd) {
    conditions.push('date <= ?');
    params.push(filters.dateEnd);
  }
  
  return { conditions, params };
}

export async function getFunnelData(filters = {}) {
  const { conditions, params } = buildWhereClause(filters);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `
    SELECT
      COUNT(DISTINCT user_id) as watch_uv,
      SUM(has_interaction) as interaction_uv,
      SUM(has_cart_add) as cart_add_uv,
      SUM(has_order) as order_uv,
      SUM(CASE WHEN has_order = 1 AND has_refund = 0 THEN 1 ELSE 0 END) as paid_uv
    FROM sessions
    ${whereSql}
  `;
  
  const rows = await query(sql, params);
  const data = rows[0];
  
  return [
    { name: '观看', value: data.WATCH_UV || data.watch_uv || 0 },
    { name: '互动', value: data.INTERACTION_UV || data.interaction_uv || 0 },
    { name: '加购', value: data.CART_ADD_UV || data.cart_add_uv || 0 },
    { name: '下单', value: data.ORDER_UV || data.order_uv || 0 },
    { name: '成交', value: data.PAID_UV || data.paid_uv || 0 }
  ];
}

export async function getHeatmapData(filters = {}) {
  const { conditions, params } = buildWhereClause(filters);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `
    SELECT
      time_slot,
      FLOOR(start_minute / 30) * 30 as time_bucket,
      SUM(viewers_peak) as total_viewers,
      SUM(order_count) as total_orders,
      SUM(gmv) as total_gmv
    FROM presentation_slots
    ${whereSql}
    GROUP BY time_slot, time_bucket
    ORDER BY time_slot, time_bucket
  `;
  
  return await query(sql, params);
}

export async function getRefundReasons(filters = {}) {
  const { conditions, params } = buildWhereClause(filters);
  const refundConditions = [...conditions, 'has_refund = 1', 'refund_reason IS NOT NULL'];
  const whereSql = `WHERE ${refundConditions.join(' AND ')}`;
  
  const sql = `
    SELECT
      refund_reason,
      COUNT(*) as count,
      SUM(refund_amount) as amount
    FROM sessions
    ${whereSql}
    GROUP BY refund_reason
    ORDER BY count DESC
  `;
  
  return await query(sql, params);
}

export async function getProductRanking(filters = {}) {
  const { conditions, params } = buildWhereClause(filters);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `
    SELECT
      product_id,
      product_name,
      product_type,
      product_category,
      COUNT(DISTINCT user_id) as exposure_uv,
      SUM(has_cart_add) as cart_add_count,
      SUM(has_order) as order_count,
      SUM(order_amount) as gmv,
      SUM(has_refund) as refund_count,
      SUM(refund_amount) as refund_amount
    FROM sessions
    ${whereSql}
    GROUP BY product_id, product_name, product_type, product_category
    ORDER BY gmv DESC
    LIMIT 20
  `;
  
  return await query(sql, params);
}

export async function getAnomalySummary(filters = {}) {
  const { conditions, params } = buildWhereClause(filters);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const sql = `
    WITH base_metrics AS (
      SELECT
        COUNT(DISTINCT user_id) as watch_uv,
        SUM(has_interaction) as interaction_uv,
        SUM(has_cart_add) as cart_add_uv,
        SUM(has_order) as order_uv,
        SUM(order_amount) as gmv,
        SUM(has_refund) as refund_count,
        SUM(CASE WHEN has_order = 1 THEN 1 ELSE 0 END) as total_orders
      FROM sessions
      ${whereSql}
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
  
  const metrics = await query(sql, params);
  
  const anomalies = [];
  const m = metrics[0] || {};
  
  if (m.CONVERSION_RATE || m.conversion_rate) {
    const convRate = m.CONVERSION_RATE || m.conversion_rate;
    if (convRate < 3) {
      anomalies.push({
        type: 'warning',
        metric: '转化率',
        value: `${convRate}%`,
        message: '转化率低于行业平均水平5%',
        suggestion: '建议优化商品讲解话术，增加限时优惠'
      });
    }
  }
  
  if (m.REFUND_RATE || m.refund_rate) {
    const refundRate = m.REFUND_RATE || m.refund_rate;
    if (refundRate > 10) {
      anomalies.push({
        type: 'danger',
        metric: '退款率',
        value: `${refundRate}%`,
        message: '退款率超过预警阈值10%',
        suggestion: '建议检查商品质量问题，优化详情页描述'
      });
    }
  }
  
  if (m.INTERACTION_RATE || m.interaction_rate) {
    const intRate = m.INTERACTION_RATE || m.interaction_rate;
    if (intRate < 25) {
      anomalies.push({
        type: 'warning',
        metric: '互动率',
        value: `${intRate}%`,
        message: '互动率偏低，观众参与度不高',
        suggestion: '建议增加抽奖、问答等互动环节'
      });
    }
  }
  
  return {
    metrics: metrics[0] || {},
    anomalies
  };
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
  const { conditions, params } = buildWhereClause(filters);
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} AND has_order = 1` : 'WHERE has_order = 1';
  
  const sql = `
    SELECT
      product_type,
      COUNT(*) as total_orders,
      SUM(CASE WHEN is_fulfilled = true THEN 1 ELSE 0 END) as fulfilled_orders,
      ROUND(SUM(CASE WHEN is_fulfilled = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as fulfillment_rate
    FROM sessions
    ${whereSql}
    GROUP BY product_type
    ORDER BY product_type
  `;
  
  return await query(sql, params);
}
