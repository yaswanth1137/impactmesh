/**
 * IMPACTMESH - Signal Lifecycle & Human Review Service
 * Manages signal state, cooldown deduplication, human reviews, decision conversion, and overrides.
 */

import type {
  Signal,
  SignalReview,
  DecisionReview,
  ConvertedDecision,
  DecisionContext,
  ReviewerRole,
} from './signal.interface.ts';
import type { TriggerRuleResult, TriggerEvaluationContext } from './trigger-rule.interface.ts';
import { triggerRuleService } from './trigger-rule.service.ts';
import { signalPriorityService } from './signal-priority.service.ts';
import type { StateDelta } from '../../services/state-transition/state-transition.interface.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';

export class SignalService {
  private signals: Map<string, Signal> = new Map();
  private signalReviews: Map<string, SignalReview[]> = new Map();
  private decisionReviews: Map<string, DecisionReview[]> = new Map();

  /**
   * Ingests business state and optional delta, evaluates triggers, and applies deduplication.
   */
  public processState(ctx: TriggerEvaluationContext, delta?: StateDelta): Signal[] {
    const triggerResults = triggerRuleService.evaluateIncremental(ctx, delta);
    const updatedSignals: Signal[] = [];

    for (const res of triggerResults) {
      const sig = this.ingestTriggerResult(res, ctx.state.organization_id || '00000000-0000-0000-0000-000000000000');
      updatedSignals.push(sig);
    }

    return updatedSignals;
  }

