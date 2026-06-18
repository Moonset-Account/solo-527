export enum UserRole {
  ADMIN = 'admin',
  DUTY_STAFF = 'duty_staff',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
