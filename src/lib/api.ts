import type {
  Athlete,
  TrainingData,
  StrengthData,
  RecoveryData,
  InjuryRecord,
  RadarData,
  DataQualityStatus,
  FilterState,
} from '@shared/types';

const API_BASE = '/api';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth-storage');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    fetchJSON<{
      success: boolean;
      token: string;
      user: {
        id: string;
        email: string;
        role: string;
        name: string;
        athleteId?: string;
      };
    }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    fetchJSON(`${API_BASE}/auth/logout`, { method: 'POST' }),

  getAthletes: (sport?: string) =>
    fetchJSON<Athlete[]>(`${API_BASE}/athletes${sport ? `?sport=${encodeURIComponent(sport)}` : ''}`),

  getAthlete: (id: string) =>
    fetchJSON<Athlete>(`${API_BASE}/athletes/${id}`),

  getTraining: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    if (filters.sports.length) params.set('sports', filters.sports.join(','));
    if (filters.exercises.length) params.set('exercises', filters.exercises.join(','));
    if (filters.metrics.length) params.set('metrics', filters.metrics.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    params.set('timeWindow', filters.timeWindow);
    return fetchJSON<TrainingData[]>(`${API_BASE}/training?${params.toString()}`);
  },

  getStrength: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    if (filters.sports.length) params.set('sports', filters.sports.join(','));
    if (filters.exercises.length) params.set('exercises', filters.exercises.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    return fetchJSON<StrengthData[]>(`${API_BASE}/strength?${params.toString()}`);
  },

  getRecovery: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    if (filters.sports.length) params.set('sports', filters.sports.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    return fetchJSON<RecoveryData[]>(`${API_BASE}/recovery?${params.toString()}`);
  },

  getInjuries: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    return fetchJSON<InjuryRecord[]>(`${API_BASE}/injuries?${params.toString()}`);
  },

  getRadar: (athleteId: string) =>
    fetchJSON<RadarData>(`${API_BASE}/radar/${athleteId}`),

  getDataQuality: () =>
    fetchJSON<DataQualityStatus>(`${API_BASE}/data-quality`),

  getSports: () =>
    fetchJSON<string[]>(`${API_BASE}/sports`),

  getExercises: () =>
    fetchJSON<string[]>(`${API_BASE}/exercises`),

  getPresets: () =>
    fetchJSON<{
      id: string;
      name: string;
      isDefault: boolean;
      filters: FilterState;
      createdAt: string;
    }[]>(`${API_BASE}/presets`),

  createPreset: (name: string, filters: FilterState, isDefault = false) =>
    fetchJSON<{
      id: string;
      name: string;
      isDefault: boolean;
      filters: FilterState;
    }>(`${API_BASE}/presets`, {
      method: 'POST',
      body: JSON.stringify({ name, filters, isDefault }),
    }),

  deletePreset: (id: string) =>
    fetchJSON<void>(`${API_BASE}/presets/${id}`, { method: 'DELETE' }),

  triggerEtl: () =>
    fetchJSON<{
      success: boolean;
      recordsProcessed: number;
      errors: string[];
    }>(`${API_BASE}/etl/trigger`, { method: 'POST' }),

  exportReport: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    return fetchJSON<{
      filters: FilterState;
      summary: {
        trainingCount: number;
        recoveryCount: number;
        strengthCount: number;
        totalLoad: number;
        avgRecovery: number;
      };
      training: TrainingData[];
      recovery: RecoveryData[];
      strength: StrengthData[];
    }>(`${API_BASE}/export/report?${params.toString()}`);
  },
};
