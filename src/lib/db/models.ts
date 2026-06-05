import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { 
  Season as SeasonType, 
  Team as TeamType, 
  Player as PlayerType, 
  Match as MatchType, 
  PlayerStat as PlayerStatType, 
  Venue as VenueType, 
  Appeal as AppealType, 
  Standing as StandingType, 
  User as UserType, 
  Notification as NotificationType, 
  ImportExportTask as ImportExportTaskType,
  CheckIn as CheckInType
} from '@/lib/types';

export interface ISeason extends Omit<SeasonType, '_id'>, Document {}
export interface ITeam extends Omit<TeamType, '_id'>, Document {}
export interface IPlayer extends Omit<PlayerType, '_id'>, Document {}
export interface IMatch extends Omit<MatchType, '_id'>, Document {}
export interface IPlayerStat extends Omit<PlayerStatType, '_id'>, Document {}
export interface IVenue extends Omit<VenueType, '_id'>, Document {}
export interface IAppeal extends Omit<AppealType, '_id'>, Document {}
export interface IStanding extends Omit<StandingType, '_id'>, Document {}
export interface IUser extends Omit<UserType, '_id'>, Document {}
export interface INotification extends Omit<NotificationType, '_id'>, Document {}
export interface IImportExportTask extends Omit<ImportExportTaskType, '_id'>, Document {}
export interface ICheckIn extends Omit<CheckInType, '_id'>, Document {}

const SeasonSchema = new Schema({
  name: { type: String, required: true, index: true },
  year: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED'],
    default: 'UPCOMING'
  },
  rules: {
    pointsPerWin: { type: Number, default: 2 },
    pointsPerDraw: { type: Number, default: 1 },
    pointsPerLoss: { type: Number, default: 0 },
    rosterLockHoursBeforeMatch: { type: Number, default: 1 },
    appealDeadlineHoursAfterMatch: { type: Number, default: 24 },
  }
}, {
  timestamps: true
});

SeasonSchema.index({ name: 1, year: 1 }, { unique: true });

const TeamSchema = new Schema({
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true, index: true },
  name: { type: String, required: true },
  logo: { type: String },
  city: { type: String, required: true },
  coach: { type: String, required: true },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectReason: { type: String },
  registeredAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

TeamSchema.index({ seasonId: 1, name: 1 }, { unique: true });

const PlayerSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  name: { type: String, required: true },
  idNumber: { type: String, required: true },
  jerseyNumber: { type: Number, required: true },
  position: { 
    type: String, 
    required: true, 
    enum: ['PG', 'SG', 'SF', 'PF', 'C'] 
  },
  dateOfBirth: { type: Date },
  avatar: { type: String },
}, {
  timestamps: true
});

PlayerSchema.index({ teamId: 1, idNumber: 1 }, { unique: true });
PlayerSchema.index({ teamId: 1, jerseyNumber: 1 }, { unique: true });

const MatchSchema = new Schema({
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true, index: true },
  round: { type: Number, required: true },
  group: { type: String },
  homeTeamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
  refereeIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { 
    type: String, 
    required: true, 
    enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED'
  },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  quarterScores: [[Number]],
  rosterLocked: { type: Boolean, default: false },
  lockTime: { type: Date },
  attendance: { type: Number },
  notes: { type: String },
}, {
  timestamps: true
});

MatchSchema.index({ seasonId: 1, round: 1, homeTeamId: 1 }, { unique: true });
MatchSchema.index({ venueId: 1, startTime: 1 }, { unique: true });

const PlayerStatSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  points: { type: Number, default: 0 },
  rebounds: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  steals: { type: Number, default: 0 },
  blocks: { type: Number, default: 0 },
  fouls: { type: Number, default: 0 },
  turnovers: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  isStarter: { type: Boolean, default: false },
}, {
  timestamps: true
});

PlayerStatSchema.index({ matchId: 1, playerId: 1 }, { unique: true });

