import type { DatabaseAdapter } from './types';
import type { MonitoringSite, Measurement, User, AnomalyNote } from '../../src/types';
import { generateSites, generateMeasurements } from '../../src/utils/mockData.js';
import { ORGANIZATIONS } from '../../src/utils/constants.js';

interface Database {
  sites: MonitoringSite[];
  measurements: Measurement[];
  users: User[];
  anomalyNotes: AnomalyNote[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export class MemoryDatabaseAdapter implements DatabaseAdapter {
  private db: Database = {
    sites: [],
    measurements: [],
    users: [],
    anomalyNotes: [],
  };

  async init(): Promise<void> {
    const sites = generateSites();
    const measurements = generateMeasurements(sites);

    this.db.sites = sites;
    this.db.measurements = measurements;

    this.db.users = [
      {
        id: 'user-admin',
        username: 'admin',
        role: 'admin',
        organization: ORGANIZATIONS[0],
      },
      {
        id: 'user-research-1',
        username: 'researcher1',
        role: 'researcher',
        organization: ORGANIZATIONS[0],
      },
      {
        id: 'user-research-2',
        username: 'researcher2',
        role: 'researcher',
        organization: ORGANIZATIONS[1],
      },
      {
        id: 'user-research-3',
        username: 'researcher3',
        role: 'researcher',
        organization: ORGANIZATIONS[2],
      },
    ];

    this.db.anomalyNotes = measurements
      .filter((m) => m.isAnomaly)
      .slice(0, 10)
      .map((m) => ({
        id: generateId(),
        measurementId: m.id,
        userId: 'user-admin',
        userName: '系统管理员',
        content: '自动检测异常，已记录待复核',
        createdAt: new Date().toISOString(),
      }));

    console.log('[DB:Memory] 数据库初始化完成');
    console.log(`[DB:Memory] 采样点: ${this.db.sites.length}`);
    console.log(`[DB:Memory] 监测记录: ${this.db.measurements.length}`);
    console.log(`[DB:Memory] 用户: ${this.db.users.length}`);
  }

  async getSites(organization?: string): Promise<MonitoringSite[]> {
    if (organization) {
      return this.db.sites.filter((s) => s.organization === organization);
    }
    return [...this.db.sites];
  }

  async getSiteById(id: string): Promise<MonitoringSite | undefined> {
    return this.db.sites.find((s) => s.id === id);
  }

  async addSite(site: Omit<MonitoringSite, 'id' | 'createdAt'>): Promise<MonitoringSite> {
    const newSite: MonitoringSite = {
      ...site,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.db.sites.push(newSite);
    return newSite;
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
    let result = [...this.db.measurements];

    if (filters?.siteIds && filters.siteIds.length > 0) {
      result = result.filter((m) => filters.siteIds!.includes(m.siteId));
    }

    if (filters?.organizations && filters.organizations.length > 0) {
      const siteIds = this.db.sites
        .filter((s) => filters.organizations!.includes(s.organization))
        .map((s) => s.id);
      result = result.filter((m) => siteIds.includes(m.siteId));
    }

    if (filters?.startDate) {
      result = result.filter((m) => m.sampleTime >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter((m) => m.sampleTime <= filters.endDate!);
    }

    if (filters?.dataSource && filters.dataSource !== 'all') {
      result = result.filter((m) => m.dataSource === filters.dataSource);
    }

    if (filters?.onlyAnomalies) {
      result = result.filter((m) => m.isAnomaly);
    }

    result.sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime());

    const total = result.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;

    return {
      data: result.slice(offset, offset + limit),
      total,
    };
  }

  async addMeasurements(measurements: Omit<Measurement, 'id'>[]): Promise<Measurement[]> {
    const newMeasurements: Measurement[] = measurements.map((m) => ({
      ...m,
      id: generateId(),
    }));
    this.db.measurements.push(...newMeasurements);
    console.log(`[DB:Memory] 导入 ${newMeasurements.length} 条监测记录，总计: ${this.db.measurements.length}`);
    return newMeasurements;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.db.users.find((u) => u.username === username);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.db.users.find((u) => u.id === id);
  }

  async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = this.db.users.find((u) => u.username === username);
    if (user && password === 'password123') {
      return user;
    }
    return null;
  }

  async getAnomalyNotes(measurementId?: string): Promise<AnomalyNote[]> {
    let result = [...this.db.anomalyNotes];
    if (measurementId) {
      result = result.filter((n) => n.measurementId === measurementId);
    }
    return result;
  }

  async addAnomalyNote(note: Omit<AnomalyNote, 'id' | 'createdAt'>): Promise<AnomalyNote> {
    const newNote: AnomalyNote = {
      ...note,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.db.anomalyNotes.push(newNote);
    return newNote;
  }
}
