import { create } from 'zustand';
import { PermissionState, UserRole } from '@/types';

interface PermissionStore extends PermissionState {
  setRole: (role: UserRole) => void;
}

const getPermissionsForRole = (role: UserRole): PermissionState => {
  switch (role) {
    case 'admin':
      return {
        role,
        canExportRawData: true,
        canViewExceedDetail: true,
        canManageScheduledReports: true
      };
    case 'researcher':
      return {
        role,
        canExportRawData: true,
        canViewExceedDetail: true,
        canManageScheduledReports: false
      };
    case 'public':
    default:
      return {
        role: 'public',
        canExportRawData: false,
        canViewExceedDetail: false,
        canManageScheduledReports: false
      };
  }
};

export const usePermissionStore = create<PermissionStore>((set) => ({
  ...getPermissionsForRole('public'),

  setRole: (role) => set(getPermissionsForRole(role))
}));
