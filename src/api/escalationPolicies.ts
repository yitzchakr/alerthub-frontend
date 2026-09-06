import { apiClient } from './client';
import type { EscalationPolicyDetailDto, EscalationPolicySummaryDto, UserRole } from './types';

export function listEscalationPolicies() {
  return apiClient.get<EscalationPolicySummaryDto[]>('/api/escalation-policies/').then((r) => r.data);
}

export function getEscalationPolicy(id: string) {
  return apiClient.get<EscalationPolicyDetailDto>(`/api/escalation-policies/${id}`).then((r) => r.data);
}

export function createEscalationPolicy(name: string) {
  return apiClient.post<{ id: string; name: string }>('/api/escalation-policies/', { name }).then((r) => r.data);
}

export function deleteEscalationPolicy(id: string) {
  return apiClient.delete(`/api/escalation-policies/${id}`);
}

export function addTier(policyId: string, level: number, escalateAfterMinutes: number) {
  return apiClient
    .post<{ tierId: string; level: number; escalateAfterMinutes: number }>(
      `/api/escalation-policies/${policyId}/tiers`,
      { level, escalateAfterMinutes },
    )
    .then((r) => r.data);
}

export function addAssignment(
  policyId: string,
  tierId: string,
  assignment: { userId?: string; role?: UserRole; useOnCallSchedule: boolean },
) {
  return apiClient
    .post<{ assignmentId: string }>(
      `/api/escalation-policies/${policyId}/tiers/${tierId}/assignments`,
      assignment,
    )
    .then((r) => r.data);
}
