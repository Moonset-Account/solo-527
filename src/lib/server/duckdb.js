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
    try {
      dbInstance = new duckdb.Database(path.join(dataDir, 'analytics.db'));
    } catch (e) {
      console.warn('DuckDB 数据库不存在，将使用模拟数据模式');
    }
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
  const db = getDb();
  if (!db) {
    return [];
  }
  
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

function buildWhereClause(filters, tableAlias = null) {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const conditions = [];
  const params = [];
  
  if (filters.anchorIds?.length > 0) {
    conditions.push(`${prefix}anchor_id IN (${filters.anchorIds.map(() => '?').join(',')})`);
    params.push(...filters.anchorIds);
  }
  
  if (filters.productIds?.length > 0) {
    conditions.push(`${prefix}product_id IN (${filters.productIds.map(() => '?').join(',')})`);
    params.push(...filters.productIds);
  }
  
  if (filters.timeSlots?.length > 0) {
    conditions.push(`${prefix}time_slot IN (${filters.timeSlots.map(() => '?').join(',')})`);
    params.push(...filters.timeSlots);
  }
  
  if (filters.activityIds?.length > 0) {
    conditions.push(`${prefix}activity_id IN (${filters.activityIds.map(() => '?').join(',')})`);
    params.push(...filters.activityIds);
  }
  
  if (filters.sources?.length > 0) {
    conditions.push(`${prefix}source_channel IN (${filters.sources.map(() => '?').join(',')})`);
    params.push(...filters.sources);
  }
  
  if (filters.productType) {
    conditions.push(`${prefix}product_type = ?`);
    params.push(filters.productType);
  }
  
  if (filters.dateStart) {
    conditions.push(`${prefix}date >= ?`);
    params.push(filters.dateStart);
  }
  
  if (filters.dateEnd) {
    conditions.push(`${prefix}date <= ?`);
    params.push(filters.dateEnd);
  }
  
  return { conditions, params };
}

function buildSlotsWhereClause(filters) {
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
  
  if (filters.sources?.length > 0) {
    conditions.push(`source_channel IN (${filters.sources.map(() => '?').join(',')})`);
    params.push(...filters.sources);
  }
  
  if (filters.productType) {
    conditions.push(`product_type = ?`);
    params.push(filters.productType);
  }
  
  return { conditions, params };
}

function normalizeKey(key) {
  return key.toLowerCase();
}

function getField(row, key) {
  if (row[key] !== undefined) return row[key];
  const upperKey = key.toUpperCase();
  if (row[upperKey] !== undefined) return row[upperKey];
  return 0;
}

export async function getFunnelData(filters = {}) {
  try {
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
    const data = rows[0] || {};
    
    return [
      { name: '观看', value: Number(getField(data, 'watch_uv')) },
      { name: '互动', value: Number(getField(data, 'interaction_uv')) },
      { name: '加购', value: Number(getField(data, 'cart_add_uv')) },
      { name: '下单', value: Number(getField(data, 'order_uv')) },
      { name: '成交', value: Number(getField(data, 'paid_uv')) }
    ];
  } catch (e) {
    console.warn('getFunnelData 查询失败，使用默认数据:', e.message);
    return [
      { name: '观看', value: 125680 },
      { name: '互动', value: 35820 },
      { name: '加购', value: 15460 },
      { name: '下单', value: 5280 },
      { name: '成交', value: 4820 }
    ];
  }
}

export async function getHeatmapData(filters = {}) {
  try {
    const { conditions, params } = buildSlotsWhereClause(filters);
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
  } catch (e) {
    console.warn('getHeatmapData 查询失败，使用默认数据:', e.message);
    const timeSlots = ['00-02', '02-04', '04-06', '06-08', '08-10', '10-12', 
                       '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];
    const mockData = [];
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = 0; j < 24; j++) {
        const base = i >= 9 ? 80 : i >= 6 ? 50 : 20;
        mockData.push({
          time_slot: timeSlots[i],
          time_bucket: j * 30,
          total_orders: Math.floor(base * (0.5 + Math.random()))
        });
      }
    }
    return mockData;
  }
}

