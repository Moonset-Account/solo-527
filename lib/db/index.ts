import { Pool } from 'pg';
import type { MonitoringSite, Measurement, User, AnomalyNote } from '@/types';
import { generateSites, generateMeasurements } from '@/lib/utils/mockData';
import { ORGANIZATIONS } from '@/lib/utils/constants';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        '❌ DATABASE_URL 环境变量未设置。请配置 PostgreSQL/PostGIS 数据库连接字符串。\n' +
        '示例: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/water_quality\n\n' +
        '快速配置步骤:\n' +
        '  1. createdb water_quality\n' +
        '  2. psql water_quality -c "CREATE EXTENSION postgis;"\n' +
        '  3. 设置环境变量后重启服务'
      );
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL 连接错误:', err.message);
      pool = null;
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

async function ensurePostGIS(): Promise<void> {
  try {
    await query('CREATE EXTENSION IF NOT EXISTS postgis');
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ PostGIS 扩展已启用');
  } catch (error: any) {
    if (error.message?.includes('could not open extension')) {
      throw new Error(
        '❌ PostGIS 扩展未安装。请安装 postgis 后重试:\n' +
        '  macOS: brew install postgis\n' +
        '  Ubuntu: sudo apt-get install postgresql-postgis'
      );
    }
    throw error;
  }
}

async function createTables(): Promise<void> {
  const createSitesTable = `
    CREATE TABLE IF NOT EXISTS monitoring_sites (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      code VARCHAR(32) UNIQUE NOT NULL,
      river_section VARCHAR(64) NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      geom GEOMETRY(Point, 4326),
      organization VARCHAR(128) NOT NULL,
      type VARCHAR(16) NOT NULL CHECK (type IN ('manual', 'automatic')),
      status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_sites_organization ON monitoring_sites(organization);
    CREATE INDEX IF NOT EXISTS idx_sites_geom ON monitoring_sites USING GIST(geom);
  `;

  const createMeasurementsTable = `
    CREATE TABLE IF NOT EXISTS measurements (
      id VARCHAR(64) PRIMARY KEY,
      site_id VARCHAR(64) NOT NULL REFERENCES monitoring_sites(id) ON DELETE CASCADE,
      sample_time TIMESTAMP NOT NULL,
      temperature DOUBLE PRECISION,
      ph DOUBLE PRECISION,
      dissolved_oxygen DOUBLE PRECISION,
      ammonia_nitrogen DOUBLE PRECISION,
      rainfall DOUBLE PRECISION,
      data_source VARCHAR(16) NOT NULL CHECK (data_source IN ('manual', 'automatic')),
      organization VARCHAR(128) NOT NULL,
      is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
      anomaly_reason TEXT,
      note TEXT,
      sampled_by VARCHAR(64),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_measurements_site_id ON measurements(site_id);
    CREATE INDEX IF NOT EXISTS idx_measurements_sample_time ON measurements(sample_time);
    CREATE INDEX IF NOT EXISTS idx_measurements_organization ON measurements(organization);
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) UNIQUE NOT NULL,
      password_hash VARCHAR(128) NOT NULL,
      role VARCHAR(16) NOT NULL CHECK (role IN ('admin', 'researcher')),
      organization VARCHAR(128) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  const createAnomalyNotesTable = `
    CREATE TABLE IF NOT EXISTS anomaly_notes (
      id VARCHAR(64) PRIMARY KEY,
      measurement_id VARCHAR(64) NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id),
      user_name VARCHAR(64) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notes_measurement_id ON anomaly_notes(measurement_id);
  `;

  await query(createSitesTable);
  await query(createMeasurementsTable);
  await query(createUsersTable);
  await query(createAnomalyNotesTable);
  console.log('✅ 数据库表创建完成');
}

async function seedDataIfEmpty(): Promise<void> {
  const siteCount = await query('SELECT COUNT(*) as count FROM monitoring_sites');
  if (parseInt(siteCount.rows[0].count) > 0) {
    console.log('✅ 数据库已有数据，跳过种子数据注入');
    return;
  }

  console.log('🌱 注入种子数据...');
  const sites = generateSites();
  const measurements = generateMeasurements(sites);
  const users: Omit<User, 'id'>[] = [
    { username: 'admin', password_hash: 'password123', role: 'admin', organization: ORGANIZATIONS[0] },
    { username: 'researcher1', password_hash: 'password123', role: 'researcher', organization: ORGANIZATIONS[0] },
    { username: 'researcher2', password_hash: 'password123', role: 'researcher', organization: ORGANIZATIONS[1] },
    { username: 'researcher3', password_hash: 'password123', role: 'researcher', organization: ORGANIZATIONS[2] },
  ];

  for (const site of sites) {
    await query(
      `INSERT INTO monitoring_sites (id, name, code, river_section, longitude, latitude, geom, organization, type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)`,
      [site.id, site.name, site.code, site.riverSection, site.longitude, site.latitude,
       site.organization, site.type, site.status, site.createdAt]
    );
  }

  const measurementBatch = measurements.slice(0, 800);
  for (const m of measurementBatch) {
    await query(
      `INSERT INTO measurements (id, site_id, sample_time, temperature, ph, dissolved_oxygen, ammonia_nitrogen, rainfall, data_source, organization, is_anomaly, anomaly_reason, note, sampled_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [m.id, m.siteId, m.sampleTime, m.temperature, m.ph, m.dissolvedOxygen, m.ammoniaNitrogen,
       m.rainfall, m.dataSource, m.organization, m.isAnomaly, m.anomalyReason, m.note, m.sampledBy]
    );
  }

  for (const user of users) {
    const id = generateId();
    await query(
      `INSERT INTO users (id, username, password_hash, role, organization)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, user.username, user.password_hash, user.role, user.organization]
    );
  }

  console.log(`✅ 种子数据完成: ${sites.length} 站点, ${measurementBatch.length} 记录, ${users.length} 用户`);
}

export async function initDatabase(): Promise<void> {
  console.log('🔌 连接 PostgreSQL/PostGIS 数据库...');
  try {
    await query('SELECT 1');
    console.log('✅ 数据库连接成功');
    await ensurePostGIS();
    await createTables();
    await seedDataIfEmpty();
  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

function rowToSite(row: any): MonitoringSite {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    riverSection: row.river_section,
    longitude: row.longitude,
    latitude: row.latitude,
    organization: row.organization,
    type: row.type,
    status: row.status,
    createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : row.created_at,
  };
}

function rowToMeasurement(row: any): Measurement {
  return {
    id: row.id,
    siteId: row.site_id,
    sampleTime: row.sample_time?.toISOString ? row.sample_time.toISOString() : row.sample_time,
    temperature: row.temperature,
    ph: row.ph,
    dissolvedOxygen: row.dissolved_oxygen,
    ammoniaNitrogen: row.ammonia_nitrogen,
    rainfall: row.rainfall,
    dataSource: row.data_source,
    organization: row.organization,
    isAnomaly: row.is_anomaly,
    anomalyReason: row.anomaly_reason,
    note: row.note,
    sampledBy: row.sampled_by,
  };
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    organization: row.organization,
  };
}

function rowToAnomalyNote(row: any): AnomalyNote {
  return {
    id: row.id,
    measurementId: row.measurement_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : row.created_at,
  };
}

export async function getSites(organization?: string): Promise<MonitoringSite[]> {
  let sql = 'SELECT * FROM monitoring_sites';
  const params: any[] = [];

  if (organization) {
    sql += ' WHERE organization = $1';
    params.push(organization);
  }
  sql += ' ORDER BY name';

  const result = await query(sql, params);
  return result.rows.map(rowToSite);
}

export async function getSiteById(id: string): Promise<MonitoringSite | undefined> {
  const result = await query('SELECT * FROM monitoring_sites WHERE id = $1', [id]);
  return result.rows[0] ? rowToSite(result.rows[0]) : undefined;
}

export async function addSite(site: Omit<MonitoringSite, 'id' | 'createdAt'>): Promise<MonitoringSite> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO monitoring_sites (id, name, code, river_section, longitude, latitude, geom, organization, type, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)`,
    [id, site.name, site.code, site.riverSection, site.longitude, site.latitude,
     site.organization, site.type, site.status, createdAt]
  );

  return { ...site, id, createdAt };
}

