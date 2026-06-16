import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPgClient, executePgScript, countRows } from './_pg';

const TABLES = [
  'users',
  'lead_stages',
  'lead_tags',
  'leads',
  'follow_up_records',
  'survey_records',
  'contract_attachments',
  'change_logs',
  'revisit_records',
];

async function main() {
  const client = await createPgClient();
  try {
    console.log('✅ PostgreSQL 连接成功\n');

    const sql = readFileSync(resolve('supabase/migrations/002_seed_data.sql'), 'utf-8');
    console.log('🌱 执行 002_seed_data.sql（初始用户、阶段、标签、示例线索、变更记录）...');
    await executePgScript(client, sql);
    console.log('✅ 种子数据插入完成\n');

    console.log('📊 各表数据量:');
    let total = 0;
    for (const t of TABLES) {
      const c = await countRows(client, t);
      console.log(`  ${c >= 0 ? '✅' : '❌'} ${t}: ${c >= 0 ? c + ' 行' : '表不存在'}`);
      if (c > 0) total += c;
    }
    console.log(`\n总共: ${total} 条记录已入库`);
    console.log('\n🎉 种子数据加载成功！下一步执行: npm run dev');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n💥 种子数据加载失败:', e.message);
  process.exit(1);
});
