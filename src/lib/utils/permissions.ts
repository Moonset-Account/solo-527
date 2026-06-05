import type { UserRole } from '@/lib/types';

interface PermissionConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  allowedRoles: UserRole[] | ['*'];
  sensitiveFields: string[];
  preValidation?: string;
}

export const apiPermissions: PermissionConfig[] = [
  {
    endpoint: '/api/teams',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: ['contactPhone', 'contactName']
  },
  {
    endpoint: '/api/teams',
    method: 'POST',
    allowedRoles: ['TEAM_MANAGER', 'LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/teams/:id',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: ['contactPhone', 'contactName']
  },
  {
    endpoint: '/api/teams/:id',
    method: 'PUT',
    allowedRoles: ['SUPER_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/teams/:id/roster',
    method: 'PUT',
    allowedRoles: ['TEAM_MANAGER'],
    sensitiveFields: [],
    preValidation: 'validateRosterLock'
  },
  {
    endpoint: '/api/teams/:id/approve',
    method: 'POST',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/players',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: ['idNumber']
  },
  {
    endpoint: '/api/players',
    method: 'POST',
    allowedRoles: ['TEAM_MANAGER', 'LEAGUE_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches',
    method: 'POST',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id',
    method: 'PUT',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id/score',
    method: 'PUT',
    allowedRoles: ['REFEREE', 'LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id/lock-roster',
    method: 'POST',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/standings',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/standings/recalculate',
    method: 'POST',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/appeals',
    method: 'GET',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN', 'TEAM_MANAGER'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/appeals',
    method: 'POST',
    allowedRoles: ['TEAM_MANAGER'],
    sensitiveFields: [],
    preValidation: 'validateAppealDeadline'
  },
  {
    endpoint: '/api/appeals/:id',
    method: 'PUT',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/venues',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/venues',
    method: 'POST',
    allowedRoles: ['LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/admin/import',
    method: 'POST',
    allowedRoles: ['SUPER_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/admin/export',
    method: 'GET',
    allowedRoles: ['SUPER_ADMIN', 'LEAGUE_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/admin/tasks/:id',
    method: 'GET',
    allowedRoles: ['SUPER_ADMIN', 'LEAGUE_ADMIN'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/users/me',
    method: 'GET',
    allowedRoles: ['SUPER_ADMIN', 'LEAGUE_ADMIN', 'TEAM_MANAGER', 'REFEREE', 'FIELD_STAFF'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/mobile/offline-sync',
    method: 'POST',
    allowedRoles: ['FIELD_STAFF', 'REFEREE'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/mobile/checkin',
    method: 'POST',
    allowedRoles: ['FIELD_STAFF', 'REFEREE', 'TEAM_MANAGER'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/mobile/upload',
    method: 'POST',
    allowedRoles: ['FIELD_STAFF', 'REFEREE', 'TEAM_MANAGER'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id/stats',
    method: 'GET',
    allowedRoles: ['*'],
    sensitiveFields: []
  },
  {
    endpoint: '/api/matches/:id/stats',
    method: 'POST',
    allowedRoles: ['REFEREE', 'LEAGUE_ADMIN', 'SUPER_ADMIN'],
    sensitiveFields: [],
    preValidation: 'validateRosterLock'
  }
];

export function hasPermission(userRole: UserRole | undefined | null, allowedRoles: (UserRole | '*')[]): boolean {
  if (!userRole) return allowedRoles.includes('*');
  if (allowedRoles.includes('*')) return true;
  return (allowedRoles as UserRole[]).includes(userRole);
}

export function filterSensitiveFields<T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[],
  userRole: UserRole | undefined | null
): T {
  if (!userRole || userRole === 'VIEWER') {
    const filtered = { ...data };
    sensitiveFields.forEach(field => {
      delete filtered[field as keyof T];
    });
    return filtered;
  }
  if (['SUPER_ADMIN', 'LEAGUE_ADMIN'].includes(userRole)) {
    return data;
  }
  return data;
}

export function findPermissionConfig(endpoint: string, method: string): PermissionConfig | undefined {
  return apiPermissions.find(p => {
    const endpointPattern = p.endpoint.replace(/:[\w]+/g, '[^/]+');
    const regex = new RegExp(`^${endpointPattern}$`);
    return regex.test(endpoint) && p.method === method.toUpperCase();
  });
}
