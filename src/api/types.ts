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

/**
 * What a user is allowed to do. This is the value behind the token's role claim and every
 * authorization check on the API. It says nothing about who gets paged.
 *
 * Two values because two is what the API enforces: every check asks whether the caller is
 * Admin. These are ordinals on the wire — the API has no JsonStringEnumConverter — so the
 * numbering has to match the C# enum, and reordering is a breaking change.
 */
export const PermissionRole = {
  Admin: 0,
  Member: 1,
} as const;
export type PermissionRole = (typeof PermissionRole)[keyof typeof PermissionRole];

export const PermissionRoleLabel: Record<PermissionRole, string> = {
  [PermissionRole.Admin]: 'Admin',
  [PermissionRole.Member]: 'Member',
};

/**
 * Which sweep pages a user when a tier targets a role rather than a named person. Separate
 * from PermissionRole on purpose: the two used to be one field, so granting somebody Admin
 * to let them edit a policy also silently added them to every tier that paged Admin.
 *
 * The two vocabularies share no value name, which is what keeps that confusion from coming
 * back. Manager holds the ordinal the old Admin held.
 */
export const EscalationRole = {
  Manager: 0,
  Responder: 1,
} as const;
export type EscalationRole = (typeof EscalationRole)[keyof typeof EscalationRole];

export const EscalationRoleLabel: Record<EscalationRole, string> = {
  [EscalationRole.Manager]: 'Manager',
  [EscalationRole.Responder]: 'Responder',
};

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

export const IncidentEventType = {
  Created: 0,
  Acknowledged: 1,
  InvestigationStarted: 2,
  Escalated: 3,
  Resolved: 4,
  NoteAdded: 5,
  AiAnalysisCompleted: 6,
} as const;
export type IncidentEventType = (typeof IncidentEventType)[keyof typeof IncidentEventType];

export const IncidentEventTypeLabel: Record<IncidentEventType, string> = {
  [IncidentEventType.Created]: 'Created',
  [IncidentEventType.Acknowledged]: 'Acknowledged',
  [IncidentEventType.InvestigationStarted]: 'Investigating',
  [IncidentEventType.Escalated]: 'Escalated',
  [IncidentEventType.Resolved]: 'Resolved',
  [IncidentEventType.NoteAdded]: 'Note',
  [IncidentEventType.AiAnalysisCompleted]: 'AI analysis',
};

/** Why an escalation tier selected a person. */
export const EscalationTargetSource = {
  DirectUser: 0,
  Role: 1,
  OnCall: 2,
} as const;
export type EscalationTargetSource =
  (typeof EscalationTargetSource)[keyof typeof EscalationTargetSource];

export const EscalationTargetSourceLabel: Record<EscalationTargetSource, string> = {
  [EscalationTargetSource.DirectUser]: 'named directly',
  [EscalationTargetSource.Role]: 'by role',
  [EscalationTargetSource.OnCall]: 'on call',
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
  userDisplayName?: string | null;
  userEmail?: string | null;
  escalationRole?: EscalationRole | null;
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

export interface IncidentEventDto {
  eventType: IncidentEventType;
  description: string;
  occurredAt: string;
}

export interface EscalationRecipientDto {
  userId: string;
  displayName: string;
  email: string;
  source: EscalationTargetSource;
}

export interface IncidentEscalationDto {
  level: number;
  escalateAfterMinutes: number;
  dueAt: string;
  /** Null while a claimed tier has not been sent yet — it is retried on the next pass. */
  notifiedAt: string | null;
  attempts: number;
  /** Empty means the tier fired but resolved to nobody: a coverage gap. */
  targets: EscalationRecipientDto[];
}

export interface IncidentDetailDto {
  id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  acknowledgedByDisplayName: string | null;
  /** Set once escalation ran out of tiers without anyone acknowledging. */
  escalationExhaustedAt: string | null;
  escalationPolicyName: string | null;
  events: IncidentEventDto[];
  escalations: IncidentEscalationDto[];
}

export interface OnCallShiftDto {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  startUtc: string;
  endUtc: string;
  timeZoneId: string | null;
}

export interface OnCallUserDto {
  userId: string;
  displayName: string;
  email: string;
  shiftId: string;
  shiftStartUtc: string;
  shiftEndUtc: string;
}

/**
 * The API answers 200 with a null onCall rather than 404, because "no such service" and
 * "this hour is unstaffed" are different answers and only one of them is an error.
 */
export interface CurrentOnCallResponse {
  serviceId: string;
  atUtc: string;
  onCall: OnCallUserDto | null;
}

export interface EscalationTargetDto {
  userId: string;
  displayName: string;
  email: string;
  source: EscalationTargetSource;
}

export interface UserSummaryDto {
  id: string;
  displayName: string;
  email: string;
  permissionRole: PermissionRole;
  escalationRole: EscalationRole;
  /** Null while they are still staff. Set records a departure; users are never deleted. */
  deactivatedAt: string | null;
}
