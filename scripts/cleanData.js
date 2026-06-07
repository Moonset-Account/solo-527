import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

let db = null;
let duckdbAvailable = false;

async function initDB() {
  try {
    const duckdbModule = await import('duckdb');
    const duckdb = duckdbModule.default;
    db = new duckdb.Database(path.join(dataDir, 'analytics.db'));
    duckdbAvailable = true;
    console.log('[清洗] DuckDB 可用，将写入 analytics.db');
  } catch (e) {
    console.log('[清洗] DuckDB 不可用，仅生成 cleaned JSON 文件:', e.message);
  }
}

function loadJSON(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error('文件不存在: ' + filePath);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function cleanSessions(sessions) {
  console.log('清洗会话数据...');
  
  const cleaned = sessions.filter(s => {
    if (!s.user_id || !s.session_id) return false;
    if (s.watch_duration_seconds < 0 || s.watch_duration_seconds > 7200) return false;
    if (s.order_amount < 0) return false;
    if (s.refund_amount < 0) return false;
    return true;
  });
  
  const deduplicated = [];
  const seen = new Set();
  for (const s of cleaned) {
    const key = s.session_id;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(s);
    }
  }
  
  console.log('原始数据: ' + sessions.length + ' 条，清洗后: ' + deduplicated.length + ' 条');
  return deduplicated;
}

function cleanPresentationSlots(slots) {
  console.log('清洗讲解时段数据...');
  
  const cleaned = slots.filter(s => {
    if (!s.slot_id || !s.anchor_id || !s.product_id) return false;
    if (s.duration_seconds < 60 || s.duration_seconds > 3600) return false;
    if (s.viewers_peak < 0) return false;
    return true;
  });
  
  console.log('原始数据: ' + slots.length + ' 条，清洗后: ' + cleaned.length + ' 条');
  return cleaned;
}

function createTables() {
  if (!duckdbAvailable) {
    console.log('[清洗] 跳过 DuckDB 建表');
    return;
  }
  console.log('创建数据库表...');
  
  db.exec(`
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS presentation_slots;
    
    CREATE TABLE sessions (
      session_id VARCHAR PRIMARY KEY,
      user_id VARCHAR,
      date DATE,
      time_slot VARCHAR,
      anchor_id VARCHAR,
      anchor_name VARCHAR,
      product_id VARCHAR,
      product_name VARCHAR,
      product_type VARCHAR,
      product_category VARCHAR,
      product_price DECIMAL,
      activity_id VARCHAR,
      activity_name VARCHAR,
      source_channel VARCHAR,
      watch_duration_seconds INTEGER,
      has_interaction INTEGER,
      has_cart_add INTEGER,
      has_order INTEGER,
      order_amount DECIMAL,
      order_id VARCHAR,
      has_refund INTEGER,
      refund_amount DECIMAL,
      refund_reason VARCHAR,
      is_fulfilled INTEGER
    );
    
    CREATE TABLE presentation_slots (
      slot_id VARCHAR PRIMARY KEY,
      date DATE,
      anchor_id VARCHAR,
      anchor_name VARCHAR,
      product_id VARCHAR,
      product_name VARCHAR,
      product_type VARCHAR,
      activity_id VARCHAR,
      activity_name VARCHAR,
      source_channel VARCHAR,
      time_slot VARCHAR,
      start_minute INTEGER,
      duration_seconds INTEGER,
      viewers_peak INTEGER,
      interaction_count INTEGER,
      cart_add_count INTEGER,
      order_count INTEGER,
      gmv DECIMAL
    );
    
    CREATE INDEX idx_sessions_date ON sessions(date);
    CREATE INDEX idx_sessions_anchor ON sessions(anchor_id);
    CREATE INDEX idx_sessions_product ON sessions(product_id);
    CREATE INDEX idx_sessions_type ON sessions(product_type);
    CREATE INDEX idx_sessions_source ON sessions(source_channel);
    CREATE INDEX idx_sessions_slot ON sessions(time_slot);
    
    CREATE INDEX idx_slots_date ON presentation_slots(date);
    CREATE INDEX idx_slots_anchor ON presentation_slots(anchor_id);
    CREATE INDEX idx_slots_product ON presentation_slots(product_id);
    CREATE INDEX idx_slots_activity ON presentation_slots(activity_id);
    CREATE INDEX idx_slots_source ON presentation_slots(source_channel);
    CREATE INDEX idx_slots_slot ON presentation_slots(time_slot);
    CREATE INDEX idx_slots_type ON presentation_slots(product_type);
  `);
}

