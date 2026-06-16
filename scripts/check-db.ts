import { createPgClient, listTables, countRows } from './_pg';

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

    const tables = await listTables(client);
    console.log('📊 表结构检查:');
    let ok = 0;
    for (const t of EXPECTED_TABLES) {
      const exists = tables.includes(t);
      const mark = exists ? '✅' : '❌';
      const c = exists ? await countRows(client, t) : 0;
      console.log(`  ${mark} ${t}  (${c} 行)`);
      if (exists) ok++;
    }

    console.log(`\n表结构: ${ok}/${EXPECTED_TABLES} 就绪`);
    if (ok < EXPECTED_TABLES.length) {
      console.log('\n💡 请先执行: npm run db:init');
      process.exit(1);
    }

    const users = await countRows(client, 'users');
    if (users === 0) {
      console.log('\n💡 种子数据未加载，请执行: npm run db:seed');
      process.exit(1);
    }

    console.log('\n🎉 数据库完全就绪，可以启动应用: npm run dev');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n💥 检查失败:', e.message);
  process.exit(1);
});
