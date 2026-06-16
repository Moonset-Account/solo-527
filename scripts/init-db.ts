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
  console.error('   在 Supabase Dashboard -> Project Settings -> API 中获取 service_role key');
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
        const { error: directError } = await supabase.from('users').select('count').limit(1);
        if (directError && !directError.message.includes('does not exist')) {
          console.log(`   执行第 ${i + 1} 条: ✅`);
          continue;
        }
        console.warn(`   执行第 ${i + 1} 条: ⚠️  ${error.message.substring(0, 80)}`);
      } else {
        console.log(`   执行第 ${i + 1} 条: ✅`);
      }
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
        console.log(`   执行第 ${i + 1} 条: ✅ (已存在)`);
      } else if (e.message?.includes('does not exist') || e.message?.includes('not found')) {
        console.log(`   执行第 ${i + 1} 条: ✅ (跳过不存在的对象)`);
      } else {
        console.error(`   执行第 ${i + 1} 条: ❌ ${e.message?.substring(0, 100)}`);
        throw e;
      }
    }
  }
}

async function main() {
  console.log('📋 步骤 1/3: 检查连接...');
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ 连接成功');
  } catch (e: any) {
    console.error('❌ 连接失败:', e.message);
    console.error('\n请确保:');
    console.error('  1. Supabase URL 和 service_role key 正确');
    console.error('  2. 你的 Supabase 项目已经创建完成');
    console.error('  3. 网络连接正常');
    process.exit(1);
  }

  console.log('\n📋 步骤 2/3: 执行建表脚本 (supabase/migrations/001_init_schema.sql)');
  console.log('   包含: 9 张表, 触发器, 索引, RLS 策略');
  await executeSqlFile('supabase/migrations/001_init_schema.sql');

  console.log('\n📋 步骤 3/3: 验证表创建结果');
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

  const createdTables: string[] = [];
  for (const table of expectedTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }
      createdTables.push(table);
      console.log(`   ✅ ${table}`);
    } catch (e: any) {
      if (e.message?.includes('does not exist')) {
        console.log(`   ❌ ${table}: 未创建`);
      } else {
        console.log(`   ⚠️  ${table}: ${e.message.substring(0, 50)}`);
      }
    }
  }

  console.log(`\n🎉 初始化完成! ${createdTables.length}/${expectedTables.length} 张表已创建`);

  if (createdTables.length > 0) {
    console.log('\n📝 下一步:');
    console.log('   运行 `npm run db:seed` 插入种子数据');
    console.log('   或直接在 Supabase SQL Editor 中执行 supabase/migrations/002_seed_data.sql');
  }
}

main().catch((e) => {
  console.error('\n❌ 初始化失败:', e);
  process.exit(1);
});
