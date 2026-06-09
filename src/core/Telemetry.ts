import { SaveSystem } from './SaveSystem';

export const TELEMETRY_KEY = 'telemetry-sessions';

export interface TelemetryEvent {
  type: string;
  timestamp: number;
  data?: unknown;
}

export interface SessionStats {
  mistakes: number;
  componentsAdded: number;
  componentsRemoved: number;
  wiresConnected: number;
  wiresDisconnected: number;
  simRuns: number;
  custom: Record<string, number>;
}

export interface Session {
  id: string;
  mode: string;
  levelId?: string;
  startTime: number;
  endTime: number | null;
  durationMs: number;
  events: TelemetryEvent[];
  stats: SessionStats;
  summary?: unknown;
}

export interface TelemetrySnapshot {
  sessions: Session[];
  exportedAt: number;
  appVersion?: string;
}

const createEmptyStats = (): SessionStats => ({
  mistakes: 0,
  componentsAdded: 0,
  componentsRemoved: 0,
  wiresConnected: 0,
  wiresDisconnected: 0,
  simRuns: 0,
  custom: {},
});

const generateId = (): string => {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export class Telemetry {
  private sessions: Session[] = [];
  private currentSession: Session | null = null;
  private persistence: SaveSystem | null;
  private autoPersist: boolean;
  private maxSessions: number;

  constructor(options?: {
    persistence?: SaveSystem;
    autoPersist?: boolean;
    maxSessions?: number;
  }) {
    this.persistence = options?.persistence ?? null;
    this.autoPersist = options?.autoPersist ?? true;
    this.maxSessions = options?.maxSessions ?? 200;
    this.loadSessions();
  }

  beginSession(mode: string, levelId?: string): string {
    if (this.currentSession) {
      this.endSession({ endedBy: 'begin_next' });
    }
    const now = Date.now();
    const session: Session = {
      id: generateId(),
      mode,
      levelId,
      startTime: now,
      endTime: null,
      durationMs: 0,
      events: [],
      stats: createEmptyStats(),
    };
    this.currentSession = session;
    this.sessions.push(session);
    this.trimSessions();
    this.persist();
    return session.id;
  }

  endSession(summaryData?: unknown): void {
    if (!this.currentSession) return;
    const now = Date.now();
    this.currentSession.endTime = now;
    this.currentSession.durationMs = now - this.currentSession.startTime;
    if (summaryData !== undefined) {
      this.currentSession.summary = summaryData;
    }
    this.currentSession = null;
    this.persist();
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  getCurrentSessionId(): string | null {
    return this.currentSession?.id ?? null;
  }

  recordEvent(type: string, data?: unknown): void {
    const event: TelemetryEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    if (this.currentSession) {
      this.currentSession.events.push(event);
      this.updateAutoStats(event);
      this.persist();
    }
  }

  incrementStat(name: keyof SessionStats | string, amount: number = 1): void {
    if (!this.currentSession) return;
    const stats = this.currentSession.stats;
    if (name === 'custom' || typeof name !== 'string') return;
    const knownKeys: Array<keyof SessionStats> = [
      'mistakes',
      'componentsAdded',
      'componentsRemoved',
      'wiresConnected',
      'wiresDisconnected',
      'simRuns',
    ];
    if (knownKeys.includes(name as keyof SessionStats)) {
      (stats as any)[name] = ((stats as any)[name] ?? 0) + amount;
    } else {
      stats.custom[name] = (stats.custom[name] ?? 0) + amount;
    }
    this.persist();
  }

  getStat(name: keyof SessionStats | string): number {
    if (!this.currentSession) return 0;
    const stats = this.currentSession.stats;
    const knownKeys: Array<keyof SessionStats> = [
      'mistakes',
      'componentsAdded',
      'componentsRemoved',
      'wiresConnected',
      'wiresDisconnected',
      'simRuns',
    ];
    if (knownKeys.includes(name as keyof SessionStats) && name !== 'custom') {
      return (stats as any)[name] ?? 0;
    }
    return stats.custom[name as string] ?? 0;
  }

  getSessions(): Session[] {
    return this.sessions.map(s => ({ ...s, events: [...s.events], stats: { ...s.stats, custom: { ...s.stats.custom } } }));
  }

  getSessionCount(): number {
    return this.sessions.length;
  }

  getTotalStats(): SessionStats {
    const total = createEmptyStats();
    for (const s of this.sessions) {
      total.mistakes += s.stats.mistakes;
      total.componentsAdded += s.stats.componentsAdded;
      total.componentsRemoved += s.stats.componentsRemoved;
      total.wiresConnected += s.stats.wiresConnected;
      total.wiresDisconnected += s.stats.wiresDisconnected;
      total.simRuns += s.stats.simRuns;
      for (const [k, v] of Object.entries(s.stats.custom)) {
        total.custom[k] = (total.custom[k] ?? 0) + v;
      }
    }
    return total;
  }

  getTotalPlayTimeMs(): number {
    let total = 0;
    for (const s of this.sessions) {
      if (s.endTime !== null) {
        total += s.durationMs;
      } else if (s === this.currentSession) {
        total += Date.now() - s.startTime;
      }
    }
    return total;
  }

  exportSnapshot(appVersion?: string): TelemetrySnapshot {
    return {
      sessions: this.getSessions(),
      exportedAt: Date.now(),
      appVersion,
    };
  }

  importSnapshot(snapshot: TelemetrySnapshot): boolean {
    try {
      if (!snapshot || !Array.isArray(snapshot.sessions)) return false;
      for (const s of snapshot.sessions) {
        if (typeof s.id !== 'string') return false;
        if (typeof s.startTime !== 'number') return false;
      }
      this.sessions = snapshot.sessions.map(s => ({
        ...s,
        events: [...s.events],
        stats: { ...s.stats, custom: { ...s.stats.custom } },
      }));
      this.trimSessions();
      this.persist();
      return true;
    } catch (e) {
      console.error('[Telemetry] Import failed:', e);
      return false;
    }
  }

  clearAll(): void {
    if (this.currentSession) {
      this.currentSession = null;
    }
    this.sessions = [];
    this.persist();
  }

  private updateAutoStats(event: TelemetryEvent): void {
    switch (event.type) {
      case 'component_add':
        this.incrementStat('componentsAdded');
        break;
      case 'component_remove':
        this.incrementStat('componentsRemoved');
        break;
      case 'wire_connect':
        this.incrementStat('wiresConnected');
        break;
      case 'wire_disconnect':
        this.incrementStat('wiresDisconnected');
        break;
      case 'mistake':
      case 'error':
      case 'validation_fail':
        this.incrementStat('mistakes');
        break;
      case 'sim_run':
      case 'simulate_start':
        this.incrementStat('simRuns');
        break;
    }
  }

  private loadSessions(): void {
    if (!this.persistence) return;
    try {
      const saved = this.persistence.get<Session[]>(TELEMETRY_KEY);
      if (Array.isArray(saved)) {
        this.sessions = saved.map(s => ({
          ...s,
          events: Array.isArray(s.events) ? [...s.events] : [],
          stats: s.stats ? { ...createEmptyStats(), ...s.stats, custom: { ...(s.stats.custom ?? {}) } } : createEmptyStats(),
        }));
      }
    } catch (e) {
      console.warn('[Telemetry] Failed to load saved sessions:', e);
    }
  }

  private persist(): void {
    if (!this.autoPersist || !this.persistence) return;
    try {
      this.persistence.set(TELEMETRY_KEY, this.sessions);
    } catch (e) {
      console.warn('[Telemetry] Failed to persist sessions:', e);
    }
  }

  private trimSessions(): void {
    if (this.sessions.length > this.maxSessions) {
      const overflow = this.sessions.length - this.maxSessions;
      this.sessions.splice(0, overflow);
    }
  }
}
