import type { MonitoringSite, Measurement, User, AnomalyNote } from '../../src/types';

export interface DatabaseAdapter {
  init(): Promise<void>;
  
  getSites(organization?: string): Promise<MonitoringSite[]>;
  getSiteById(id: string): Promise<MonitoringSite | undefined>;
  addSite(site: Omit<MonitoringSite, 'id' | 'createdAt'>): Promise<MonitoringSite>;
  
  getMeasurements(filters?: {
    siteIds?: string[];
    organizations?: string[];
    startDate?: string;
    endDate?: string;
    dataSource?: 'manual' | 'automatic' | 'all';
    onlyAnomalies?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Measurement[]; total: number }>;
  addMeasurements(measurements: Omit<Measurement, 'id'>[]): Promise<Measurement[]>;
  
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  validateCredentials(username: string, password: string): Promise<User | null>;
  
  getAnomalyNotes(measurementId?: string): Promise<AnomalyNote[]>;
  addAnomalyNote(note: Omit<AnomalyNote, 'id' | 'createdAt'>): Promise<AnomalyNote>;
}
