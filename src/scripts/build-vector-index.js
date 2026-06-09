require('dotenv').config();
const logger = require('../utils/logger');
const { buildIndexFromDatabase, getIndexStats } = require('../services/vectorStore');
const { closeDb } = require('../utils/database');

async function main() {
  const batchSize = parseInt(process.argv[2] || '50', 10);
  logger.info(`使用 batch_size=${batchSize} 重建向量索引...`);
  const before = getIndexStats();
  logger.info(`现有索引: ${before.total} 条, 构建于 ${before.builtAt || 'N/A'}`);

  const result = await buildIndexFromDatabase(batchSize);
  const after = getIndexStats();

  logger.info('====== 构建完成 ======');
  logger.info(`索引条数: ${result.indexed}`);
  logger.info(`消耗 Tokens: ${result.totalTokens}`);
  logger.info(`类别数: ${Object.keys(after.categoryDistribution).length}`);
  logger.info(`Top 类别:`, Object.entries(after.categoryDistribution)
    .sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}:${v}`).join(', '));

  closeDb();
}

main().catch(e => {
  logger.error('构建索引失败', { error: e.message, stack: e.stack });
  closeDb();
  process.exit(1);
});
