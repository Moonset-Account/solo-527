import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase 配置检查\n');

if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 未配置');
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL.substring(0, 40)}...`);
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your-anon-key') {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: 未配置');
} else {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
}

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY: 未配置（仅用于数据库初始化脚本）');
} else {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
}

if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.log('\n❌ 配置不完整，请先在 .env.local 中填写 Supabase 配置');
  process.exit(1);
}

console.log('\n🚀 正在测试连接...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

const expectedTables = [
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

console.log('\n📋 数据库表检查:');
const results: { table: string; status: string; count?: number }[] = [];

for (const table of expectedTables) {
  try {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
    if (error) {
      if (error.message.includes('does not exist')) {
        results.push({ table, status: '❌ 不存在' });
      } else if (error.message.includes('policy')) {
        results.push({ table, status: '⚠️  RLS 策略问题' });
      } else {
        results.push({ table, status: `❌ ${error.message.substring(0, 30)}` });
      }
    } else {
      const countResult = await supabase.from(table).select('*', { count: 'exact', head: true });
      results.push({ table, status: '✅ 存在', count: countResult.count || 0 });
    }
  } catch (e: any) {
    results.push({ table, status: `❌ ${e.message?.substring(0, 30) || '错误'}` });
  }
}

for (const r of results) {
  const countStr = r.count !== undefined ? ` (${r.count} 条)` : '';
  console.log(`   ${r.table.padEnd(25)} ${r.status}${countStr}`);
}

const existing = results.filter((r) => r.status.startsWith('✅')).length;
console.log(`\n📊 总计: ${existing}/${expectedTables.length} 张表已就绪`);

if (existing === expectedTables.length) {
  console.log('\n🎉 数据库配置完整!');
  console.log('\n📝 下一步:');
  console.log('   如需插入示例数据: `npm run db:seed`');
  console.log('   启动开发服务器: `npm run dev`');
} else if (existing === 0) {
  console.log('\n⚠️  数据库表未创建');
  console.log('\n📝 下一步:');
  console.log('   1. 在 Supabase SQL Editor 中执行 supabase/migrations/001_init_schema.sql');
  console.log('   2. 或在 Supabase Dashboard 中手动创建 exec_sql 函数后运行 `npm run db:init`');
  process.exit(1);
} else {
  console.log('\n⚠️  部分表缺失，请检查 supabase/migrations/001_init_schema.sql');
  process.exit(1);
}
