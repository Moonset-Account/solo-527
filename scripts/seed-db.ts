import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.error('❌ 错误: 请先在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
  console.error('❌ 错误: 请先在 .env.local 中配置 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 正在连接 Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function executeSqlFile(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), filePath);
  const sql = fs.readFileSync(fullPath, 'utf-8');

  const statements = sql
    .split(/;\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && !s.startsWith('/*'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.trim() === '') continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   执行第 ${i + 1} 条: ✅ (已存在)`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   执行第 ${i + 1} 条: ⚠️  表不存在，请先运行 npm run db:init`);
          throw error;
        } else {
          console.warn(`   执行第 ${i + 1} 条: ⚠️  ${error.message.substring(0, 80)}`);
        }
      } else {
        console.log(`   执行第 ${i + 1} 条: ✅`);
      }
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log(`   执行第 ${i + 1} 条: ✅ (已存在)`);
      } else {
        console.error(`   执行第 ${i + 1} 条: ❌ ${e.message?.substring(0, 100)}`);
        throw e;
      }
    }
  }
}

async function verifyData(): Promise<{ [key: string]: number }> {
  const tables = [
    'users',
    'lead_stages',
    'lead_tags',
    'leads',
    'follow_up_records',
    'survey_records',
    'change_logs',
  ];
  const counts: { [key: string]: number } = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        counts[table] = -1;
      } else {
        counts[table] = data?.length || 0;
      }
    } catch {
      counts[table] = -1;
    }
  }

  return counts;
}

async function main() {
  console.log('📋 步骤 1/3: 检查表是否已创建');
  const beforeCounts = await verifyData();
  if (beforeCounts.users === -1) {
    console.error('❌ 数据库表未创建，请先运行 `npm run db:init`');
    process.exit(1);
  }
  console.log('✅ 表已存在');

  console.log('\n📋 步骤 2/3: 执行种子数据脚本 (supabase/migrations/002_seed_data.sql)');
  console.log('   包含: 5 用户, 7 阶段, 15 标签, 6 线索, 5 跟进记录, 1 量房记录, 5 变更记录');
  await executeSqlFile('supabase/migrations/002_seed_data.sql');

  console.log('\n📋 步骤 3/3: 验证数据插入结果');
  const afterCounts = await verifyData();

  console.log('\n   数据统计:');
  for (const [table, count] of Object.entries(afterCounts)) {
    if (count >= 0) {
      const before = beforeCounts[table] || 0;
      const added = count - before;
      const addedStr = added > 0 ? `(+${added})` : '';
      console.log(`   ✅ ${table}: ${count} 条 ${addedStr}`);
    } else {
      console.log(`   ❌ ${table}: 读取失败`);
    }
  }

  console.log('\n🎉 种子数据插入完成!');
  console.log('\n📝 默认登录账号 (在 Supabase Auth 中配置密码):');
  console.log('   admin@example.com    - 超级管理员');
  console.log('   manager@example.com  - 销售经理');
  console.log('   sales1@example.com   - 销售顾问 (李销售)');
  console.log('   sales2@example.com   - 销售顾问 (王顾问)');
  console.log('   analyst@example.com  - 分析师');
  console.log('\n🚀 启动应用: `npm run dev`');
}

main().catch((e) => {
  console.error('\n❌ 种子数据插入失败:', e.message);
  process.exit(1);
});
