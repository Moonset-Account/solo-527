import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserRole } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const userRole = ref<UserRole>('librarian');
  const userId = ref('LIB001');
  const userName = ref('张馆员');
  const studentId = ref<string | null>(null);
  
  const permissions = computed(() => {
    switch (userRole.value) {
      case 'super_admin':
        return ['view_all', 'view_raw_data', 'export', 'config', 'manage_users', 'drill_down'];
      case 'librarian':
        return ['view_aggregate', 'export_stats', 'view_masked_data', 'drill_down'];
      case 'student':
        return ['view_own_records'];
      default:
        return [];
    }
  });
  
  function setRole(role: UserRole) {
    userRole.value = role;
    if (role === 'student') {
      userId.value = 'STU001';
      userName.value = '王同学';
      studentId.value = '2023010234';
    } else if (role === 'super_admin') {
      userId.value = 'ADM001';
      userName.value = '李馆长';
      studentId.value = null;
    } else {
      userId.value = 'LIB001';
      userName.value = '张馆员';
      studentId.value = null;
    }
  }
  
  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm);
  }
  
  return {
    userRole,
    userId,
    userName,
    studentId,
    permissions,
    setRole,
    hasPermission,
  };
});
