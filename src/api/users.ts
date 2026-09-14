import { apiClient } from './client';
import type { EscalationRole, PermissionRole, UserSummaryDto } from './types';

/**
 * People in the current tenant, for choosing rota members and escalation targets.
 *
 * Departed staff are left out unless asked for, so a picker cannot offer somebody who would
 * never answer the page. The staff list asks for everyone.
 */
export function listUsers(options: { includeDeactivated?: boolean } = {}) {
  return apiClient
    .get<UserSummaryDto[]>('/api/users/', {
      params: options.includeDeactivated ? { includeDeactivated: true } : undefined,
    })
    .then((r) => r.data);
}

export interface CreateUserRequest {
  displayName: string;
  email: string;
  password: string;
  permissionRole: PermissionRole;
  escalationRole: EscalationRole;
}

export interface CreateUserResponse {
  id: string;
  displayName: string;
  permissionRole: PermissionRole;
  escalationRole: EscalationRole;
  createdAt: string;
}

/**
 * Admin only. There is deliberately no tenant in the request — the API takes it from the
 * caller's token, so an account can only ever be created inside your own tenant.
 */
export function createUser(request: CreateUserRequest) {
  return apiClient.post<CreateUserResponse>('/api/users/', request).then((r) => r.data);
}

export interface SetUserActivationResponse {
  id: string;
  displayName: string;
  deactivatedAt: string | null;
}

/**
 * Takes somebody off the pager and out of the product. Not a delete: anyone named on an
 * escalation tier could not be deleted anyway, and removing a user would rewrite answered
 * incidents into unanswered ones.
 *
 * Rejected with 409 when aimed at yourself — that is how a tenant loses its last Admin.
 */
export function deactivateUser(userId: string) {
  return apiClient
    .post<SetUserActivationResponse>(`/api/users/${userId}/deactivate`)
    .then((r) => r.data);
}

export function reactivateUser(userId: string) {
  return apiClient
    .post<SetUserActivationResponse>(`/api/users/${userId}/reactivate`)
    .then((r) => r.data);
}
