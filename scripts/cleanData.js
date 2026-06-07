import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import duckdb from 'duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

const db = new duckdb.Database(path.join(dataDir, 'analytics.db'));

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

function runAnalytics() {
  console.log('\n=== 数据质量检查 ===');
  
  db.all('SELECT COUNT(*) as total FROM sessions', (err, res) => {
    if (err) console.error(err);
    console.log('总会话数: ' + res[0].total);
  });
  
  db.all('SELECT product_type, COUNT(*) as cnt FROM sessions GROUP BY product_type', (err, res) => {
    if (err) console.error(err);
    console.log('商品类型分布:', res);
  });
  
  db.all(`
    SELECT 
      COUNT(DISTINCT user_id) as watch_uv,
      SUM(has_interaction) as interaction_uv,
      SUM(has_cart_add) as cart_add_uv,
      SUM(has_order) as order_uv,
      SUM(order_amount) as gmv,
      SUM(has_refund) as refund_count
    FROM sessions
  `, (err, res) => {
    if (err) console.error(err);
    console.log('核心指标:', res[0]);
  });
  
  db.all(`
    SELECT 
      product_type,
      COUNT(*) as total_orders,
      SUM(CASE WHEN is_fulfilled = 1 THEN 1 ELSE 0 END) as fulfilled,
      ROUND(SUM(CASE WHEN is_fulfilled = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as fulfillment_rate
    FROM sessions
    WHERE has_order = 1
    GROUP BY product_type
  `, (err, res) => {
    if (err) console.error(err);
    console.log('履约表现（分类型）:', res);
  });
  
  db.all('SELECT COUNT(*) as total FROM presentation_slots', (err, res) => {
    if (err) console.error(err);
    console.log('总讲解时段数: ' + res[0].total);
  });
  
  db.all('SELECT DISTINCT time_slot FROM presentation_slots LIMIT 5', (err, res) => {
    if (err) console.error(err);
    console.log('讲解时段示例:', res);
  });

  db.all('SELECT DISTINCT activity_id, activity_name FROM presentation_slots LIMIT 5', (err, res) => {
    if (err) console.error(err);
    console.log('讲解时段活动类型:', res);
  });

  db.all('SELECT DISTINCT source_channel FROM presentation_slots LIMIT 5', (err, res) => {
    if (err) console.error(err);
    console.log('讲解时段观众来源:', res);
  });
}

async function main() {
  try {
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
    
    runAnalytics();
    
    setTimeout(() => {
      console.log('\n数据清洗完成！');
      db.close();
    }, 1500);
  } catch (error) {
    console.error('清洗失败:', error);
    process.exit(1);
  }
}

main();
