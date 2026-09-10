/**
 * IMPACTMESH - Canonical Blacktide Execution Plan
 * Implements the Step 4 execution plan: "Preserve Customer Commitment by Reducing Non-Critical Scope".
 * Connects 4 operational departments in sequence: Product -> Operations -> Sales -> Finance.
 */

import type { ExecutionPlan, ExecutionStep } from '../../../src/types/execution.ts';

export const CANONICAL_EXECUTION_PLAN_ID = 'plan-blacktide-scope-reduction-01';

export function createCanonicalBlacktideExecutionPlan(
  decisionId = 'dec-fin-01',
  recommendationId = 'rec-fin-01'
): ExecutionPlan {
  const step1: ExecutionStep = {
    id: 'step-01-product-freeze',
    planId: CANONICAL_EXECUTION_PLAN_ID,
    sequence: 1,
    department: 'product',
    departmentTitle: 'THE CHART ROOM (PRODUCT)',
    actionType: 'freeze_non_critical_scope',
    title: 'Freeze Non-Critical Custom Scope',
    description:
      'Deprioritize Custom Executive Analytics & Audit Export; re-lock sprint goal strictly to Enterprise SAML SSO.',
    inputs: {
      targetFeatures: ['ent-feat-reports', 'ent-feat-audit'],
      targetDemandHours: 120,
    },
    dependsOn: [], // Requires only initial human approval
    expectedStateChanges: {
      metric: 'engineering_demand',
      direction: 'decrease',
      estimatedDelta: -120,
    },
    status: 'ready',
    resultingEvent: {
      department: 'product',
      event_type: 'feature_deprioritized',
      entity_id: 'ent-feat-reports',
      payload: {
        feature_id: 'ent-feat-reports',
        reason: 'Strategic scope freeze to protect Apex SSO critical path',
        freed_capacity_hours: 120,
      },
    },
  };

  const step2: ExecutionStep = {
    id: 'step-02-operations-reallocate',
    planId: CANONICAL_EXECUTION_PLAN_ID,
    sequence: 2,
    department: 'engineering',
    departmentTitle: 'THE ENGINE ROOM (OPERATIONS)',
    actionType: 'reallocate_capacity',
    title: 'Reallocate 120h Engineering Capacity',
    description:
      'Balance Core Platform Engineering workload to 300h target; normalize utilization from 140% to 100%.',
    inputs: {
      teamId: 'ent-res-eng',
      targetCapacityHours: 300,
    },
    dependsOn: ['step-01-product-freeze'], // Depends on Step 1
    expectedStateChanges: {
      metric: 'capacity_utilization',
      direction: 'decrease',
      targetUtilization: 100,
    },
    status: 'blocked',
    resultingEvent: {
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'ent-res-eng',
      payload: {
        team_id: 'ent-res-eng',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-15',
      },
    },
  };

  const step3: ExecutionStep = {
    id: 'step-03-sales-alignment',
    planId: CANONICAL_EXECUTION_PLAN_ID,
    sequence: 3,
    department: 'sales',
    departmentTitle: 'THE LOOKOUT (SALES)',
    actionType: 'deliver_client_phasing',
    title: 'Deliver Client Phasing Protocol',
    description:
      'Notify Apex Global Financials of phased deployment: Phase 1 (SAML SSO) on schedule; Phase 2 (Reports) in 60 days.',
    inputs: {
      dealId: 'ent-deal-apex',
      customerContact: 'Apex Global VP Tech',
      phasedDeliveryDays: 60,
    },
    dependsOn: ['step-01-product-freeze'], // Depends on Step 1
    expectedStateChanges: {
      metric: 'delivery_pressure',
      direction: 'normalize',
      slippageDays: 0,
    },
    status: 'blocked',
    resultingEvent: {
      department: 'sales',
      event_type: 'deadline_changed',
      entity_id: 'ent-deal-apex',
      payload: {
        deal_id: 'ent-deal-apex',
        previous_deadline: '30 DAYS',
        new_deadline: '60 DAYS',
        penalty_clause_active: false,
      },
    },
  };

  const step4: ExecutionStep = {
    id: 'step-04-finance-audit',
    planId: CANONICAL_EXECUTION_PLAN_ID,
    sequence: 4,
    department: 'finance',
    departmentTitle: 'THE TREASURY (FINANCE)',
    actionType: 'record_operational_savings',
    title: 'Audit & Record Operational Savings',
    description:
      'Reconcile Q1 budget variance: lock ₹2.4L in verified contractor savings and update burn runway.',
    inputs: {
      savingsAmount: 240000,
      fiscalQuarter: 'Q1-2026',
    },
    dependsOn: ['step-01-product-freeze', 'step-02-operations-reallocate', 'step-03-sales-alignment'], // Depends on Steps 1, 2, 3
    expectedStateChanges: {
      metric: 'committed_budget',
      direction: 'decrease',
      delta: -240000,
    },
    status: 'blocked',
    resultingEvent: {
      department: 'finance',
      event_type: 'cost_changed',
      entity_id: 'ent-budget-q1',
      payload: {
        category: 'contractor',
        delta_amount: -240000,
        recurring: false,
      },
    },
  };

  return {
    id: CANONICAL_EXECUTION_PLAN_ID,
    decisionId,
    title: 'Preserve Customer Commitment by Reducing Non-Critical Scope',
    objective:
      'Eliminate the 120h engineering deficit and absorb the ₹7.0L capital reduction without breaching enterprise SAML SLA.',
    sourceRecommendationId: recommendationId,
    createdAt: new Date().toISOString(),
    approvedAt: null, // Requires human approval
    approvedBy: null,
    status: 'pending',
    steps: [step1, step2, step3, step4],
    expectedOutcome:
      'Execution normalizes engineering capacity utilization to 100%, maintains Tier-1 client relationship, and locks ₹2.4L in contractor savings.',
  };
}
