import { apiClient } from './client';
import type { CurrentOnCallResponse, OnCallShiftDto, PagedResult } from './types';

export interface OnCallShiftFilter {
  serviceId?: string;
  userId?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
}

export function listOnCallShifts(filter: OnCallShiftFilter = {}) {
  return apiClient
    .get<PagedResult<OnCallShiftDto>>('/api/on-call/shifts', { params: filter })
    .then((r) => r.data);
}

/**
 * Answers 200 with a null onCall when nobody is scheduled. That is a real answer — an
 * unstaffed hour — rather than an error, so callers should render the gap instead of
 * treating it as a failure.
 */
export function getCurrentOnCall(serviceId: string, at?: string) {
  return apiClient
    .get<CurrentOnCallResponse>(`/api/on-call/services/${serviceId}/current`, {
      params: at ? { at } : undefined,
    })
    .then((r) => r.data);
}

export interface CreateOnCallShiftRequest {
  serviceId: string;
  userId: string;
  startUtc: string;
  endUtc: string;
  timeZoneId?: string;
}

/** Rejected with 409 when the window overlaps an existing shift for the same service. */
export function createOnCallShift(request: CreateOnCallShiftRequest) {
  return apiClient
    .post<{ id: string; startUtc: string; endUtc: string }>('/api/on-call/shifts', request)
    .then((r) => r.data);
}

export function updateOnCallShift(
  shiftId: string,
  request: { userId: string; startUtc: string; endUtc: string; timeZoneId?: string },
) {
  return apiClient.put(`/api/on-call/shifts/${shiftId}`, request).then((r) => r.data);
}

export function deleteOnCallShift(shiftId: string) {
  return apiClient.delete(`/api/on-call/shifts/${shiftId}`);
}
