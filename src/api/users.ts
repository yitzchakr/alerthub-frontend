import { apiClient } from './client';
import type { UserSummaryDto } from './types';

/** Everyone in the current tenant, for choosing rota members and escalation targets. */
export function listUsers() {
  return apiClient.get<UserSummaryDto[]>('/api/users/').then((r) => r.data);
}
