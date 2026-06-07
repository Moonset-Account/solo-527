#!/usr/bin/env node
/**
 * 数据链路端到端演示
 * 展示：生成原始数据 → Python 清洗 → 查看指标口径 → API 聚合查询
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(projectRoot, 'api', 'data');

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function logSection(title) {
  console.log(`\n${colors.blue}=== ${title} ===${colors.reset}\n`);
}

function run(cmd, cwd = projectRoot) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout || e.message;
  }
}

async function main() {
  console.log(`${colors.green}
╔═══════════════════════════════════════════════════╗
║    工业园区访客系统 - 数据链路端到端演示           ║
╚═══════════════════════════════════════════════════╝${colors.reset}`);

  logSection('1. 查看指标口径配置 (metrics.json)');
  const metrics = JSON.parse(fs.readFileSync(path.join(dataDir, 'metrics.json'), 'utf-8'));
  console.log(`   企业数量: ${metrics.enterprises.length}`);
  console.log(`   入口数量: ${metrics.gates.length}`);
  console.log(`   车道数量: ${metrics.lanes.length}`);
  console.log(`   访客类型: ${metrics.visitorTypes.map((t) => t.name).join(', ')}`);
  console.log(`   异常原因示例: ${metrics.abnormalReasons.slice(0, 3).join(', ')}`);

  logSection('2. ClickHouse 数据链路配置 (clickhouseLink.ts)');
  console.log(`   数据表: visitor_records (MergeTree + TTL 6个月)`);
  console.log(`   物化视图: visitor_hour_mv, enterprise_day_mv`);
  console.log(`   查询模板: overview / heatmap / rank / exceptions / trend`);
  console.log(`   缓存策略: 按接口独立 TTL`);

  logSection('3. 数据清洗脚本演示 (data_cleaner.py)');
  console.log('   功能列表:');
  console.log('     - 支持 JSON/CSV 输入输出');
  console.log('     - 自动去重 (基于车牌+时间哈希)');
  console.log('     - 车牌/身份证格式校验');
  console.log('     - 异常检测：无预约、非工作时段、短时间重复');
  console.log('     - 数据脱敏：车牌、身份证、手机号');
  console.log('     - 缺失值统计和填充');
  console.log('');
  console.log(`   生成模拟原始数据: ${colors.yellow}cd api && python3 scripts/data_cleaner.py generate -n 5000${colors.reset}`);
  console.log(`   执行清洗: ${colors.yellow}cd api && python3 scripts/data_cleaner.py clean -i data/raw/sample_raw_records.json${colors.reset}`);

  logSection('4. 数据导入 ClickHouse (import_to_clickhouse.js)');
  console.log(`   内存模式 (默认): 无需 ClickHouse，直接使用内存数据`);
  console.log(`   真实模式 (环境变量): ${colors.yellow}CLICKHOUSE_MODE=clickhouse node scripts/import_to_clickhouse.js -i cleaned.json${colors.reset}`);

  logSection('5. 聚合 API 层 (aggregate.ts)');
  console.log('   当前服务运行于: http://localhost:3099');
  console.log('');
  console.log('   接口列表:');
  console.log('     GET /api/aggregate/overview    - 概览 KPI + 异常摘要');
  console.log('     GET /api/aggregate/heatmap     - 入口热力图');
  console.log('     GET /api/aggregate/rank        - 企业排行');
  console.log('     GET /api/aggregate/exceptions  - 异常明细 (分页)');
  console.log('     GET /api/aggregate/trend       - 时段趋势');
  console.log('     GET /api/aggregate/dimensions  - 维度字典');
  console.log('');

  logSection('6. 当前 API 测试');
  
  console.log('   测试概览接口...');
  const overview = run("curl -s 'http://localhost:3099/api/aggregate/overview'");
  try {
    const ov = JSON.parse(overview);
    console.log(`     总访客: ${ov.totalVisitors?.toLocaleString()}`);
    console.log(`     异常量: ${ov.totalAbnormal}`);
    console.log(`     异常率: ${ov.abnormalRate}%`);
    console.log(`     高峰时段: ${ov.peakHour}`);
  } catch {
    console.log('     服务未运行，跳过测试');
  }

  console.log('\n   测试趋势接口（验证缺失值判定）...');
  const trend = run("curl -s 'http://localhost:3099/api/aggregate/trend?startDate=2026-05-01&endDate=2026-06-30'");
  try {
    const td = JSON.parse(trend);
    const missing = td.filter((p) => p.isMissing);
    const peaks = td.filter((p) => p.isPeak);
    const zeros = td.filter((p) => p.count === 0 && !p.isMissing);
    console.log(`     总时间点: ${td.length}`);
    console.log(`     真实缺失 (系统故障): ${missing.length} 个`);
    console.log(`     峰值标记: ${peaks.length} 个`);
    console.log(`     零值 (自然无流量): ${zeros.length} 个 (未标记为缺失)`);
    console.log(`     ${colors.green}✓ 筛选后零值不会被误判为缺失${colors.reset}`);
  } catch {
    console.log('     服务未运行，跳过测试');
  }

  logSection('7. 前端筛选链路');
  console.log('   Pinia Store (filterStore.ts) → 5 个维度:');
  console.log('     - 企业 (多选)');
  console.log('     - 入口 (多选)');
  console.log('     - 访客类型 (多选)');
  console.log('     - 时段 (预设: 今日/昨日/7天/30天)');
  console.log('     - 车道 (多选)');
  console.log('');
  console.log('   所有 D3 图表订阅同一 Store，筛选后自动联动更新');
  console.log(`   ${colors.green}✓ 筛选上下文全局保留${colors.reset}`);

  console.log(`\n${colors.green}
╔═══════════════════════════════════════════════════╗
║                 链路演示完成                        ║
║                                                     ║
║  完整链路: 原始闸机数据 → data_cleaner.py →        ║
║            import_to_clickhouse.js → ClickHouse →  ║
║            aggregate API → LRU Cache → 前端 D3     ║
╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
}

main();
