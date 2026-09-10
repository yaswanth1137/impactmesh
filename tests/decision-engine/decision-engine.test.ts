/**
 * IMPACTMESH - Decision Engine Unit Tests
 * Verifies Layer 2 candidate option generation and executive policy scoring.
 */

import { describe, it, expect } from 'vitest';
import { RuleBasedDecisionEngine } from '../../server/engines/decision-engine/decision-engine.service.ts';
import { EXECUTIVE_POLICIES } from '../../server/policies/executive-policies.ts';
import type { BusinessState, ImpactResult } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('RuleBasedDecisionEngine (Layer 2)', () => {
  const engine = new RuleBasedDecisionEngine();

  const mockState: BusinessState = {
    id: 'state-1',
    organization_id: 'org-test',
    timestamp: new Date().toISOString(),
    metrics: {
      available_budget: 1800000,
      committed_budget: 1100000,
      revenue_pipeline: 4500000,
      engineering_capacity: 400,
      engineering_demand: 320,
      capacity_utilization: 80,
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'hash-1',
    last_event_id: null,
    created_at: new Date().toISOString(),
  };

  const mockImpact: ImpactResult = {
    id: 'impact-1',
    organization_id: 'org-test',
    decision_event_id: 'evt-deal-01',
    affected_entities: [],
    metric_deltas: [],
    cascade_depth: 2,
    deterministic_score: 82,
    risk_assessment: {
      overall_risk: 'medium',
      risk_score: 0.45,
      primary_risks: ['Moderate capacity strain'],
      bottlenecks: [],
    },
    confidence_score: 0.95,
    calculated_at: new Date().toISOString(),
  };

  const mockEvent: DecisionEvent = {
    id: 'evt-deal-01',
    organization_id: 'org-test',
    department: 'sales',
    event_type: 'deal_created',
    entity_id: 'deal-apex',
    payload: {
      deal_id: 'deal-apex',
      deal_name: 'Apex Deal',
      customer_id: 'cust-apex',
      contract_value: 1200000,
      expected_close_date: '2026-10-01',
    },
    created_by: 'sales-lead',
    created_at: new Date().toISOString(),
  };

  it('generates multiple discrete decision options', async () => {
    const options = await engine.generateOptions({
      event: mockEvent,
      currentState: mockState,
      impactResult: mockImpact,
      policies: EXECUTIVE_POLICIES,
    });

    expect(options.length).toBeGreaterThanOrEqual(3);
    const actions = options.map((o) => o.action_type);
    expect(actions).toContain('accept');
    expect(actions).toContain('negotiate');
    expect(actions).toContain('scale_capacity');
  });

  it('scores options according to differentiated executive perspectives', async () => {
    const options = await engine.generateOptions({
      event: mockEvent,
      currentState: mockState,
      impactResult: mockImpact,
      policies: EXECUTIVE_POLICIES,
    });

    const acceptOption = options.find((o) => o.action_type === 'accept');
    const negotiateOption = options.find((o) => o.action_type === 'negotiate');

    expect(acceptOption).toBeDefined();
    expect(negotiateOption).toBeDefined();

    // CEO should rate the high-growth 'accept' option higher than CFO
    expect(acceptOption!.policy_alignment.ceo).toBeGreaterThan(acceptOption!.policy_alignment.cfo);

    // CFO should rate the cost-controlled 'negotiate' option higher than 'accept'
    expect(negotiateOption!.policy_alignment.cfo).toBeGreaterThan(acceptOption!.policy_alignment.cfo);
  });
});
