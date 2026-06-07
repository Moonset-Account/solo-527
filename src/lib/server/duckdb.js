import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { LRUCache } from 'lru-cache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', '..', '..', 'data');

let duckdbModule = null;
let dbInstance = null;
let duckdbAvailable = false;
let sessionsData = null;
let presentationSlotsData = null;

async function initDuckDB() {
  try {
    const mod = await import('duckdb');
    duckdbModule = mod.default;
    const dbPath = path.join(dataDir, 'analytics.db');
    if (fs.existsSync(dbPath)) {
      dbInstance = new duckdbModule.Database(dbPath);
      duckdbAvailable = true;
      console.log('[数据源] 使用 DuckDB 数据库');
    } else {
      console.log('[数据源] analytics.db 不存在，准备加载 JSON 数据');
    }
  } catch (e) {
    console.log('[数据源] DuckDB 不可用，使用 JSON 聚合引擎:', e.message);
  }
}

function loadJSONData() {
  if (sessionsData && presentationSlotsData) return;
  
  const sessionsPath = path.join(dataDir, 'cleaned_sessions.json');
  const slotsPath = path.join(dataDir, 'cleaned_presentation_slots.json');
  
  if (fs.existsSync(sessionsPath)) {
    sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    console.log('[数据源] 加载会话数据:', sessionsData.length, '条');
  } else {
    const rawPath = path.join(dataDir, 'raw_sessions.json');
    if (fs.existsSync(rawPath)) {
      sessionsData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      console.log('[数据源] 加载原始会话数据:', sessionsData.length, '条');
    } else {
      sessionsData = [];
      console.log('[数据源] 警告: 未找到会话数据文件');
    }
  }
  
  if (fs.existsSync(slotsPath)) {
    presentationSlotsData = JSON.parse(fs.readFileSync(slotsPath, 'utf-8'));
    console.log('[数据源] 加载讲解时段数据:', presentationSlotsData.length, '条');
  } else {
    const rawPath = path.join(dataDir, 'raw_presentation_slots.json');
    if (fs.existsSync(rawPath)) {
      presentationSlotsData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      console.log('[数据源] 加载原始讲解时段数据:', presentationSlotsData.length, '条');
    } else {
      presentationSlotsData = [];
      console.log('[数据源] 警告: 未找到讲解时段数据文件');
    }
  }
}

const queryCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5,
  updateAgeOnGet: true
});

function getCacheKey(query, params) {
  return JSON.stringify({ q: query, p: params });
}

function getVal(row, key) {
  if (row[key] !== undefined && row[key] !== null) return row[key];
  const upper = key.toUpperCase();
  if (row[upper] !== undefined && row[upper] !== null) return row[upper];
  return 0;
}

function matchesFilter(row, filter, field) {
  if (!filter || filter.length === 0) return true;
  return filter.includes(row[field]);
}

function filterData(data, filters, table = 'sessions') {
  return data.filter(row => {
    if (filters.anchorIds?.length > 0 && !filters.anchorIds.includes(row.anchor_id)) return false;
    if (filters.productIds?.length > 0 && !filters.productIds.includes(row.product_id)) return false;
    if (filters.timeSlots?.length > 0 && !filters.timeSlots.includes(row.time_slot)) return false;
    if (filters.activityIds?.length > 0 && !filters.activityIds.includes(row.activity_id)) return false;
    if (filters.sources?.length > 0 && !filters.sources.includes(row.source_channel)) return false;
    if (filters.productType && row.product_type !== filters.productType) return false;
    return true;
  });
}

async function duckdbQuery(sql, params = []) {
  if (!duckdbAvailable) return null;
  
  const cacheKey = getCacheKey(sql, params);
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }
  
  return new Promise((resolve, reject) => {
    dbInstance.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        queryCache.set(cacheKey, rows);
        resolve(rows);
      }
    });
  });
}

export async function query(sql, params = []) {
  if (duckdbAvailable) {
    try {
      return await duckdbQuery(sql, params);
    } catch (e) {
      console.log('[查询] DuckDB 查询失败，降级到 JSON:', e.message);
    }
  }
  return [];
}

export async function getDataBackend() {
  await initDuckDB();
  return duckdbAvailable ? 'duckdb' : 'json';
}

