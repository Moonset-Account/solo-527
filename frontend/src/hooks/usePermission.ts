import { useAuth } from '@/store/authStore';
import type { UserRole } from '@/types';

export function usePermission() {
  const { user, hasRole } = useAuth();

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = hasRole('admin');
  const isTeacher = hasRole('teacher');
  const isParent = hasRole('parent');

  return {
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isParent,
  };
}