export async function getRefundReasons(filters = {}) {
  try {
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
  } catch (e) {
    console.warn('getRefundReasons 查询失败，使用默认数据:', e.message);
    return [
      { refund_reason: 'quality', count: 156, amount: 45800 },
      { refund_reason: 'description', count: 124, amount: 36200 },
      { refund_reason: 'size', count: 98, amount: 28500 },
      { refund_reason: 'price', count: 87, amount: 25400 },
      { refund_reason: 'delivery', count: 76, amount: 22100 },
      { refund_reason: 'damage', count: 45, amount: 13200 },
      { refund_reason: 'regret', count: 112, amount: 32800 },
      { refund_reason: 'other', count: 58, amount: 16900 }
    ];
  }
}

export async function getProductRanking(filters = {}) {
  try {
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
  } catch (e) {
    console.warn('getProductRanking 查询失败，使用默认数据:', e.message);
    return [
      { product_id: 'p009', product_name: '家用扫地机器人', product_type: 'spot', product_category: '家电', gmv: 589600, order_count: 656, refund_count: 42 },
      { product_id: 'p010', product_name: '空气净化器', product_type: 'preorder', product_category: '家电', gmv: 423500, order_count: 326, refund_count: 38 },
      { product_id: 'p008', product_name: '智能手环Pro', product_type: 'preorder', product_category: '数码', gmv: 358200, order_count: 718, refund_count: 52 },
      { product_id: 'p007', product_name: '无线蓝牙耳机', product_type: 'spot', product_category: '数码', gmv: 298500, order_count: 1498, refund_count: 124 },
      { product_id: 'p002', product_name: '限定口红礼盒', product_type: 'preorder', product_category: '美妆', gmv: 245600, order_count: 821, refund_count: 76 },
      { product_id: 'p004', product_name: '设计师联名卫衣', product_type: 'preorder', product_category: '服饰', gmv: 218900, order_count: 610, refund_count: 58 },
      { product_id: 'p001', product_name: '保湿精华液', product_type: 'spot', product_category: '美妆', gmv: 186400, order_count: 1456, refund_count: 98 },
      { product_id: 'p006', product_name: '进口坚果礼盒', product_type: 'preorder', product_category: '食品', gmv: 125800, order_count: 749, refund_count: 45 },
      { product_id: 'p003', product_name: '运动T恤', product_type: 'spot', product_category: '服饰', gmv: 98600, order_count: 1108, refund_count: 72 },
      { product_id: 'p005', product_name: '零食大礼包', product_type: 'spot', product_category: '食品', gmv: 64500, order_count: 948, refund_count: 36 }
    ];
  }
}

export async function getAnomalySummary(filters = {}) {
  try {
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
    const m = metrics[0] || {};
    const anomalies = [];
    
    const convRate = Number(getField(m, 'conversion_rate'));
    if (convRate > 0 && convRate < 3) {
      anomalies.push({
        type: 'warning',
        metric: '转化率',
        value: `${convRate}%`,
        message: '转化率低于行业平均水平5%',
        suggestion: '建议优化商品讲解话术，增加限时优惠'
      });
    }
    
    const refundRate = Number(getField(m, 'refund_rate'));
    if (refundRate > 10) {
      anomalies.push({
        type: 'danger',
        metric: '退款率',
        value: `${refundRate}%`,
        message: '退款率超过预警阈值10%',
        suggestion: '建议检查商品质量问题，优化详情页描述'
      });
    }
    
    const intRate = Number(getField(m, 'interaction_rate'));
    if (intRate > 0 && intRate < 25) {
      anomalies.push({
        type: 'warning',
        metric: '互动率',
        value: `${intRate}%`,
        message: '互动率偏低，观众参与度不高',
        suggestion: '建议增加抽奖、问答等互动环节'
      });
    }
    
    return {
      metrics: m,
      anomalies
    };
  } catch (e) {
    console.warn('getAnomalySummary 查询失败，使用默认数据:', e.message);
    return {
      metrics: {
        watch_uv: 125680,
        interaction_rate: 28.5,
        cart_add_rate: 12.3,
        conversion_rate: 4.2,
        gmv: 2589600,
        refund_rate: 8.7
      },
      anomalies: [
        {
          type: 'warning',
          metric: '转化率',
          value: '4.2%',
          message: '转化率低于行业平均水平5%',
          suggestion: '建议优化商品讲解话术，增加限时优惠'
        },
        {
          type: 'danger',
          metric: '退款率',
          value: '8.7%',
          message: '退款率接近预警阈值10%',
          suggestion: '建议检查商品质量问题，优化详情页描述'
        }
      ]
    };
  }
}

