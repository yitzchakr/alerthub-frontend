import { apiClient } from './client';
import type {
  IncidentDetailDto,
  IncidentSeverity,
  IncidentSummaryDto,
  PagedResult,
} from './types';

// A service's incidents are a sub-collection of that service, which leaves
// /api/incidents/{id} free for the incident itself.
export function listIncidents(serviceId: string, page = 1, pageSize = 20) {
  return apiClient
    .get<PagedResult<IncidentSummaryDto>>(`/api/services/${serviceId}/incidents`, {
      params: { page, pageSize },
    })
    .then((r) => r.data);
}

export function getIncidentDetail(incidentId: string) {
  return apiClient.get<IncidentDetailDto>(`/api/incidents/${incidentId}`).then((r) => r.data);
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
