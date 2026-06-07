export interface Athlete {
  id: string;
  name: string;
  team?: string;
  sport: string;
  position?: string;
  birthDate?: string;
  avatar?: string;
}

export interface TrainingData {
  id: string;
  athleteId: string;
  date: string;
  sessionType: string;
  durationMin: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  paceKmPerH?: number;
  distanceKm?: number;
  loadScore: number;
  rpe?: number;
  source?: string;
}

export interface StrengthData {
  id: string;
  athleteId: string;
  date: string;
  exercise: string;
  weightKg: number;
  reps: number;
  sets: number;
  estimated1Rm?: number;
  notes?: string;
}

export interface RecoveryData {
  id: string;
  athleteId: string;
  date: string;
  sleepScore?: number;
  hrv?: number;
  sorenessScore?: number;
  moodScore?: number;
  overallScore: number;
  source?: string;
}

export interface InjuryRecord {
  id: string;
  athleteId: string;
  date: string;
  injuryType: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  notes?: string;
  status: 'active' | 'recovered' | 'chronic';
  returnDate?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  filters: FilterState;
  createdAt: string;
}

export interface FilterState {
  athleteIds: string[];
  sports: string[];
  dateRange: { start: string; end: string };
  timeWindow: 'day' | 'week' | 'month' | 'custom';
  exercises: string[];
  metrics: string[];
}

export interface DataQualityStatus {
  status: 'healthy' | 'warning' | 'error';
  lastUpdated: Date | string;
  warnings: string[];
  sampleSizes: {
    training: number;
    strength: number;
    recovery: number;
    injuries: number;
    athletes: number;
  };
  etlStatus: 'running' | 'completed' | 'failed' | 'unknown';
  pendingRawRecords?: number;
  failedRawRecords?: number;
  lastEtlError?: string;
  missingFields?: {
    trainingHeartRate: number;
    trainingPace: number;
    recoverySleep: number;
    strength1Rm: number;
  };
}

export interface RadarData {
  athleteId: string;
  metrics: Array<{
    name: string;
    value: number;
    max: number;
  }>;
  lastUpdated: Date | string;
}

export interface User {
  id: string;
  email: string;
  role: 'coach' | 'athlete';
  name: string;
  athleteId?: string;
}

export type MetricType = 'loadScore' | 'avgHeartRate' | 'distanceKm' | 'paceKmPerH' | 'durationMin';