export async function getFunnelData(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      const where = cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '';
      
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
      const rows = await duckdbQuery(sql, params);
      const d = rows[0] || {};
      return [
        { name: '观看', value: Number(getVal(d, 'watch_uv')) },
        { name: '互动', value: Number(getVal(d, 'interaction_uv')) },
        { name: '加购', value: Number(getVal(d, 'cart_add_uv')) },
        { name: '下单', value: Number(getVal(d, 'order_uv')) },
        { name: '成交', value: Number(getVal(d, 'paid_uv')) }
      ];
    } catch (e) {
      console.log('[漏斗] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(sessionsData, filters);
  const userIds = new Set();
  let interaction = 0, cartAdd = 0, order = 0, paid = 0;
  filtered.forEach(r => {
    userIds.add(r.user_id);
    if (r.has_interaction) interaction++;
    if (r.has_cart_add) cartAdd++;
    if (r.has_order) order++;
    if (r.has_order && !r.has_refund) paid++;
  });
  return [
    { name: '观看', value: userIds.size },
    { name: '互动', value: interaction },
    { name: '加购', value: cartAdd },
    { name: '下单', value: order },
    { name: '成交', value: paid }
  ];
}

export async function getHeatmapData(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      const where = cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '';
      
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
      return await duckdbQuery(sql, params);
    } catch (e) {
      console.log('[热力图] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(presentationSlotsData, filters, 'presentation_slots');
  const buckets = {};
  filtered.forEach(r => {
    const bucket = Math.floor(r.start_minute / 30) * 30;
    const key = r.time_slot + '|' + bucket;
    if (!buckets[key]) {
      buckets[key] = { time_slot: r.time_slot, time_bucket: bucket, total_viewers: 0, total_orders: 0, total_gmv: 0 };
    }
    buckets[key].total_viewers += r.viewers_peak || 0;
    buckets[key].total_orders += r.order_count || 0;
    buckets[key].total_gmv += r.gmv || 0;
  });
  return Object.values(buckets).sort((a, b) => a.time_slot.localeCompare(b.time_slot) || a.time_bucket - b.time_bucket);
}

export async function getRefundReasons(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      cond.push('has_refund = 1');
      cond.push('refund_reason IS NOT NULL');
      const where = 'WHERE ' + cond.join(' AND ');
      
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
      return await duckdbQuery(sql, params);
    } catch (e) {
      console.log('[退款] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(sessionsData, filters).filter(r => r.has_refund && r.refund_reason);
  const reasons = {};
  filtered.forEach(r => {
    if (!reasons[r.refund_reason]) {
      reasons[r.refund_reason] = { refund_reason: r.refund_reason, count: 0, amount: 0 };
    }
    reasons[r.refund_reason].count++;
    reasons[r.refund_reason].amount += r.refund_amount || 0;
  });
  return Object.values(reasons).sort((a, b) => b.count - a.count);
}

export async function getProductRanking(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      const where = cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '';
      
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
      return await duckdbQuery(sql, params);
    } catch (e) {
      console.log('[商品排行] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(sessionsData, filters);
  const products = {};
  filtered.forEach(r => {
    const key = r.product_id;
    if (!products[key]) {
      products[key] = {
        product_id: r.product_id,
        product_name: r.product_name,
        product_type: r.product_type,
        product_category: r.product_category,
        exposure_uv: new Set(),
        cart_add_count: 0,
        order_count: 0,
        gmv: 0,
        refund_count: 0,
        refund_amount: 0
      };
    }
    products[key].exposure_uv.add(r.user_id);
    if (r.has_cart_add) products[key].cart_add_count++;
    if (r.has_order) products[key].order_count++;
    products[key].gmv += r.order_amount || 0;
    if (r.has_refund) products[key].refund_count++;
    products[key].refund_amount += r.refund_amount || 0;
  });
  return Object.values(products)
    .map(p => ({ ...p, exposure_uv: p.exposure_uv.size }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 20);
}

export async function getAnomalySummary(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      const where = cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '';
      
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
      const rows = await duckdbQuery(sql, params);
      const m = rows[0] || {};
      const anomalies = [];
      const convRate = Number(getVal(m, 'conversion_rate'));
      if (convRate > 0 && convRate < 3) {
        anomalies.push({ type: 'warning', metric: '转化率', value: convRate + '%', message: '转化率低于行业平均水平5%', suggestion: '建议优化商品讲解话术，增加限时优惠' });
      }
      const refundRate = Number(getVal(m, 'refund_rate'));
      if (refundRate > 10) {
        anomalies.push({ type: 'danger', metric: '退款率', value: refundRate + '%', message: '退款率超过预警阈值10%', suggestion: '建议检查商品质量问题，优化详情页描述' });
      }
      const intRate = Number(getVal(m, 'interaction_rate'));
      if (intRate > 0 && intRate < 25) {
        anomalies.push({ type: 'warning', metric: '互动率', value: intRate + '%', message: '互动率偏低，观众参与度不高', suggestion: '建议增加抽奖、问答等互动环节' });
      }
      return { metrics: m, anomalies };
    } catch (e) {
      console.log('[异常摘要] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(sessionsData, filters);
  const watchUv = new Set(filtered.map(r => r.user_id)).size;
  let interactionUv = 0, cartAddUv = 0, orderUv = 0, gmv = 0, refundCount = 0, totalOrders = 0;
  filtered.forEach(r => {
    if (r.has_interaction) interactionUv++;
    if (r.has_cart_add) cartAddUv++;
    if (r.has_order) { orderUv++; totalOrders++; }
    gmv += r.order_amount || 0;
    if (r.has_refund) refundCount++;
  });
  const m = {
    watch_uv: watchUv,
    interaction_uv: interactionUv,
    cart_add_uv: cartAddUv,
    order_uv: orderUv,
    gmv: gmv,
    refund_count: refundCount,
    total_orders: totalOrders,
    interaction_rate: watchUv > 0 ? Number((interactionUv * 100 / watchUv).toFixed(2)) : 0,
    cart_add_rate: watchUv > 0 ? Number((cartAddUv * 100 / watchUv).toFixed(2)) : 0,
    conversion_rate: watchUv > 0 ? Number((orderUv * 100 / watchUv).toFixed(2)) : 0,
    refund_rate: totalOrders > 0 ? Number((refundCount * 100 / totalOrders).toFixed(2)) : 0
  };
  const anomalies = [];
  if (m.conversion_rate > 0 && m.conversion_rate < 3) {
    anomalies.push({ type: 'warning', metric: '转化率', value: m.conversion_rate + '%', message: '转化率低于行业平均水平5%', suggestion: '建议优化商品讲解话术，增加限时优惠' });
  }
  if (m.refund_rate > 10) {
    anomalies.push({ type: 'danger', metric: '退款率', value: m.refund_rate + '%', message: '退款率超过预警阈值10%', suggestion: '建议检查商品质量问题，优化详情页描述' });
  }
  if (m.interaction_rate > 0 && m.interaction_rate < 25) {
    anomalies.push({ type: 'warning', metric: '互动率', value: m.interaction_rate + '%', message: '互动率偏低，观众参与度不高', suggestion: '建议增加抽奖、问答等互动环节' });
  }
  return { metrics: m, anomalies };
}

export async function getDimensionOptions() {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const [anchors, products, activities] = await Promise.all([
        duckdbQuery('SELECT DISTINCT anchor_id, anchor_name FROM sessions ORDER BY anchor_name'),
        duckdbQuery('SELECT DISTINCT product_id, product_name, product_type FROM sessions ORDER BY product_name'),
        duckdbQuery('SELECT DISTINCT activity_id, activity_name FROM sessions ORDER BY activity_name')
      ]);
      return { anchors, products, activities };
    } catch (e) {
      console.log('[维度选项] DuckDB 失败，使用 JSON 数据');
    }
  }
  
  loadJSONData();
  const anchorMap = new Map();
  const productMap = new Map();
  const activityMap = new Map();
  sessionsData.forEach(r => {
    if (!anchorMap.has(r.anchor_id)) anchorMap.set(r.anchor_id, { anchor_id: r.anchor_id, anchor_name: r.anchor_name });
    if (!productMap.has(r.product_id)) productMap.set(r.product_id, { product_id: r.product_id, product_name: r.product_name, product_type: r.product_type });
    if (!activityMap.has(r.activity_id)) activityMap.set(r.activity_id, { activity_id: r.activity_id, activity_name: r.activity_name });
  });
  return {
    anchors: Array.from(anchorMap.values()).sort((a, b) => a.anchor_name.localeCompare(b.anchor_name)),
    products: Array.from(productMap.values()).sort((a, b) => a.product_name.localeCompare(b.product_name)),
    activities: Array.from(activityMap.values()).sort((a, b) => a.activity_name.localeCompare(b.activity_name))
  };
}

export async function getFulfillmentStats(filters = {}) {
  await initDuckDB();
  
  if (duckdbAvailable) {
    try {
      const cond = [];
      const params = [];
      if (filters.anchorIds?.length > 0) { cond.push('anchor_id IN (' + filters.anchorIds.map(() => '?').join(',') + ')'); params.push(...filters.anchorIds); }
      if (filters.productIds?.length > 0) { cond.push('product_id IN (' + filters.productIds.map(() => '?').join(',') + ')'); params.push(...filters.productIds); }
      if (filters.timeSlots?.length > 0) { cond.push('time_slot IN (' + filters.timeSlots.map(() => '?').join(',') + ')'); params.push(...filters.timeSlots); }
      if (filters.activityIds?.length > 0) { cond.push('activity_id IN (' + filters.activityIds.map(() => '?').join(',') + ')'); params.push(...filters.activityIds); }
      if (filters.sources?.length > 0) { cond.push('source_channel IN (' + filters.sources.map(() => '?').join(',') + ')'); params.push(...filters.sources); }
      if (filters.productType) { cond.push('product_type = ?'); params.push(filters.productType); }
      cond.push('has_order = 1');
      const where = 'WHERE ' + cond.join(' AND ');
      
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
      return await duckdbQuery(sql, params);
    } catch (e) {
      console.log('[履约统计] DuckDB 失败，使用 JSON 聚合');
    }
  }
  
  loadJSONData();
  const filtered = filterData(sessionsData, filters).filter(r => r.has_order);
  const types = {};
  filtered.forEach(r => {
    const t = r.product_type || 'unknown';
    if (!types[t]) {
      types[t] = { product_type: t, total_orders: 0, fulfilled_orders: 0, fulfillment_rate: 0 };
    }
    types[t].total_orders++;
    if (r.is_fulfilled === 1 || r.is_fulfilled === true) types[t].fulfilled_orders++;
  });
  return Object.values(types).map(t => ({
    ...t,
    fulfillment_rate: t.total_orders > 0 ? Number((t.fulfilled_orders * 100 / t.total_orders).toFixed(2)) : 0
  })).sort((a, b) => a.product_type.localeCompare(b.product_type));
}
