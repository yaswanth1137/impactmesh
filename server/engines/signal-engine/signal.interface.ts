/**
 * IMPACTMESH - Signal Engine Contracts
 * Layer: Signal / Trigger / Human Review
 * 
 * Establishes the distinction between raw events, detected signals,
 * human reviews, and formal decisions.
 */

import type { DepartmentCode, DecisionEvent } from '../../../src/types/events.ts';
import type { ExecutiveRole } from '../../../src/types/policies.ts';

export type SignalScope =
  | 'ENTITY'
  | 'PROJECT'
  | 'CUSTOMER'
  | 'DEPARTMENT'
  | 'BUSINESS_UNIT'
  | 'ORGANIZATION';

export type SignalState =
  | 'NEW'
  | 'REVIEWING'
  | 'ACKNOWLEDGED'
  | 'ESCALATED'
  | 'CONVERTED_TO_DECISION'
  | 'DISMISSED'
  | 'RESOLVED';

export type MaterialityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type SignalReviewDecision =
  | 'ACKNOWLEDGE'
  | 'DISMISS'
  | 'ESCALATE'
  | 'CREATE_DECISION'
  | 'REQUEST_MORE_CONTEXT';

export type ReviewerRole =
  | ExecutiveRole
  | 'ceo'
  | 'cfo'
  | 'coo'
  | 'balanced'
  | 'CEO'
  | 'CFO'
  | 'COO'
  | 'OPERATOR'
  | 'TEAM_LEAD'
  | string;

export interface SignalEvidence {
  metric: string;
  currentValue: number | string;
  thresholdValue: number | string;
  variancePct?: number;
  financialExposureINR?: number;
  affectedCapacityHours?: number;
  deliveryDelayDays?: number;
  affectedDepartments: DepartmentCode[];
  affectedEntityIds: string[];
  explanation: string;
  missingContextFields?: string[];
}

export interface Signal {
  id: string;
  organizationId: string;
  scope: SignalScope;
  scopeId: string;
  scopeName: string;
  type: string;
  title: string;
  summary: string;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  priorityScore: number; // 0 - 100 deterministic
  priorityRank: 'P1' | 'P2' | 'P3' | 'P4';
  materiality: MaterialityLevel;
  triggerRuleId: string;
  detectedAt: string;
  evidence: SignalEvidence;
  state: SignalState;
  relatedEntities: string[];
  relatedDepartments: DepartmentCode[];
  deduplicationKey: string;
  occurrenceCount: number;
  lastUpdatedAt: string;
  resolvedAt?: string;
  convertedDecisionId?: string;
}

export interface SignalReview {
  id: string;
  signalId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: ReviewerRole;
  decision: SignalReviewDecision;
  comment?: string;
  requestedFields?: string[];
  reviewedAt: string;
}

export interface DecisionReview {
  decisionId: string;
  reviewerId: string;
  reviewerName: string;
  role: ReviewerRole;
  systemRecommendationId: string;
  systemRecommendedOptionId: string;
  selectedOptionId: string;
  override: boolean;
  overrideReason?: string;
  approvedAt: string;
}

export interface DecisionContext {
  decisionId: string;
  sourceSignalId: string;
  triggerRuleId: string;
  organizationId: string;
  relevantMetrics: Record<string, number | string>;
  relevantEntityIds: string[];
  relevantDepartmentCodes: DepartmentCode[];
  provenance: {
    originEventId: string;
    signalDetectedAt: string;
    reviewedAt: string;
    reviewerId: string;
  };
}

export interface ConvertedDecision {
  decisionId: string;
  sourceSignalId: string;
  triggerRuleId: string;
  title: string;
  description: string;
  scope: SignalScope;
  scopeId: string;
  department: DepartmentCode;
  createdAt: string;
  syntheticEvent: DecisionEvent;
  decisionContext: DecisionContext;
}
