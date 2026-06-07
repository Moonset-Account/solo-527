import type {
  Athlete,
  TrainingData,
  StrengthData,
  RecoveryData,
  InjuryRecord,
  RadarData,
  DataQualityStatus,
  FilterState,
} from '../../../shared/types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    fetchJSON(`${API_BASE}/auth/login`, {
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
    fetchJSON<RadarData[]>(`${API_BASE}/radar/${athleteId}`),

  getDataQuality: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    return fetchJSON<DataQualityStatus>(`${API_BASE}/data-quality?${params.toString()}`);
  },

  getSports: () =>
    fetchJSON<string[]>(`${API_BASE}/sports`),

  getExercises: () =>
    fetchJSON<string[]>(`${API_BASE}/exercises`),

  triggerEtl: () =>
    fetchJSON(`${API_BASE}/etl/trigger`, { method: 'POST' }),

  exportReport: (filters: FilterState) => {
    const params = new URLSearchParams();
    if (filters.athleteIds.length) params.set('athleteIds', filters.athleteIds.join(','));
    params.set('start', filters.dateRange.start);
    params.set('end', filters.dateRange.end);
    return fetchJSON(`${API_BASE}/export/report?${params.toString()}`);
  },
};
