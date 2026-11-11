export type UserRole = 'ADMIN' | 'STAFF';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type AuthUserSummary = Pick<UserProfile, 'username' | 'fullName' | 'role'>;
