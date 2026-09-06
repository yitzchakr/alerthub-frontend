import { apiClient } from './client';
import type { LoginResponse } from './types';

export function login(email: string, password: string) {
  return apiClient.post<LoginResponse>('/api/auth/login', { email, password }).then((r) => r.data);
}

export interface JwtClaims {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  exp: number;
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
