import { get, post, put, del } from './request';
import type {
  ProductionNode,
  ProductionProgress,
  Team,
  TeamSchedule,
  PaginatedResult,
  PaginationParams,
  ProgressQueryParams,
  ScheduleQueryParams,
} from '@/types';

const NODES_PREFIX = '/api/production/nodes';
const PROGRESS_PREFIX = '/api/production/progress';
const TEAMS_PREFIX = '/api/production/teams';
const SCHEDULES_PREFIX = '/api/production/schedules';

export const getNodes = (params?: PaginationParams): Promise<PaginatedResult<ProductionNode>> => {
  return get<PaginatedResult<ProductionNode>>(NODES_PREFIX, params);
};

export const getActiveNodes = (): Promise<ProductionNode[]> => {
  return get<ProductionNode[]>(`${NODES_PREFIX}/active`);
};

export const getNode = (id: string): Promise<ProductionNode> => {
  return get<ProductionNode>(`${NODES_PREFIX}/${id}`);
};

export const createNode = (
  data: Partial<ProductionNode>,
  operator?: string
): Promise<ProductionNode> => {
  return post<ProductionNode>(NODES_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateNode = (
  id: string,
  data: Partial<ProductionNode>,
  operator?: string
): Promise<ProductionNode> => {
  return put<ProductionNode>(`${NODES_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteNode = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${NODES_PREFIX}/${id}`);
};

export const getProgress = (params?: ProgressQueryParams): Promise<PaginatedResult<ProductionProgress>> => {
  return get<PaginatedResult<ProductionProgress>>(PROGRESS_PREFIX, params);
};

export const getProgressByOrder = (orderId: string): Promise<ProductionProgress[]> => {
  return get<ProductionProgress[]>(`${PROGRESS_PREFIX}/order/${orderId}`);
};

export const getProgressDetail = (id: string): Promise<ProductionProgress> => {
  return get<ProductionProgress>(`${PROGRESS_PREFIX}/${id}`);
};

export const createProgress = (
  data: Partial<ProductionProgress>,
  operator?: string
): Promise<ProductionProgress> => {
  return post<ProductionProgress>(PROGRESS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateProgress = (
  id: string,
  data: Partial<ProductionProgress>,
  operator?: string
): Promise<ProductionProgress> => {
  return put<ProductionProgress>(`${PROGRESS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteProgress = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${PROGRESS_PREFIX}/${id}`);
};

export const startProgress = (id: string, operator?: string): Promise<ProductionProgress> => {
  return post<ProductionProgress>(`${PROGRESS_PREFIX}/${id}/start`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const pauseProgress = (id: string, operator?: string): Promise<ProductionProgress> => {
  return post<ProductionProgress>(`${PROGRESS_PREFIX}/${id}/pause`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const completeProgress = (
  id: string,
  data?: { completedQuantity?: number },
  operator?: string
): Promise<ProductionProgress> => {
  return post<ProductionProgress>(`${PROGRESS_PREFIX}/${id}/complete`, data, {
    params: { operator: operator || 'system' },
  });
};

export const assignTeam = (
  id: string,
  data: { teamId: string },
  operator?: string
): Promise<ProductionProgress> => {
  return post<ProductionProgress>(`${PROGRESS_PREFIX}/${id}/assign-team`, data, {
    params: { operator: operator || 'system' },
  });
};

export const getTeams = (params?: PaginationParams): Promise<PaginatedResult<Team>> => {
  return get<PaginatedResult<Team>>(TEAMS_PREFIX, params);
};

export const getActiveTeams = (): Promise<Team[]> => {
  return get<Team[]>(`${TEAMS_PREFIX}/active`);
};

export const getTeam = (id: string): Promise<Team> => {
  return get<Team>(`${TEAMS_PREFIX}/${id}`);
};

export const createTeam = (
  data: Partial<Team>,
  operator?: string
): Promise<Team> => {
  return post<Team>(TEAMS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateTeam = (
  id: string,
  data: Partial<Team>,
  operator?: string
): Promise<Team> => {
  return put<Team>(`${TEAMS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteTeam = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${TEAMS_PREFIX}/${id}`);
};

export const getSchedules = (params?: ScheduleQueryParams): Promise<PaginatedResult<TeamSchedule>> => {
  return get<PaginatedResult<TeamSchedule>>(SCHEDULES_PREFIX, params);
};

export const getSchedulesByRange = (
  startDate: string,
  endDate: string
): Promise<TeamSchedule[]> => {
  return get<TeamSchedule[]>(`${SCHEDULES_PREFIX}/range`, { startDate, endDate });
};

export const getSchedule = (id: string): Promise<TeamSchedule> => {
  return get<TeamSchedule>(`${SCHEDULES_PREFIX}/${id}`);
};

export const createSchedule = (
  data: Partial<TeamSchedule>,
  operator?: string
): Promise<TeamSchedule> => {
  return post<TeamSchedule>(SCHEDULES_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateSchedule = (
  id: string,
  data: Partial<TeamSchedule>,
  operator?: string
): Promise<TeamSchedule> => {
  return put<TeamSchedule>(`${SCHEDULES_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteSchedule = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${SCHEDULES_PREFIX}/${id}`);
};

export const startSchedule = (id: string, operator?: string): Promise<TeamSchedule> => {
  return post<TeamSchedule>(`${SCHEDULES_PREFIX}/${id}/start`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const completeSchedule = (id: string, operator?: string): Promise<TeamSchedule> => {
  return post<TeamSchedule>(`${SCHEDULES_PREFIX}/${id}/complete`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const cancelSchedule = (id: string, operator?: string): Promise<TeamSchedule> => {
  return post<TeamSchedule>(`${SCHEDULES_PREFIX}/${id}/cancel`, undefined, {
    params: { operator: operator || 'system' },
  });
};
