import { UserRole } from '@prisma/client';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
}

const MOCK_USERS: CurrentUser[] = [
  {
    id: 'admin-1',
    name: '系统管理员',
    email: 'admin@company.com',
    phone: '13800000001',
    role: 'ADMIN',
    departmentId: 'dept-1',
  },
  {
    id: 'reception-1',
    name: '前台小王',
    email: 'reception@company.com',
    phone: '13800000002',
    role: 'RECEPTIONIST',
    departmentId: 'dept-1',
  },
  {
    id: 'employee-1',
    name: '张经理',
    email: 'zhang.manager@company.com',
    phone: '13800000003',
    role: 'EMPLOYEE',
    departmentId: 'dept-1',
  },
  {
    id: 'employee-2',
    name: '李主管',
    email: 'li.supervisor@company.com',
    phone: '13800000004',
    role: 'EMPLOYEE',
    departmentId: 'dept-2',
  },
];

const USER_STORAGE_KEY = 'current_user_id';

export function getCurrentUser(): CurrentUser {
  if (typeof window !== 'undefined') {
    const storedUserId = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUserId) {
      const user = MOCK_USERS.find((u) => u.id === storedUserId);
      if (user) return user;
    }
  }
  return MOCK_USERS[2];
}

export function getServerCurrentUser(userId?: string): CurrentUser {
  if (userId) {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) return user;
  }
  return MOCK_USERS[2];
}

export function setCurrentUser(userId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, userId);
  }
}

export function getMockUsers() {
  return MOCK_USERS;
}

export function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN: '系统管理员',
    RECEPTIONIST: '前台',
    EMPLOYEE: '普通员工',
  };
  return labels[role] || role;
}
