import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createPgClient, executePgScript, listTables } from './_pg';

const EXPECTED_TABLES = [
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

    const sql000 = readFileSync(resolve('supabase/migrations/000_create_exec_sql.sql'), 'utf-8');
    const sql001 = readFileSync(resolve('supabase/migrations/001_init_schema.sql'), 'utf-8');

    console.log('📦 步骤 1: 创建 exec_sql 辅助函数...');
    await executePgScript(client, sql000);
    console.log('✅ exec_sql 函数就绪\n');

    console.log('📦 步骤 2: 执行 001_init_schema.sql（9 张表 + 触发器 + 索引 + RLS 策略）...');
    await executePgScript(client, sql001);
    console.log('✅ 建表脚本执行完成\n');

    const tables = await listTables(client);
    console.log('📊 验证结果:');
    let ok = 0;
    for (const t of EXPECTED_TABLES) {
      const exists = tables.includes(t);
      const mark = exists ? '✅' : '❌';
      console.log(`  ${mark} ${t}`);
      if (exists) ok++;
    }
    console.log(`\n总共: ${ok}/${EXPECTED_TABLES} 张表已创建`);

    if (ok < EXPECTED_TABLES.length) {
      console.error('\n❌ 仍有表未创建，请检查上方错误信息');
      process.exit(1);
    }

    console.log('\n🎉 数据库初始化成功！下一步执行: npm run db:seed');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n💥 初始化失败:', e.message);
  process.exit(1);
});
