import pkg from 'pg';
const { Pool } = pkg;
import type { DatabaseAdapter } from './types';
import type { MonitoringSite, Measurement, User, AnomalyNote } from '../../src/types';
import { generateSites, generateMeasurements } from '../../src/utils/mockData.js';
import { ORGANIZATIONS } from '../../src/utils/constants.js';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export class PostgresDatabaseAdapter implements DatabaseAdapter {
  private pool: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/water_quality';
    
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async init(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      console.log('[DB:Postgres] 数据库连接成功');
      
      await this.runMigrations();
      await this.seedDataIfEmpty();
    } catch (error) {
      console.error('[DB:Postgres] 连接失败，将回退到内存数据库:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    const createExtensions = `
      CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `;

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

    await this.pool.query(createExtensions);
    await this.pool.query(createSitesTable);
    await this.pool.query(createMeasurementsTable);
    await this.pool.query(createUsersTable);
    await this.pool.query(createAnomalyNotesTable);

    console.log('[DB:Postgres] 迁移执行完成');
  }

  private async seedDataIfEmpty(): Promise<void> {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM monitoring_sites');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('[DB:Postgres] 初始化种子数据...');
      
      const sites = generateSites();
      const measurements = generateMeasurements(sites);
      const users = [
        { id: 'user-admin', username: 'admin', password: 'password123', role: 'admin', organization: ORGANIZATIONS[0] },
        { id: 'user-research-1', username: 'researcher1', password: 'password123', role: 'researcher', organization: ORGANIZATIONS[0] },
        { id: 'user-research-2', username: 'researcher2', password: 'password123', role: 'researcher', organization: ORGANIZATIONS[1] },
        { id: 'user-research-3', username: 'researcher3', password: 'password123', role: 'researcher', organization: ORGANIZATIONS[2] },
      ];

      for (const site of sites) {
        await this.pool.query(
          `INSERT INTO monitoring_sites (id, name, code, river_section, longitude, latitude, geom, organization, type, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)`,
          [site.id, site.name, site.code, site.riverSection, site.longitude, site.latitude, 
           site.organization, site.type, site.status, site.createdAt]
        );
      }

      for (const m of measurements.slice(0, 500)) {
        await this.pool.query(
          `INSERT INTO measurements (id, site_id, sample_time, temperature, ph, dissolved_oxygen, ammonia_nitrogen, rainfall, data_source, organization, is_anomaly, anomaly_reason, note, sampled_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [m.id, m.siteId, m.sampleTime, m.temperature, m.ph, m.dissolvedOxygen, m.ammoniaNitrogen, 
           m.rainfall, m.dataSource, m.organization, m.isAnomaly, m.anomalyReason, m.note, m.sampledBy]
        );
      }

      for (const user of users) {
        await this.pool.query(
          `INSERT INTO users (id, username, password_hash, role, organization)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, user.username, user.password, user.role, user.organization]
        );
      }

      console.log(`[DB:Postgres] 种子数据完成: ${sites.length} 站点, ${Math.min(500, measurements.length)} 记录`);
    }
  }

  private rowToSite(row: any): MonitoringSite {
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

  private rowToMeasurement(row: any): Measurement {
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

  private rowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      organization: row.organization,
    };
  }

  private rowToAnomalyNote(row: any): AnomalyNote {
    return {
      id: row.id,
      measurementId: row.measurement_id,
      userId: row.user_id,
      userName: row.user_name,
      content: row.content,
      createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : row.created_at,
    };
  }

  async getSites(organization?: string): Promise<MonitoringSite[]> {
    let query = 'SELECT * FROM monitoring_sites';
    const params: any[] = [];
    
    if (organization) {
      query += ' WHERE organization = $1';
      params.push(organization);
    }
    query += ' ORDER BY name';

    const result = await this.pool.query(query, params);
    return result.rows.map(this.rowToSite);
  }

  async getSiteById(id: string): Promise<MonitoringSite | undefined> {
    const result = await this.pool.query('SELECT * FROM monitoring_sites WHERE id = $1', [id]);
    return result.rows[0] ? this.rowToSite(result.rows[0]) : undefined;
  }

  async addSite(site: Omit<MonitoringSite, 'id' | 'createdAt'>): Promise<MonitoringSite> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    
    await this.pool.query(
      `INSERT INTO monitoring_sites (id, name, code, river_section, longitude, latitude, geom, organization, type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)`,
      [id, site.name, site.code, site.riverSection, site.longitude, site.latitude,
       site.organization, site.type, site.status, createdAt]
    );

    return { ...site, id, createdAt };
  }

  async getMeasurements(filters?: {
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

    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM measurements ${whereClause}`,
      params
    );

    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    
    const dataResult = await this.pool.query(
      `SELECT * FROM measurements ${whereClause} ORDER BY sample_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: dataResult.rows.map(this.rowToMeasurement),
      total: parseInt(countResult.rows[0].count),
    };
  }

  async addMeasurements(measurements: Omit<Measurement, 'id'>[]): Promise<Measurement[]> {
    const results: Measurement[] = [];
    
    for (const m of measurements) {
      const id = generateId();
      await this.pool.query(
        `INSERT INTO measurements (id, site_id, sample_time, temperature, ph, dissolved_oxygen, ammonia_nitrogen, rainfall, data_source, organization, is_anomaly, anomaly_reason, note, sampled_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [id, m.siteId, m.sampleTime, m.temperature, m.ph, m.dissolvedOxygen, m.ammoniaNitrogen,
         m.rainfall, m.dataSource, m.organization, m.isAnomaly, m.anomalyReason, m.note, m.sampledBy]
      );
      results.push({ ...m, id });
    }

    return results;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? this.rowToUser(result.rows[0]) : undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.rowToUser(result.rows[0]) : undefined;
  }

  async validateCredentials(username: string, password: string): Promise<User | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows[0] && result.rows[0].password_hash === password) {
      return this.rowToUser(result.rows[0]);
    }
    return null;
  }

  async getAnomalyNotes(measurementId?: string): Promise<AnomalyNote[]> {
    let query = 'SELECT * FROM anomaly_notes';
    const params: any[] = [];
    
    if (measurementId) {
      query += ' WHERE measurement_id = $1';
      params.push(measurementId);
    }
    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(this.rowToAnomalyNote);
  }

  async addAnomalyNote(note: Omit<AnomalyNote, 'id' | 'createdAt'>): Promise<AnomalyNote> {
    const id = generateId();
    const createdAt = new Date().toISOString();
    
    await this.pool.query(
      `INSERT INTO anomaly_notes (id, measurement_id, user_id, user_name, content, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, note.measurementId, note.userId, note.userName, note.content, createdAt]
    );

    return { ...note, id, createdAt };
  }
}
