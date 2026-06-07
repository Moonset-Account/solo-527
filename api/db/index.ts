import type { MonitoringSite, Measurement, User, AnomalyNote } from '../../src/types';
import { generateSites, generateMeasurements } from '../../src/utils/mockData.js';
import { ORGANIZATIONS } from '../../src/utils/constants.js';

interface Database {
  sites: MonitoringSite[];
  measurements: Measurement[];
  users: User[];
  anomalyNotes: AnomalyNote[];
}

let db: Database = {
  sites: [],
  measurements: [],
  users: [],
  anomalyNotes: [],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function initDatabase(): void {
  const sites = generateSites();
  const measurements = generateMeasurements(sites);

  db.sites = sites;
  db.measurements = measurements;

  db.users = [
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

  db.anomalyNotes = measurements
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

  console.log('[DB] 数据库初始化完成');
  console.log(`[DB] 采样点: ${db.sites.length}`);
  console.log(`[DB] 监测记录: ${db.measurements.length}`);
  console.log(`[DB] 用户: ${db.users.length}`);
}

export function getSites(organization?: string): MonitoringSite[] {
  if (organization) {
    return db.sites.filter((s) => s.organization === organization);
  }
  return [...db.sites];
}

export function getSiteById(id: string): MonitoringSite | undefined {
  return db.sites.find((s) => s.id === id);
}

export function addSite(site: Omit<MonitoringSite, 'id' | 'createdAt'>): MonitoringSite {
  const newSite: MonitoringSite = {
    ...site,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  db.sites.push(newSite);
  return newSite;
}

export function getMeasurements(
  filters?: {
    siteIds?: string[];
    organizations?: string[];
    startDate?: string;
    endDate?: string;
    dataSource?: 'manual' | 'automatic' | 'all';
    onlyAnomalies?: boolean;
    limit?: number;
    offset?: number;
  }
): { data: Measurement[]; total: number } {
  let result = [...db.measurements];

  if (filters?.siteIds && filters.siteIds.length > 0) {
    result = result.filter((m) => filters.siteIds!.includes(m.siteId));
  }

  if (filters?.organizations && filters.organizations.length > 0) {
    const siteIds = db.sites
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

export function addMeasurements(measurements: Omit<Measurement, 'id'>[]): Measurement[] {
  const newMeasurements: Measurement[] = measurements.map((m) => ({
    ...m,
    id: generateId(),
  }));
  db.measurements.push(...newMeasurements);
  return newMeasurements;
}

export function getUserByUsername(username: string): User | undefined {
  return db.users.find((u) => u.username === username);
}

export function getUserById(id: string): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function validateCredentials(username: string, password: string): User | null {
  const user = db.users.find((u) => u.username === username);
  if (user && password === 'password123') {
    return user;
  }
  return null;
}

export function getAnomalyNotes(measurementId?: string): AnomalyNote[] {
  let result = [...db.anomalyNotes];
  if (measurementId) {
    result = result.filter((n) => n.measurementId === measurementId);
  }
  return result;
}

export function addAnomalyNote(note: Omit<AnomalyNote, 'id' | 'createdAt'>): AnomalyNote {
  const newNote: AnomalyNote = {
    ...note,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  db.anomalyNotes.push(newNote);
  return newNote;
}

export { generateId };
