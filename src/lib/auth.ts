import { UserRole } from '@prisma/client';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

const MOCK_USERS: CurrentUser[] = [
  {
    id: 'admin-1',
    name: '系统管理员',
    email: 'admin@company.com',
    role: 'ADMIN',
    departmentId: 'dept-1',
  },
  {
    id: 'reception-1',
    name: '前台小王',
    email: 'reception@company.com',
    role: 'RECEPTIONIST',
    departmentId: 'dept-1',
  },
  {
    id: 'employee-1',
    name: '张经理',
    email: 'zhang.manager@company.com',
    role: 'EMPLOYEE',
    departmentId: 'dept-1',
  },
  {
    id: 'employee-2',
    name: '李主管',
    email: 'li.supervisor@company.com',
    role: 'EMPLOYEE',
    departmentId: 'dept-2',
  },
];

export function getCurrentUser(): CurrentUser {
  return MOCK_USERS[2];
}

export function getMockUsers() {
  return MOCK_USERS;
}
