import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(2, '姓名至少2个字符'),
  role: z.enum(['SUPER_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER', 'REFEREE', 'FIELD_STAFF', 'VIEWER']),
  phone: z.string().optional(),
});

export const TeamSchema = z.object({
  seasonId: z.string().min(1, '赛季不能为空'),
  name: z.string().min(2, '队名至少2个字符'),
  logo: z.string().optional(),
  city: z.string().min(2, '城市名称至少2个字符'),
  coach: z.string().min(2, '教练姓名至少2个字符'),
  contactName: z.string().min(2, '联系人姓名至少2个字符'),
  contactPhone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
});

export const PlayerSchema = z.object({
  teamId: z.string().min(1, '球队不能为空'),
  name: z.string().min(2, '球员姓名至少2个字符'),
  idNumber: z.string().min(15, '身份证号格式不正确'),
  jerseyNumber: z.number().int().min(0).max(99, '球衣号码必须在0-99之间'),
  position: z.enum(['PG', 'SG', 'SF', 'PF', 'C']),
  dateOfBirth: z.date().optional(),
});

export const MatchSchema = z.object({
  seasonId: z.string().min(1, '赛季不能为空'),
  round: z.number().int().min(1, '轮次必须大于0'),
  group: z.string().optional(),
  homeTeamId: z.string().min(1, '主队不能为空'),
  awayTeamId: z.string().min(1, '客队不能为空'),
  venueId: z.string().min(1, '场馆不能为空'),
  refereeIds: z.array(z.string()).default([]),
  startTime: z.date({ invalid_type_error: '比赛时间不能为空' }),
});

export const ScoreUpdateSchema = z.object({
  homeScore: z.number().int().min(0, '比分不能为负数'),
  awayScore: z.number().int().min(0, '比分不能为负数'),
  quarterScores: z.array(z.array(z.number().int().min(0))).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']).optional(),
});

export const AppealSchema = z.object({
  matchId: z.string().min(1, '比赛不能为空'),
  teamId: z.string().min(1, '球队不能为空'),
  type: z.enum(['SCORE', 'FOUL', 'REFEREE', 'ELIGIBILITY', 'OTHER']),
  title: z.string().min(5, '申诉标题至少5个字符'),
  description: z.string().min(10, '申诉描述至少10个字符'),
  evidenceUrls: z.array(z.string()).default([]),
});

export const StandingSchema = z.object({
  seasonId: z.string().min(1, '赛季不能为空'),
  teamId: z.string().min(1, '球队不能为空'),
  played: z.number().int().min(0).default(0),
  won: z.number().int().min(0).default(0),
  drawn: z.number().int().min(0).default(0),
  lost: z.number().int().min(0).default(0),
  pointsFor: z.number().int().min(0).default(0),
  pointsAgainst: z.number().int().min(0).default(0),
});

export const VenueSchema = z.object({
  name: z.string().min(2, '场馆名称至少2个字符'),
  address: z.string().min(5, '场馆地址至少5个字符'),
  capacity: z.number().int().min(1, '场馆容量必须大于0'),
  description: z.string().optional(),
});

export const PlayerStatSchema = z.object({
  matchId: z.string().min(1, '比赛不能为空'),
  playerId: z.string().min(1, '球员不能为空'),
  teamId: z.string().min(1, '球队不能为空'),
  points: z.number().int().min(0).default(0),
  rebounds: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  steals: z.number().int().min(0).default(0),
  blocks: z.number().int().min(0).default(0),
  fouls: z.number().int().min(0).max(6, '单场犯规不能超过6次').default(0),
  turnovers: z.number().int().min(0).default(0),
  minutesPlayed: z.number().min(0).max(48, '出场时间不能超过48分钟').default(0),
  isStarter: z.boolean().default(false),
});

export const ImportExportSchema = z.object({
  type: z.enum(['IMPORT', 'EXPORT']),
  entity: z.enum(['TEAMS', 'PLAYERS', 'SCHEDULE', 'SCORES', 'STANDINGS']),
  file: z.any().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
});

export const RegisterSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
  name: z.string().min(2, '姓名至少2个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
});

export type TeamInput = z.infer<typeof TeamSchema>;
export type PlayerInput = z.infer<typeof PlayerSchema>;
export type MatchInput = z.infer<typeof MatchSchema>;
export type ScoreUpdateInput = z.infer<typeof ScoreUpdateSchema>;
export type AppealInput = z.infer<typeof AppealSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
