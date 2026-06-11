export interface AudioFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  duration: number;
  callDate: string;
  callTime: string;
  agentId: string;
  agentName: string;
  extension: string;
}

export interface TranscriptFile {
  id: string;
  fileName: string;
  filePath: string;
  content: string;
  callDate: string;
  callTime: string;
  agentId: string;
  duration?: number;
}

export interface ScheduleEntry {
  date: string;
  agentId: string;
  agentName: string;
  shiftStart: string;
  shiftEnd: string;
  team: string;
}

export enum AnomalyType {
  MISSING_TRANSCRIPT = 'MISSING_TRANSCRIPT',
  AGENT_MISMATCH = 'AGENT_MISMATCH',
  DURATION_ABNORMAL = 'DURATION_ABNORMAL',
  DUPLICATE_SAMPLE = 'DUPLICATE_SAMPLE',
  AGENT_NOT_SCHEDULED = 'AGENT_NOT_SCHEDULED',
}

export interface Anomaly {
  type: AnomalyType;
  severity: 'critical' | 'warning' | 'info';
  audioId: string;
  message: string;
  details: Record<string, unknown>;
}

export interface IndexEntry {
  audioId: string;
  audioFile: string;
  transcriptFile?: string;
  callDate: string;
  callTime: string;
  agentId: string;
  agentName: string;
  duration: number;
  anomalies: Anomaly[];
  isValid: boolean;
}

export interface CliOptions {
  audioDir: string;
  transcriptDir: string;
  scheduleFile: string;
  outputDir: string;
  agent?: string;
  date?: string;
  json: boolean;
  dryRun: boolean;
  minDuration: number;
  maxDuration: number;
}

export interface InputSummary {
  generatedAt: string;
  audioDir: string;
  transcriptDir: string;
  scheduleFile: string;
  audioCount: number;
  transcriptCount: number;
  scheduleCount: number;
  audioFiles: string[];
  transcriptFiles: string[];
  options: {
    agent?: string;
    date?: string;
    minDuration: number;
    maxDuration: number;
  };
  checksum: string;
}

export interface IndexReport {
  summary: {
    totalAudio: number;
    totalTranscript: number;
    validSamples: number;
    totalAnomalies: number;
    anomaliesByType: Record<AnomalyType, number>;
    agents: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
  indices: IndexEntry[];
  anomalies: Anomaly[];
  inputSummary: InputSummary;
}

export interface ParseResult<T> {
  data: T;
  errors: string[];
  fatalError?: string;
}
