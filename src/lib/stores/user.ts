import { writable, derived } from 'svelte/store';
import type { User, UserRole } from '$types';

const mockCurrentUser: User = {
  id: 'user-001',
  name: '张明',
  email: 'zhangming@lab.edu',
  role: 'researcher'
};

const mockAdminUser: User = {
  id: 'user-admin',
  name: '陈管理员',
  email: 'admin@lab.edu',
  role: 'admin'
};

export const currentUser = writable<User>(mockCurrentUser);

export const isAdmin = derived(currentUser, ($user) => $user.role === 'admin');

export const userName = derived(currentUser, ($user) => $user.name);

export function toggleUserRole() {
  currentUser.update((user) => {
    if (user.role === 'admin') {
      return mockCurrentUser;
    } else {
      return mockAdminUser;
    }
  });
}

export function setUserRole(role: UserRole) {
  currentUser.update((user) => ({
    ...user,
    role
  }));
}
