export type UserRole = 'admin' | 'captain' | 'referee' | 'viewer';

export type TeamStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type MatchStatus = 'scheduled' | 'adjusting' | 'confirmed' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';

export type AppealStatus = 'pending' | 'upheld' | 'rejected' | 'expired';

export type SeasonStatus = 'upcoming' | 'active' | 'completed';

export type MessageType = 'system' | 'review' | 'schedule' | 'score' | 'appeal';

export type AuditModule = 'team' | 'schedule' | 'referee' | 'score' | 'appeal' | 'venue' | 'user';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface ITeam {
  _id: string;
  name: string;
  captainId: string;
  contact?: string;
  phone?: string;
  status: TeamStatus;
  seasonId?: string;
  rosterLockedAt?: string;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPlayer {
  _id: string;
  teamId: string;
  name: string;
  jerseyNumber?: string;
  position?: 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER';
}

export interface ISeason {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  appealDeadlineHours: number;
}

export interface IVenue {
  _id: string;
  name: string;
  address?: string;
  facilities: string[];
  active: boolean;
}

export interface IMatch {
  _id: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string;
  refereeId?: string;
  matchDate: string;
  status: MatchStatus;
  round?: number;
  adjustmentReason?: string;
  adjustedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IScore {
  _id: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  recordedBy: string;
  homeConfirmed: boolean;
  awayConfirmed: boolean;
  confirmedAt?: string;
}

export interface IMatchEvent {
  _id: string;
  scoreId: string;
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'other';
  playerId?: string;
  minute: number;
  description?: string;
}

export interface IAppeal {
  _id: string;
  matchId: string;
  submittedBy: string;
  reason: string;
  evidence: string[];
  status: AppealStatus;
  resolvedBy?: string;
  resolution?: string;
  deadline: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface IStanding {
  _id: string;
  teamId: string;
  seasonId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface IMessage {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type: MessageType;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  operatorId: string;
  module: AuditModule;
  action: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}
