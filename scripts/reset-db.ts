import * as readline from 'readline';
import { createPgClient, listTables } from './_pg';

const ALL_TABLES = [
  'change_logs',
  'revisit_records',
  'follow_up_records',
  'survey_records',
  'contract_attachments',
  'leads',
  'lead_stages',
  'lead_tags',
  'users',
];

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

async function main() {
  const answer1 = await ask('⚠️  这将删除所有业务表和数据！确认? (输入 YES 继续): ');
  if (answer1.trim() !== 'YES') {
    console.log('已取消');
    return;
  }

  const answer2 = await ask('⚠️  二次确认，不可恢复！输入 DELETE ALL 确认删除: ');
  if (answer2.trim() !== 'DELETE ALL') {
    console.log('已取消');
    return;
  }

  const client = await createPgClient();
  try {
    console.log('\n🗑️  删除所有业务表...');
    const tables = await listTables(client);
    const toDrop = ALL_TABLES.filter((t) => tables.includes(t));
    for (const t of toDrop) {
      await client.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
      console.log(`  ✅ 删除 ${t}`);
    }

    await client.query(`DROP FUNCTION IF EXISTS update_modified_column CASCADE`);
    await client.query(`DROP FUNCTION IF EXISTS exec_sql CASCADE`);
    console.log('  ✅ 删除触发器函数和辅助函数');

    console.log('\n🎉 所有表已重置！重新初始化: npm run db:init && npm run db:seed');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('\n💥 重置失败:', e.message);
  process.exit(1);
});