export async function getDimensionOptions() {
  try {
    const [anchors, products, activities] = await Promise.all([
      query('SELECT DISTINCT anchor_id, anchor_name FROM sessions ORDER BY anchor_name'),
      query('SELECT DISTINCT product_id, product_name, product_type FROM sessions ORDER BY product_name'),
      query('SELECT DISTINCT activity_id, activity_name FROM sessions ORDER BY activity_name')
    ]);
    
    return { anchors, products, activities };
  } catch (e) {
    console.warn('getDimensionOptions 查询失败，使用默认数据:', e.message);
    return {
      anchors: [
        { anchor_id: 'a001', anchor_name: '小美' },
        { anchor_id: 'a002', anchor_name: '阿杰' },
        { anchor_id: 'a003', anchor_name: '薇薇' },
        { anchor_id: 'a004', anchor_name: '大壮' },
        { anchor_id: 'a005', anchor_name: '晓晓' }
      ],
      products: [
        { product_id: 'p001', product_name: '保湿精华液', product_type: 'spot' },
        { product_id: 'p002', product_name: '限定口红礼盒', product_type: 'preorder' },
        { product_id: 'p003', product_name: '运动T恤', product_type: 'spot' },
        { product_id: 'p004', product_name: '设计师联名卫衣', product_type: 'preorder' },
        { product_id: 'p005', product_name: '零食大礼包', product_type: 'spot' },
        { product_id: 'p006', product_name: '进口坚果礼盒', product_type: 'preorder' },
        { product_id: 'p007', product_name: '无线蓝牙耳机', product_type: 'spot' },
        { product_id: 'p008', product_name: '智能手环Pro', product_type: 'preorder' },
        { product_id: 'p009', product_name: '家用扫地机器人', product_type: 'spot' },
        { product_id: 'p010', product_name: '空气净化器', product_type: 'preorder' }
      ],
      activities: [
        { activity_id: 'act001', activity_name: '618大促' },
        { activity_id: 'act002', activity_name: '品牌日' },
        { activity_id: 'act003', activity_name: '新品首发' },
        { activity_id: 'act004', activity_name: '日常直播' }
      ]
    };
  }
}

export async function getFulfillmentStats(filters = {}) {
  try {
    const { conditions, params } = buildWhereClause(filters);
    const orderConditions = [...conditions, 'has_order = 1'];
    const whereSql = `WHERE ${orderConditions.join(' AND ')}`;
    
    const sql = `
      SELECT
        product_type,
        COUNT(*) as total_orders,
        SUM(CASE WHEN is_fulfilled = 1 OR is_fulfilled = true THEN 1 ELSE 0 END) as fulfilled_orders,
        ROUND(SUM(CASE WHEN is_fulfilled = 1 OR is_fulfilled = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as fulfillment_rate
      FROM sessions
      ${whereSql}
      GROUP BY product_type
      ORDER BY product_type
    `;
    
    return await query(sql, params);
  } catch (e) {
    console.warn('getFulfillmentStats 查询失败，使用默认数据:', e.message);
    return [
      { product_type: 'spot', total_orders: 3256, fulfilled_orders: 3078, fulfillment_rate: 94.5 },
      { product_type: 'preorder', total_orders: 1892, fulfilled_orders: 1558, fulfillment_rate: 82.3 }
    ];
  }
}
