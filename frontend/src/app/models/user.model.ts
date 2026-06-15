export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'IT_SUPERVISOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}