export async function getMeasurements(filters?: {
  siteIds?: string[];
  organizations?: string[];
  startDate?: string;
  endDate?: string;
  dataSource?: 'manual' | 'automatic' | 'all';
  onlyAnomalies?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data: Measurement[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.siteIds && filters.siteIds.length > 0) {
    conditions.push(`site_id = ANY($${paramIndex++})`);
    params.push(filters.siteIds);
  }

  if (filters?.organizations && filters.organizations.length > 0) {
    conditions.push(`organization = ANY($${paramIndex++})`);
    params.push(filters.organizations);
  }

  if (filters?.startDate) {
    conditions.push(`sample_time >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    conditions.push(`sample_time <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  if (filters?.dataSource && filters.dataSource !== 'all') {
    conditions.push(`data_source = $${paramIndex++}`);
    params.push(filters.dataSource);
  }

  if (filters?.onlyAnomalies) {
    conditions.push(`is_anomaly = TRUE`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as count FROM measurements ${whereClause}`,
    params
  );

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const dataResult = await query(
    `SELECT * FROM measurements ${whereClause} ORDER BY sample_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return {
    data: dataResult.rows.map(rowToMeasurement),
    total: parseInt(countResult.rows[0].count),
  };
}

export async function addMeasurements(measurements: Omit<Measurement, 'id'>[]): Promise<Measurement[]> {
  const results: Measurement[] = [];

  for (const m of measurements) {
    const id = generateId();
    await query(
      `INSERT INTO measurements (id, site_id, sample_time, temperature, ph, dissolved_oxygen, ammonia_nitrogen, rainfall, data_source, organization, is_anomaly, anomaly_reason, note, sampled_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, m.siteId, m.sampleTime, m.temperature, m.ph, m.dissolvedOxygen, m.ammoniaNitrogen,
       m.rainfall, m.dataSource, m.organization, m.isAnomaly, m.anomalyReason, m.note, m.sampledBy]
    );
    results.push({ ...m, id });
  }

  console.log(`💾 已写入 ${results.length} 条监测记录到 PostgreSQL`);
  return results;
}

export async function validateCredentials(username: string, password: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  if (result.rows[0] && result.rows[0].password_hash === password) {
    return rowToUser(result.rows[0]);
  }
  return null;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
}

export async function getAnomalyNotes(measurementId?: string): Promise<AnomalyNote[]> {
  let sql = 'SELECT * FROM anomaly_notes';
  const params: any[] = [];

  if (measurementId) {
    sql += ' WHERE measurement_id = $1';
    params.push(measurementId);
  }
  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows.map(rowToAnomalyNote);
}

export async function addAnomalyNote(note: Omit<AnomalyNote, 'id' | 'createdAt'>): Promise<AnomalyNote> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await query(
    `INSERT INTO anomaly_notes (id, measurement_id, user_id, user_name, content, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, note.measurementId, note.userId, note.userName, note.content, createdAt]
  );

  return { ...note, id, createdAt };
}

export { generateId };
