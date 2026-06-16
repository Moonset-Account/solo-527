import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ 环境变量 ${name} 未设置`);
    process.exit(1);
  }
  return v;
}

export function buildPgConnectionString(): string {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const match = url.match(/https:\/\/([^.]+)\.(supabase\.co|supabase\.in|supabase\.link)/);
  if (!match) {
    console.error(`❌ 无法从 NEXT_PUBLIC_SUPABASE_URL 解析项目 ID: ${url}`);
    console.error('   URL 格式应为 https://<project-id>.supabase.co');
    process.exit(1);
  }

  const projectId = match[1];
  const region = match[2] === 'supabase.in' ? 'ap-southeast-1' : 'us-east-1';
  const host = `db.${projectId}.supabase.co`;

  return `postgresql://postgres.${projectId}:${serviceKey}@${host}:5432/postgres?sslmode=require`;
}

export async function createPgClient(): Promise<Client> {
  const connStr = buildPgConnectionString();
  const client = new Client({
    connectionString: connStr,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

export async function executePgScript(client: Client, sql: string): Promise<void> {
  const statements = splitSqlStatements(sql);
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      await client.query(stmt);
    } catch (e: any) {
      if (e.message?.includes('already exists') || e.code === '42P07' || e.code === '42710') {
        console.log(`  ℹ️  [语句 ${i + 1}] 跳过（已存在）`);
        continue;
      }
      console.error(`\n❌ [语句 ${i + 1}] 执行失败:\n${stmt.substring(0, 200)}${stmt.length > 200 ? '...' : ''}`);
      console.error(`   错误: ${e.message}`);
      throw e;
    }
  }
}

export function splitSqlStatements(sql: string): string[] {
  const result: string[] = [];
  let current = '';
  let inString = false;
  let inDollar = false;
  let dollarTag = '';
  let inComment = false;
  let inLineComment = false;
  let depth = 0;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += c;
      if (c === '\n') inLineComment = false;
      continue;
    }

    if (inComment) {
      current += c;
      if (c === '*' && next === '/') {
        inComment = false;
        current += next;
        i++;
      }
      continue;
    }

    if (inDollar) {
      current += c;
      if (c === '$') {
        let j = i + 1;
        let tag = '';
        while (j < sql.length && sql[j] !== '$' && tag.length < 100) {
          tag += sql[j];
          j++;
        }
        if (sql[j] === '$' && tag === dollarTag) {
          current += tag + '$';
          i = j;
          inDollar = false;
        }
      }
      continue;
    }

    if (inString) {
      current += c;
      if (c === "'" && next !== "'") inString = false;
      else if (c === "'" && next === "'") {
        current += next;
        i++;
      }
      continue;
    }

    if (c === '-' && next === '-') {
      inLineComment = true;
      current += c;
      continue;
    }

    if (c === '/' && next === '*') {
      inComment = true;
      current += c + next;
      i++;
      continue;
    }

    if (c === '$') {
      let j = i + 1;
      let tag = '';
      while (j < sql.length && sql[j] !== '$' && tag.length < 100) {
        tag += sql[j];
        j++;
      }
      if (sql[j] === '$') {
        inDollar = true;
        dollarTag = tag;
        current += '$' + tag + '$';
        i = j;
        continue;
      }
    }

    if (c === "'") {
      inString = true;
      current += c;
      continue;
    }

    if (c === '(' || c === '[' || c === '{') {
      depth++;
      current += c;
      continue;
    }

    if (c === ')' || c === ']' || c === '}') {
      depth--;
      current += c;
      continue;
    }

    if (c === ';' && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) result.push(trimmed);
      current = '';
      continue;
    }

    current += c;
  }

  const trimmed = current.trim();
  if (trimmed) result.push(trimmed);

  return result;
}

export async function listTables(client: Client): Promise<string[]> {
  const r = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name"
  );
  return r.rows.map((x: any) => x.table_name);
}

export async function countRows(client: Client, table: string): Promise<number> {
  try {
    const r = await client.query(`SELECT COUNT(*)::int AS c FROM "${table}"`);
    return r.rows[0].c;
  } catch {
    return -1;
  }
}
