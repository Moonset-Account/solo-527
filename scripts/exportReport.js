import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import duckdb from 'duckdb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const exportDir = path.join(dataDir, 'exports');

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const db = new duckdb.Database(path.join(dataDir, 'analytics.db'));

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function arrayToCSV(data) {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val !== null && val !== undefined ? val : '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function exportFunnelReport() {
  console.log('导出转化漏斗报告...');
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT
        COUNT(DISTINCT user_id) as watch_uv,
        SUM(has_interaction) as interaction_uv,
        SUM(has_cart_add) as cart_add_uv,
        SUM(has_order) as order_uv,
        SUM(CASE WHEN has_order = 1 AND has_refund = 0 THEN 1 ELSE 0 END) as paid_uv,
        ROUND(SUM(has_interaction) * 100.0 / COUNT(DISTINCT user_id), 2) as interaction_rate,
        ROUND(SUM(has_cart_add) * 100.0 / COUNT(DISTINCT user_id), 2) as cart_add_rate,
        ROUND(SUM(has_order) * 100.0 / COUNT(DISTINCT user_id), 2) as conversion_rate
      FROM sessions
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const csv = arrayToCSV(rows);
      const filename = path.join(exportDir, `funnel_report_${getTimestamp()}.csv`);
      fs.writeFileSync(filename, '\ufeff' + csv);
      console.log(`漏斗报告已导出: ${filename}`);
      resolve(filename);
    });
  });
}

function exportProductReport() {
  console.log('导出商品报告...');
  
  return new Promise((resolve, reject) => {
    db.all(`
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
        ROUND(SUM(has_refund) * 100.0 / NULLIF(SUM(has_order), 0), 2) as refund_rate
      FROM sessions
      GROUP BY product_id, product_name, product_type, product_category
      ORDER BY gmv DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const csv = arrayToCSV(rows);
      const filename = path.join(exportDir, `product_report_${getTimestamp()}.csv`);
      fs.writeFileSync(filename, '\ufeff' + csv);
      console.log(`商品报告已导出: ${filename}`);
      resolve(filename);
    });
  });
}

function exportFulfillmentReport() {
  console.log('导出履约报告...');
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT
        product_type,
        COUNT(*) as total_orders,
        SUM(CASE WHEN is_fulfilled = 1 OR is_fulfilled = true THEN 1 ELSE 0 END) as fulfilled_orders,
        ROUND(SUM(CASE WHEN is_fulfilled = 1 OR is_fulfilled = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as fulfillment_rate
      FROM sessions
      WHERE has_order = 1
      GROUP BY product_type
      ORDER BY product_type
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const csv = arrayToCSV(rows);
      const filename = path.join(exportDir, `fulfillment_report_${getTimestamp()}.csv`);
      fs.writeFileSync(filename, '\ufeff' + csv);
      console.log(`履约报告已导出: ${filename}`);
      resolve(filename);
    });
  });
}

async function main() {
  try {
    console.log('开始导出报表...\n');
    
    await Promise.all([
      exportFunnelReport(),
      exportProductReport(),
      exportFulfillmentReport()
    ]);
    
    console.log('\n所有报表导出完成！');
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

main();