const VenueSchema = new Schema({
  name: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  capacity: { type: Number, required: true },
  description: { type: String },
}, {
  timestamps: true
});

const AppealSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['SCORE', 'FOUL', 'REFEREE', 'ELIGIBILITY', 'OTHER'] 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  evidenceUrls: [{ type: String }],
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'REVIEWING', 'UPHELD', 'REJECTED'],
    default: 'PENDING'
  },
  submittedAt: { type: Date, default: Date.now },
  deadline: { type: Date, required: true },
  decidedAt: { type: Date },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  decision: { type: String },
}, {
  timestamps: true
});

AppealSchema.index({ matchId: 1, teamId: 1 }, { unique: true });

const StandingSchema = new Schema({
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true, index: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  pointsFor: { type: Number, default: 0 },
  pointsAgainst: { type: Number, default: 0 },
  pointDifference: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  group: { type: String },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true
});

StandingSchema.index({ seasonId: 1, teamId: 1 }, { unique: true });

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['SUPER_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER', 'REFEREE', 'FIELD_STAFF', 'VIEWER'],
    default: 'VIEWER'
  },
  phone: { type: String },
  avatar: { type: String },
}, {
  timestamps: true
});

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  templateId: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 5 },
  nextRetryAt: { type: Date },
  sentAt: { type: Date },
  errorMessage: { type: String },
}, {
  timestamps: true
});

NotificationSchema.index({ status: 1, nextRetryAt: 1 });

const ImportExportTaskSchema = new Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['IMPORT', 'EXPORT'] 
  },
  entity: { 
    type: String, 
    required: true, 
    enum: ['TEAMS', 'PLAYERS', 'SCHEDULE', 'SCORES', 'STANDINGS'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  fileUrl: { type: String },
  fileName: { type: String },
  progress: { type: Number, default: 0 },
  totalRecords: { type: Number, default: 0 },
  processedRecords: { type: Number, default: 0 },
  importErrors: [{
    row: { type: Number, required: true },
    message: { type: String, required: true }
  }],
  batchId: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

const CheckInSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ['REFEREE', 'TEAM_MANAGER', 'PLAYER', 'FIELD_STAFF', 'GUEST']
  },
  checkinTime: { type: Date, required: true, default: Date.now },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  photoUrl: { type: String },
  notes: { type: String },
}, {
  timestamps: true
});

CheckInSchema.index({ matchId: 1, userId: 1 }, { unique: true });

export const Season = (mongoose.models.Season as Model<ISeason>) || mongoose.model<ISeason>('Season', SeasonSchema);
export const Team = (mongoose.models.Team as Model<ITeam>) || mongoose.model<ITeam>('Team', TeamSchema);
export const Player = (mongoose.models.Player as Model<IPlayer>) || mongoose.model<IPlayer>('Player', PlayerSchema);
export const Match = (mongoose.models.Match as Model<IMatch>) || mongoose.model<IMatch>('Match', MatchSchema);
export const PlayerStat = (mongoose.models.PlayerStat as Model<IPlayerStat>) || mongoose.model<IPlayerStat>('PlayerStat', PlayerStatSchema);
export const Venue = (mongoose.models.Venue as Model<IVenue>) || mongoose.model<IVenue>('Venue', VenueSchema);
export const Appeal = (mongoose.models.Appeal as Model<IAppeal>) || mongoose.model<IAppeal>('Appeal', AppealSchema);
export const Standing = (mongoose.models.Standing as Model<IStanding>) || mongoose.model<IStanding>('Standing', StandingSchema);
export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
export const Notification = (mongoose.models.Notification as Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
export const ImportExportTask = (mongoose.models.ImportExportTask as Model<IImportExportTask>) || mongoose.model<IImportExportTask>('ImportExportTask', ImportExportTaskSchema);
export const CheckIn = (mongoose.models.CheckIn as Model<ICheckIn>) || mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
