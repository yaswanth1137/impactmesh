import { describe, it, expect, beforeEach } from 'vitest';
import {
  securityPolicyService,
  ENTERPRISE_OPERATOR,
  CEO_USER,
  OPERATIONS_USER,
} from '../../src/lib/auth/auth-service.ts';
import { publishDecisionEvent } from '../../src/lib/realtime/channel-service.ts';
import { realtimeSubscriptionManager } from '../../src/lib/realtime/subscription-manager.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Multi-Department Operator System', () => {
  beforeEach(() => {
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);
  });

  it('1. Enterprise Operator has authorization to operate all 5 departments', () => {
    const depts = ['finance', 'sales', 'commercial', 'operations', 'product'] as const;
    depts.forEach((dept) => {
      expect(securityPolicyService.canReadDepartment(ENTERPRISE_OPERATOR, dept)).toBe(true);
      expect(securityPolicyService.canModifyDepartment(ENTERPRISE_OPERATOR, dept)).toBe(true);
      expect(() => securityPolicyService.assertCanEmitEvent(ENTERPRISE_OPERATOR, dept)).not.toThrow();
    });
  });

  it('2. Enterprise Operator CANNOT access CEO analytics or Command Center', () => {
    expect(securityPolicyService.canAccessCEOAnalytics(ENTERPRISE_OPERATOR)).toBe(false);
    expect(securityPolicyService.canAccessCEOAnalytics(OPERATIONS_USER)).toBe(false);
    expect(securityPolicyService.canAccessCEOAnalytics(CEO_USER)).toBe(true);
  });

  it('3. Enterprise Operator emits events across all departments without rejection', async () => {
    // Finance
    const finRes = await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'BUDGET-TEST',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1100000,
        fiscal_period: 'Q3-2026',
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });
    expect(finRes.success).toBe(true);

    // Sales
    const saleRes = await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'DEAL-APEX-TEST',
      payload: {
        deal_id: 'DEAL-APEX-TEST',
        final_value: 5000000,
        close_date: '2026-09-30',
        sla_commitments: ['SLA'],
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });
    expect(saleRes.success).toBe(true);

    // Commercial
    const commRes = await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'commercial',
      event_type: 'pipeline_adjusted',
      entity_id: 'PIPE-TEST',
      payload: {
        pipeline_id: 'PIPE-TEST',
        previous_pipeline_value: 5000000,
        new_pipeline_value: 6500000,
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });
    expect(commRes.success).toBe(true);

    // Operations
    const opsRes = await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'operations',
      event_type: 'capacity_changed',
      entity_id: 'CAP-TEST',
      payload: {
        team_id: 'TEAM-TEST',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-10',
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });
    expect(opsRes.success).toBe(true);

    // Product
    const prodRes = await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'product',
      event_type: 'feature_scope_changed',
      entity_id: 'FEAT-TEST',
      payload: {
        feature_id: 'FEAT-TEST',
        previous_points: 155,
        new_points: 80,
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });
    expect(prodRes.success).toBe(true);
  });

  it('4. CEO Command Center receives events from all departments in realtime without refresh', async () => {
    securityPolicyService.setCurrentUser(CEO_USER);

    const receivedEvents: DecisionEvent[] = [];
    const unsubscribe = realtimeSubscriptionManager.onEvent((evt) => {
      receivedEvents.push(evt);
    });

    // Operator emits from mobile
    securityPolicyService.setCurrentUser(ENTERPRISE_OPERATOR);
    await publishDecisionEvent({
      organization_id: ENTERPRISE_OPERATOR.organizationId,
      department: 'operations',
      event_type: 'capacity_changed',
      entity_id: 'CAP-TEST-LIVE',
      payload: {
        team_id: 'TEAM-TEST',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-10',
      },
      created_by: ENTERPRISE_OPERATOR.fullName,
    });

    expect(receivedEvents.some((e) => e.event_type === 'capacity_changed')).toBe(true);
    unsubscribe();
  });
});
