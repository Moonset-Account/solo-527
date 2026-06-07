import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserRole } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const userRole = ref<UserRole>('librarian');
  const userId = ref('LIB001');
  const userName = ref('张馆员');
  
  const permissions = computed(() => {
    switch (userRole.value) {
      case 'super_admin':
        return ['view_all', 'view_raw_data', 'export', 'config', 'manage_users'];
      case 'librarian':
        return ['view_aggregate', 'export_stats', 'view_masked_data'];
      case 'student':
        return ['view_own_records'];
      default:
        return [];
    }
  });
  
  function setRole(role: UserRole) {
    userRole.value = role;
  }
  
  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm);
  }
  
  return {
    userRole,
    userId,
    userName,
    permissions,
    setRole,
    hasPermission,
  };
});