  /**
   * Ingests a single trigger result with deduplication and cooldown logic.
   */
  public ingestTriggerResult(res: TriggerRuleResult, organizationId: string = '00000000-0000-0000-0000-000000000000'): Signal {
    const deduplicationKey = `${res.scope}:${res.scopeId}:${res.ruleId}`;
    const now = new Date().toISOString();

    // Check if an active signal already exists for this key
    const existing = Array.from(this.signals.values()).find(
      (s) =>
        s.deduplicationKey === deduplicationKey &&
        (s.state === 'NEW' || s.state === 'REVIEWING' || s.state === 'ACKNOWLEDGED' || s.state === 'ESCALATED')
    );

    const priorityInfo = signalPriorityService.calculatePriority(res);

    if (existing) {
      // Cooldown / deduplication: update existing active signal instead of creating duplicates
      existing.occurrenceCount += 1;
      existing.lastUpdatedAt = now;
      existing.priorityScore = priorityInfo.score;
      existing.priorityRank = priorityInfo.rank;
      existing.materiality = priorityInfo.materiality;
      existing.summary = res.summary;
      existing.evidence = {
        metric: res.metric,
        currentValue: res.currentValue,
        thresholdValue: res.thresholdValue,
        financialExposureINR: res.financialExposureINR,
        affectedCapacityHours: res.affectedCapacityHours,
        deliveryDelayDays: res.deliveryDelayDays,
        affectedDepartments: res.affectedDepartments,
        affectedEntityIds: res.affectedEntityIds,
        explanation: res.explanation,
        missingContextFields: res.missingContextFields,
      };
      return existing;
    }

    // Create new signal
    const id = `SIG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    const newSignal: Signal = {
      id,
      organizationId,
      scope: res.scope,
      scopeId: res.scopeId,
      scopeName: res.scopeName,
      type: res.ruleId,
      title: res.title,
      summary: res.summary,
      severity: res.severity,
      priorityScore: priorityInfo.score,
      priorityRank: priorityInfo.rank,
      materiality: priorityInfo.materiality,
      triggerRuleId: res.ruleId,
      detectedAt: now,
      evidence: {
        metric: res.metric,
        currentValue: res.currentValue,
        thresholdValue: res.thresholdValue,
        financialExposureINR: res.financialExposureINR,
        affectedCapacityHours: res.affectedCapacityHours,
        deliveryDelayDays: res.deliveryDelayDays,
        affectedDepartments: res.affectedDepartments,
        affectedEntityIds: res.affectedEntityIds,
        explanation: res.explanation,
        missingContextFields: res.missingContextFields,
      },
      state: 'NEW',
      relatedEntities: res.affectedEntityIds,
      relatedDepartments: res.affectedDepartments,
      deduplicationKey,
      occurrenceCount: 1,
      lastUpdatedAt: now,
    };

    this.signals.set(id, newSignal);
    return newSignal;
  }

  public getSignal(signalId: string): Signal | undefined {
    return this.signals.get(signalId);
  }

  public getAllSignals(): Signal[] {
    return Array.from(this.signals.values());
  }

  public getActiveSignals(): Signal[] {
    return Array.from(this.signals.values()).filter(
      (s) => s.state === 'NEW' || s.state === 'REVIEWING' || s.state === 'ACKNOWLEDGED' || s.state === 'ESCALATED'
    );
  }

  /**
   * Human Review: Acknowledges signal without immediate decision conversion.
   */
  public acknowledgeSignal(
    signalId: string,
    reviewer: { id: string; name: string; role: ReviewerRole },
    comment?: string
  ): Signal {
    const signal = this.getSignal(signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    signal.state = 'ACKNOWLEDGED';
    signal.lastUpdatedAt = new Date().toISOString();

    this.recordSignalReview({
      id: `REV-${Date.now().toString(36)}`,
      signalId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      decision: 'ACKNOWLEDGE',
      comment: comment || 'Acknowledged by operator. Monitoring for further progression.',
      reviewedAt: signal.lastUpdatedAt,
    });

    return signal;
  }

  /**
   * Human Review: Dismisses signal as immaterial or expected behavior.
   */
  public dismissSignal(
    signalId: string,
    reviewer: { id: string; name: string; role: ReviewerRole },
    comment?: string
  ): Signal {
    const signal = this.getSignal(signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    signal.state = 'DISMISSED';
    signal.resolvedAt = new Date().toISOString();
    signal.lastUpdatedAt = signal.resolvedAt;

    this.recordSignalReview({
      id: `REV-${Date.now().toString(36)}`,
      signalId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      decision: 'DISMISS',
      comment: comment || 'Dismissed by operator. Context confirmed non-critical.',
      reviewedAt: signal.lastUpdatedAt,
    });

    return signal;
  }

  /**
   * Human Review: Escalates signal to cross-departmental executive attention.
   */
  public escalateSignal(
    signalId: string,
    reviewer: { id: string; name: string; role: ReviewerRole },
    comment?: string
  ): Signal {
    const signal = this.getSignal(signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    signal.state = 'ESCALATED';
    signal.lastUpdatedAt = new Date().toISOString();

    this.recordSignalReview({
      id: `REV-${Date.now().toString(36)}`,
      signalId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      decision: 'ESCALATE',
      comment: comment || 'Escalated to Executive Bridge for urgent cross-functional review.',
      reviewedAt: signal.lastUpdatedAt,
    });

    return signal;
  }

  /**
   * Human Review: Requests additional context/telemetry.
   */
  public requestMoreContext(
    signalId: string,
    reviewer: { id: string; name: string; role: ReviewerRole },
    requestedFields: string[],
    comment?: string
  ): Signal {
    const signal = this.getSignal(signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    signal.state = 'REVIEWING';
    signal.evidence.missingContextFields = Array.from(
      new Set([...(signal.evidence.missingContextFields || []), ...requestedFields])
    );
    signal.lastUpdatedAt = new Date().toISOString();

    this.recordSignalReview({
      id: `REV-${Date.now().toString(36)}`,
      signalId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      decision: 'REQUEST_MORE_CONTEXT',
      comment: comment || `Requested additional context on: ${requestedFields.join(', ')}`,
      requestedFields,
      reviewedAt: signal.lastUpdatedAt,
    });

    return signal;
  }

  /**
   * Human Review: Converts signal into a formal Decision.
   * This is the mandatory human gate before deterministic option analysis begins.
   */
  public convertToDecision(
    signalId: string,
    reviewer: { id: string; name: string; role: ReviewerRole },
    comment?: string
  ): ConvertedDecision {
    const signal = this.getSignal(signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    const decisionId = `DEC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    const now = new Date().toISOString();

    signal.state = 'CONVERTED_TO_DECISION';
    signal.convertedDecisionId = decisionId;
    signal.lastUpdatedAt = now;

    const reviewId = `REV-${Date.now().toString(36)}`;
    this.recordSignalReview({
      id: reviewId,
      signalId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewerRole: reviewer.role,
      decision: 'CREATE_DECISION',
      comment: comment || 'Human operator approved signal elevation into formal Decision cycle.',
      reviewedAt: now,
    });

    const primaryDept = signal.relatedDepartments[0] || 'engineering';

    const syntheticEvent: DecisionEvent<'capacity_changed'> = {
      id: `EVT-${decisionId}`,
      organization_id: signal.organizationId,
      department: primaryDept,
      event_type: 'capacity_changed',
      entity_id: signal.relatedEntities[0] || signal.scopeId,
      payload: {
        team_id: signal.scopeId || 'team-eng-core',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: now,
      },
      created_by: `${reviewer.name} (${reviewer.role})`,
      created_at: now,
    };

    const decisionContext: DecisionContext = {
      decisionId,
      sourceSignalId: signal.id,
      triggerRuleId: signal.triggerRuleId,
      organizationId: signal.organizationId,
      relevantMetrics: {
        [signal.evidence.metric]: signal.evidence.currentValue,
        financialExposureINR: signal.evidence.financialExposureINR ?? 0,
        affectedCapacityHours: signal.evidence.affectedCapacityHours ?? 0,
        deliveryDelayDays: signal.evidence.deliveryDelayDays ?? 0,
      },
      relevantEntityIds: signal.relatedEntities,
      relevantDepartmentCodes: signal.relatedDepartments,
      provenance: {
        originEventId: syntheticEvent.id,
        signalDetectedAt: signal.detectedAt,
        reviewedAt: now,
        reviewerId: reviewer.id,
      },
    };

    return {
      decisionId,
      sourceSignalId: signal.id,
      triggerRuleId: signal.triggerRuleId,
      title: signal.title,
      description: signal.summary,
      scope: signal.scope,
      scopeId: signal.scopeId,
      department: primaryDept,
      createdAt: now,
      syntheticEvent,
      decisionContext,
    };
  }

  /**
   * Human Override & Final Decision Recording:
   * Records human choice vs. system recommendation and preserves override reasons.
   */
  public recordDecisionReview(review: DecisionReview): void {
    const list = this.decisionReviews.get(review.decisionId) || [];
    list.push(review);
    this.decisionReviews.set(review.decisionId, list);
  }

  public getDecisionReviews(decisionId: string): DecisionReview[] {
    return this.decisionReviews.get(decisionId) || [];
  }

  public getSignalReviews(signalId: string): SignalReview[] {
    return this.signalReviews.get(signalId) || [];
  }

  private recordSignalReview(review: SignalReview): void {
    const list = this.signalReviews.get(review.signalId) || [];
    list.push(review);
    this.signalReviews.set(review.signalId, list);
  }

  public reset(): void {
    this.signals.clear();
    this.signalReviews.clear();
    this.decisionReviews.clear();
  }
}

export const signalService = new SignalService();