function insertSessions(sessions) {
  if (!duckdbAvailable) {
    console.log('[清洗] 跳过 DuckDB 会话数据插入');
    return;
  }
  console.log('插入会话数据到DuckDB...');
  
  const stmt = db.prepare(`
    INSERT INTO sessions VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  db.exec('BEGIN TRANSACTION');
  for (const s of sessions) {
    stmt.run(
      s.session_id,
      s.user_id,
      s.date,
      s.time_slot,
      s.anchor_id,
      s.anchor_name,
      s.product_id,
      s.product_name,
      s.product_type,
      s.product_category,
      s.product_price,
      s.activity_id,
      s.activity_name,
      s.source_channel,
      s.watch_duration_seconds,
      s.has_interaction,
      s.has_cart_add,
      s.has_order,
      s.order_amount,
      s.order_id,
      s.has_refund,
      s.refund_amount,
      s.refund_reason,
      s.is_fulfilled
    );
  }
  db.exec('COMMIT');
  console.log('插入 ' + sessions.length + ' 条会话数据');
}

function insertPresentationSlots(slots) {
  if (!duckdbAvailable) {
    console.log('[清洗] 跳过 DuckDB 讲解时段数据插入');
    return;
  }
  console.log('插入讲解时段数据到DuckDB...');
  
  const stmt = db.prepare(`
    INSERT INTO presentation_slots VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  db.exec('BEGIN TRANSACTION');
  for (const s of slots) {
    stmt.run(
      s.slot_id,
      s.date,
      s.anchor_id,
      s.anchor_name,
      s.product_id,
      s.product_name,
      s.product_type,
      s.activity_id,
      s.activity_name,
      s.source_channel,
      s.time_slot,
      s.start_minute,
      s.duration_seconds,
      s.viewers_peak,
      s.interaction_count,
      s.cart_add_count,
      s.order_count,
      s.gmv
    );
  }
  db.exec('COMMIT');
  console.log('插入 ' + slots.length + ' 条讲解时段数据');
}

function runAnalytics(cleanedSessions, cleanedSlots) {
  console.log('\n=== 数据质量检查 ===');
  
  console.log('总会话数: ' + cleanedSessions.length);
  
  const typeDist = {};
  cleanedSessions.forEach(s => {
    typeDist[s.product_type] = (typeDist[s.product_type] || 0) + 1;
  });
  console.log('商品类型分布:', typeDist);
  
  let watchUv = new Set(cleanedSessions.map(s => s.user_id)).size;
  let interactionUv = 0, cartAddUv = 0, orderUv = 0, gmv = 0, refundCount = 0;
  cleanedSessions.forEach(s => {
    if (s.has_interaction) interactionUv++;
    if (s.has_cart_add) cartAddUv++;
    if (s.has_order) orderUv++;
    gmv += s.order_amount || 0;
    if (s.has_refund) refundCount++;
  });
  console.log('核心指标:', { watch_uv: watchUv, interaction_uv: interactionUv, cart_add_uv: cartAddUv, order_uv: orderUv, gmv: gmv, refund_count: refundCount });
  
  const fulfill = {};
  cleanedSessions.filter(s => s.has_order).forEach(s => {
    const t = s.product_type;
    if (!fulfill[t]) fulfill[t] = { total_orders: 0, fulfilled: 0 };
    fulfill[t].total_orders++;
    if (s.is_fulfilled === 1 || s.is_fulfilled === true) fulfill[t].fulfilled++;
  });
  const fulfillmentStats = Object.entries(fulfill).map(([t, v]) => ({
    product_type: t,
    total_orders: v.total_orders,
    fulfilled_orders: v.fulfilled,
    fulfillment_rate: v.total_orders > 0 ? Number((v.fulfilled * 100 / v.total_orders).toFixed(2)) : 0
  }));
  console.log('履约表现（分类型）:', fulfillmentStats);
  
  console.log('总讲解时段数: ' + cleanedSlots.length);
  
  const timeSlots = [...new Set(cleanedSlots.map(s => s.time_slot))].slice(0, 5);
  console.log('讲解时段示例:', timeSlots);

  const activities = [...new Set(cleanedSlots.map(s => s.activity_id + '|' + s.activity_name))].slice(0, 5);
  console.log('讲解时段活动类型:', activities.map(a => ({ activity_id: a.split('|')[0], activity_name: a.split('|')[1] })));

  const sources = [...new Set(cleanedSlots.map(s => s.source_channel))].slice(0, 5);
  console.log('讲解时段观众来源:', sources);
  
  if (duckdbAvailable) {
    console.log('\n[DuckDB] 验证数据库写入...');
    db.all('SELECT COUNT(*) as cnt FROM sessions', (err, res) => {
      if (err) console.error('  会话表查询失败:', err.message);
      else console.log('  DuckDB 会话数:', res[0].cnt);
    });
    db.all('SELECT COUNT(*) as cnt FROM presentation_slots', (err, res) => {
      if (err) console.error('  时段表查询失败:', err.message);
      else console.log('  DuckDB 时段数:', res[0].cnt);
    });
  }
}

async function main() {
  try {
    await initDB();
    
    const rawSessions = loadJSON('raw_sessions.json');
    const rawSlots = loadJSON('raw_presentation_slots.json');
    
    if (rawSessions.length === 0) {
      console.log('未找到原始数据，请先运行 npm run generate:data');
      process.exit(1);
    }
    
    createTables();
    
    const cleanedSessions = cleanSessions(rawSessions);
    const cleanedSlots = cleanPresentationSlots(rawSlots);
    
    fs.writeFileSync(
      path.join(dataDir, 'cleaned_sessions.json'),
      JSON.stringify(cleanedSessions, null, 2)
    );
    fs.writeFileSync(
      path.join(dataDir, 'cleaned_presentation_slots.json'),
      JSON.stringify(cleanedSlots, null, 2)
    );
    
    insertSessions(cleanedSessions);
    insertPresentationSlots(cleanedSlots);
    
    runAnalytics(cleanedSessions, cleanedSlots);
    
    setTimeout(() => {
      console.log('\n数据清洗完成！');
      if (duckdbAvailable && db) db.close();
    }, 1500);
  } catch (error) {
    console.error('清洗失败:', error);
    process.exit(1);
  }
}

main();
