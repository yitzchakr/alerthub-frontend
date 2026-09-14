import { apiClient } from './client';
import type {
  EscalationPolicyDetailDto,
  EscalationPolicySummaryDto,
  EscalationTargetDto,
  EscalationRole,
} from './types';

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
  assignment: { userId?: string; escalationRole?: EscalationRole; useOnCallSchedule: boolean },
) {
  return apiClient
    .post<{ assignmentId: string }>(
      `/api/escalation-policies/${policyId}/tiers/${tierId}/assignments`,
      assignment,
    )
    .then((r) => r.data);
}

/**
 * The people a tier would actually page, for a given service at a given moment. An empty
 * result means the tier is configured but currently reaches nobody — which is the whole
 * reason to be able to ask before an incident does it for you.
 */
export function getTierTargets(policyId: string, tierId: string, serviceId: string, at?: string) {
  return apiClient
    .get<EscalationTargetDto[]>(`/api/escalation-policies/${policyId}/tiers/${tierId}/targets`, {
      params: { serviceId, ...(at ? { at } : {}) },
    })
    .then((r) => r.data);
}
