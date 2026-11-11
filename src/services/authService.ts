import type { ApiResponse } from '@/types/api';
import type { AuthSession, LoginRequest } from '@/types/auth';
import { apiGet, apiPost } from './httpClient';

export const authService = {
  createSession(): Promise<ApiResponse<AuthSession>> {
    return apiPost<AuthSession>('/auth/session');
  },

  login(payload: LoginRequest): Promise<ApiResponse<AuthSession>> {
    return apiPost<AuthSession, LoginRequest>('/auth/login', payload);
  },

  logout(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    return apiPost<{ loggedOut: boolean }>('/auth/logout');
  },

  getCurrentSession(): Promise<ApiResponse<AuthSession>> {
    return apiGet<AuthSession>('/auth/me');
  },
};
