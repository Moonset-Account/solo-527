import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at bigint NOT NULL
      )
    `);

    const migrationsDir = join(import.meta.dirname, '../../drizzle');
    const journalPath = join(migrationsDir, 'meta/_journal.json');
    const journal = JSON.parse(readFileSync(journalPath, 'utf-8'));

    const applied = await client.query('SELECT hash FROM "__drizzle_migrations"');
    const appliedHashes = new Set(applied.rows.map((r: any) => r.hash));

    for (const entry of journal.entries) {
      const tag = entry.tag;
      const sqlFile = join(migrationsDir, `${tag}.sql`);

      if (appliedHashes.has(tag)) {
        console.log(`  ✓ ${tag} (already applied)`);
        continue;
      }

      console.log(`  → Applying ${tag}...`);
      const sql = readFileSync(sqlFile, 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
          [tag, Date.now()]
        );
        await client.query('COMMIT');
        console.log(`  ✓ ${tag} applied successfully`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '42710' || err.code === '42P07' || err.code === '42P16') {
          console.log(`  ✓ ${tag} (objects already exist, marking as applied)`);
          await client.query(
            'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
            [tag, Date.now()]
          );
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
