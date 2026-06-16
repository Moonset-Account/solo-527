import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.error('❌ 错误: 请先在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const serviceKey = SUPABASE_SERVICE_ROLE_KEY as string;
if (!serviceKey || serviceKey === 'your-service-role-key') {
  console.error('❌ 错误: 请先在 .env.local 中配置 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const tablesInOrder = [
  'revisit_records',
  'change_logs',
  'contract_attachments',
  'survey_records',
  'follow_up_records',
  'leads',
  'lead_tags',
  'lead_stages',
  'users',
];

async function main() {
  console.log('⚠️  ⚠️  ⚠️  警告 ⚠️  ⚠️  ⚠️');
  console.log('此操作将删除所有表和数据！');
  console.log('表删除顺序:', tablesInOrder.join(' → '));
  console.log('');

  const answer = await new Promise<string>((resolve) => {
    rl.question('请输入 "DELETE ALL" 确认操作: ', resolve);
  });

  if (answer !== 'DELETE ALL') {
    console.log('❌ 已取消操作');
    process.exit(0);
  }

  console.log('\n🚀 正在连接 Supabase...');
  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });

  console.log('\n🗑️  正在删除表...');
  for (const table of tablesInOrder) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS public.${table} CASCADE;`,
      });
      if (error) {
        const { error: directError } = await supabase.from(table).select('count').limit(1);
        if (directError?.message.includes('does not exist')) {
          console.log(`   ${table}: ✅ 已不存在`);
          continue;
        }
        console.log(`   ${table}: ⚠️  ${error.message.substring(0, 60)}`);
      } else {
        console.log(`   ${table}: ✅ 已删除`);
      }
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        console.log(`   ${table}: ✅ 已不存在`);
      } else {
        console.log(`   ${table}: ❌ ${e.message.substring(0, 60)}`);
      }
    }
  }

  console.log('\n✅ 所有表已删除');
  console.log('\n📝 下一步:');
  console.log('   重建表结构: `npm run db:init`');
  console.log('   插入种子数据: `npm run db:seed`');

  rl.close();
}

main().catch((e) => {
  console.error('\n❌ 重置失败:', e);
  rl.close();
  process.exit(1);
});
