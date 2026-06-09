require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { cleanHistoricalRecords, cleanTicketRecord } = require('../services/dataCleaner');
const logger = require('../utils/logger');

const args = process.argv.slice(2);
const inputPath = args[0] || process.env.INPUT_PATH;
const outputPath = args[1] || process.env.OUTPUT_PATH || './data/cleaned.json';

if (!inputPath) {
  console.error('用法: node src/scripts/clean-data.js <input.json> [output.json]');
  console.error('');
  console.error('支持的输入格式: JSON数组，每条记录包含字段: content/text/description, category, urgency, district, block, caller等');
  process.exit(1);
}

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

async function main() {
  const input = resolvePath(inputPath);
  const output = resolvePath(outputPath);

  if (!fs.existsSync(input)) {
    console.error(`输入文件不存在: ${input}`);
    process.exit(1);
  }

  logger.info(`加载输入文件: ${input}`);
  const raw = JSON.parse(fs.readFileSync(input, 'utf-8'));
  if (!Array.isArray(raw)) {
    console.error('输入文件必须是JSON数组');
    process.exit(1);
  }

  logger.info(`输入条数: ${raw.length}`);

  const cleaned = cleanHistoricalRecords(raw);

  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(output, JSON.stringify(cleaned, null, 2), 'utf-8');

  logger.info(`清洗完成: ${cleaned.length} 条 -> ${output}`);
  logger.info(`丢弃: ${raw.length - cleaned.length} 条`);

  if (cleaned.length) {
    const sample = cleaned[0];
    logger.info('清洗后字段:', Object.keys(sample));
    if (sample.keywords) logger.info('关键词提取示例:', sample.keywords.slice(0, 5));
    if (sample.extracted_location) logger.info('位置抽取示例:', sample.extracted_location);
  }
}

main().catch(e => {
  logger.error('清洗失败', { error: e.message, stack: e.stack });
  process.exit(1);
});
