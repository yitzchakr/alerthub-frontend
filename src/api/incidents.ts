import { apiClient } from './client';
import type { IncidentSeverity, IncidentSummaryDto, PagedResult } from './types';

export function listIncidents(serviceId: string, page = 1, pageSize = 20) {
  return apiClient
    .get<PagedResult<IncidentSummaryDto>>(`/api/incidents/${serviceId}`, { params: { page, pageSize } })
    .then((r) => r.data);
}

export function createIncident(serviceId: string, title: string, severity: IncidentSeverity, rawPayload?: string) {
  return apiClient
    .post<{ incidentId: string }>('/api/incidents/', { serviceId, title, severity, rawPayload })
    .then((r) => r.data);
}

export function acknowledgeIncident(incidentId: string, userId: string) {
  return apiClient.post(`/api/incidents/${incidentId}/acknowledge`, { userId });
}

export function investigateIncident(incidentId: string) {
  return apiClient.post(`/api/incidents/${incidentId}/investigate`);
}

export function resolveIncident(incidentId: string, resolution: string) {
  return apiClient.post(`/api/incidents/${incidentId}/resolve`, { resolution });
}
