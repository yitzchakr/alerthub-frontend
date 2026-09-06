import { apiClient } from './client';
import type { ServiceSummaryDto } from './types';

export function listServices() {
  return apiClient.get<ServiceSummaryDto[]>('/api/services/').then((r) => r.data);
}

export function getService(id: string) {
  return apiClient.get<ServiceSummaryDto>(`/api/services/${id}`).then((r) => r.data);
}

export function createService(name: string, description?: string) {
  return apiClient.post<ServiceSummaryDto>('/api/services/', { name, description }).then((r) => r.data);
}
