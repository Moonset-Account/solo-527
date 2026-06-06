export type DateRange = {
  start: string;
  end: string;
};

export type FilterDimensions = {
  users: string[];
  teams: string[];
  channels: string[];
  versions: string[];
  modules: string[];
  trafficType: 'all' | 'experiment' | 'organic';
};

export type FunnelStep = {
  id: string;
  name: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
};

export type FunnelData = {
  steps: FunnelStep[];
  totalUsers: number;
  overallConversion: number;
};

export type CohortRow = {
  cohort: string;
  cohortSize: number;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  week6: number;
  week7: number;
};

export type CohortData = CohortRow[];

export type FeatureUsage = {
  id: string;
  name: string;
  module: string;
  users: number;
  sessions: number;
  avgDuration: number;
  adoptionRate: number;
  trend: number;
};

export type PathNode = {
  id: string;
  name: string;
  value: number;
  category: 'entry' | 'feature' | 'exit';
};

export type PathLink = {
  source: string;
  target: string;
  value: number;
};

export type PathData = {
  nodes: PathNode[];
  links: PathLink[];
};

export type ChurnReason = {
  id: string;
  reason: string;
  count: number;
  percentage: number;
};

export type SavedView = {
  id: string;
  name: string;
  createdAt: string;
  filters: FilterDimensions;
  dateRange: DateRange;
  activeView: ViewType;
};

export type ViewType = 'funnel' | 'cohort' | 'features' | 'paths';

export type ETLStatus = {
  lastUpdated: string;
  status: 'success' | 'running' | 'failed';
  nextRun: string;
  recordsProcessed: number;
};

export type MetricConfig = {
  id: string;
  name: string;
  definition: string;
  calculation: string;
};

export type ExportTask = {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
};
