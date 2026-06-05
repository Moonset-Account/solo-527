export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'LEAGUE_ADMIN' 
  | 'TEAM_MANAGER' 
  | 'REFEREE' 
  | 'FIELD_STAFF' 
  | 'VIEWER';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  _id: string;
  name: string;
  year: string;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  rules: {
    pointsPerWin: number;
    pointsPerDraw: number;
    pointsPerLoss: number;
    rosterLockHoursBeforeMatch: number;
    appealDeadlineHoursAfterMatch: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type TeamStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Team {
  _id: string;
  seasonId: string;
  name: string;
  logo?: string;
  city: string;
  coach: string;
  contactName: string;
  contactPhone: string;
  status: TeamStatus;
  rejectReason?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  _id: string;
  teamId: string;
  name: string;
  idNumber: string;
  jerseyNumber: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  dateOfBirth?: Date;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED';

export interface Match {
  _id: string;
  seasonId: string;
  round: number;
  group?: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  refereeIds: string[];
  startTime: Date;
  endTime?: Date;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  quarterScores?: number[][];
  rosterLocked: boolean;
  lockTime: Date;
  attendance?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStat {
  _id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fouls: number;
  turnovers: number;
  minutesPlayed: number;
  isStarter: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Venue {
  _id: string;
  name: string;
  address: string;
  capacity: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AppealType = 'SCORE' | 'FOUL' | 'REFEREE' | 'ELIGIBILITY' | 'OTHER';
export type AppealStatus = 'PENDING' | 'REVIEWING' | 'UPHELD' | 'REJECTED';

export interface Appeal {
  _id: string;
  matchId: string;
  teamId: string;
  submittedBy: string;
  type: AppealType;
  title: string;
  description: string;
  evidenceUrls: string[];
  status: AppealStatus;
  submittedAt: Date;
  deadline: Date;
  decidedAt?: Date;
  decidedBy?: string;
  decision?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Standing {
  _id: string;
  seasonId: string;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number;
  rank: number;
  group?: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  title: string;
  content: string;
  templateId?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ImportExportType = 'IMPORT' | 'EXPORT';
export type ImportExportEntity = 'TEAMS' | 'PLAYERS' | 'SCHEDULE' | 'SCORES' | 'STANDINGS';
export type ImportExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ImportExportTask {
  _id: string;
  type: ImportExportType;
  entity: ImportExportEntity;
  status: ImportExportStatus;
  fileUrl?: string;
  fileName?: string;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  importErrors: { row: number; message: string }[];
  batchId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineAction {
  id: string;
  type: 'SCORE_UPDATE' | 'CHECKIN' | 'PHOTO_UPLOAD' | 'PLAYER_STAT';
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

export type CheckInType = 'REFEREE' | 'TEAM_MANAGER' | 'PLAYER' | 'FIELD_STAFF' | 'GUEST';

export interface CheckIn {
  _id: string;
  matchId: string;
  userId: string;
  type: CheckInType;
  checkinTime: Date;
  location?: { lat: number; lng: number };
  photoUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
