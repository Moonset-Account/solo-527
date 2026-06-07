export enum HazardStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum FineStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export enum AppealStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum HazardLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum UserRole {
  DIRECTOR = 'director',
  ADMIN = 'admin',
  TEAM_LEADER = 'team_leader',
}

export interface HazardType {
  id: string;
  name: string;
  code: string;
  level: HazardLevel;
}

export interface Team {
  id: string;
  name: string;
  leader: string;
  phone: string;
}

export interface InspectionPoint {
  id: string;
  name: string;
  floor: number;
  area: string;
  coordinates?: { x: number; y: number };
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  uploadedAt: string;
  uploadedBy: string;
  sensitive: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface RectificationRecord {
  id: string;
  hazardId: string;
  submittedAt: string;
  submittedBy: string;
  description: string;
  photos: Attachment[];
  reviewResult?: 'pass' | 'reject';
  reviewReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WeatherRecord {
  date: string;
  weather: string;
  temperature: number;
  windLevel: number;
  rainVolume: number;
}

export interface StopWorkRecord {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface AppealRecord {
  id: string;
  hazardId: string;
  reason: string;
  weatherEvidence?: WeatherRecord[];
  stopWorkEvidence?: StopWorkRecord[];
  status: AppealStatus;
  createdAt: string;
  handledAt?: string;
  handledBy?: string;
  handleRemark?: string;
}

export interface Fine {
  id: string;
  hazardId: string;
  hazardCode: string;
  hazardTitle: string;
  amount: number;
  status: FineStatus;
  teamName: string;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  fromStatus?: HazardStatus;
  toStatus: HazardStatus;
  remark?: string;
  operator: string;
  createdAt: string;
}

export interface Hazard {
  id: string;
  code: string;
  title: string;
  description: string;
  type: HazardType;
  level: HazardLevel;
  inspectionPoint: InspectionPoint;
  team: Team;
  status: HazardStatus;
  discoverer: string;
  discoveredAt: string;
  deadline: string;
  closedAt?: string;
  isOverdue: boolean;
  discoveryPhotos: Attachment[];
  rectificationRecords: RectificationRecord[];
  appealRecords: AppealRecord[];
  fineAmount?: number;
  fineStatus?: FineStatus;
  rejectReasons: string[];
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  underReview: number;
  closed: number;
  overdue: number;
  closureRate: number;
  overdueRate: number;
  totalConfirmedFine: number;
  totalPendingFine: number;
}

export interface ClosureRateTrendItem {
  date: string;
  rate: number;
  closed: number;
  total: number;
}

export interface OverdueRankingItem {
  teamId: string;
  teamName: string;
  count: number;
  amount: number;
}

export interface FloorHeatmapItem {
  floor: number;
  count: number;
  points: { name: string; count: number }[];
}

export interface TeamTrendItem {
  team: string;
  teamId: string;
  date: string;
  completed: number;
  total: number;
}

export interface FilterCriteria {
  dateRange?: [string, string];
  floors?: number[];
  teamIds?: string[];
  typeIds?: string[];
  statuses?: HazardStatus[];
  levels?: HazardLevel[];
  keyword?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FineStatistics {
  totalConfirmed: number;
  totalPending: number;
  byTeam: { team: string; amount: number }[];
  byType: { type: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
}
