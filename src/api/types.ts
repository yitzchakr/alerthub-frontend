export const IncidentSeverity = {
  P1_Critical: 0,
  P2_High: 1,
  P3_Medium: 2,
  P4_Low: 3,
} as const;
export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity];

export const IncidentStatus = {
  Triggered: 0,
  Acknowledged: 1,
  Investigating: 2,
  Resolved: 3,
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];

export const UserRole = {
  Admin: 0,
  Responder: 1,
  Viewer: 2,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const IncidentSeverityLabel: Record<IncidentSeverity, string> = {
  [IncidentSeverity.P1_Critical]: 'P1 - Critical',
  [IncidentSeverity.P2_High]: 'P2 - High',
  [IncidentSeverity.P3_Medium]: 'P3 - Medium',
  [IncidentSeverity.P4_Low]: 'P4 - Low',
};

export const IncidentStatusLabel: Record<IncidentStatus, string> = {
  [IncidentStatus.Triggered]: 'Triggered',
  [IncidentStatus.Acknowledged]: 'Acknowledged',
  [IncidentStatus.Investigating]: 'Investigating',
  [IncidentStatus.Resolved]: 'Resolved',
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ServiceSummaryDto {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
}

export interface IncidentSummaryDto {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface EscalationPolicySummaryDto {
  id: string;
  name: string;
  tierCount: number;
}

export interface EscalationAssignmentDto {
  id: string;
  userId?: string | null;
  role?: UserRole | null;
  useOnCallSchedule: boolean;
}

export interface EscalationTierDto {
  id: string;
  level: number;
  escalateAfterMinutes: number;
  assignments: EscalationAssignmentDto[];
}

export interface EscalationPolicyDetailDto {
  id: string;
  name: string;
  tiers: EscalationTierDto[];
}

export interface TenantDto {
  id: string;
  name: string;
  createdAt: string;
}
