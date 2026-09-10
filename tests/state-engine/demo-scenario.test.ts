/**
 * IMPACTMESH - Blacktide Systems Demo Scenario Test
 * Deterministic end-to-end verification of Phase 2 Event -> Business State Engine.
 *
 * Sequence:
 * INITIAL:
 *   Revenue opportunity: ₹0
 *   Budget: ₹18L (₹1,800,000)
 *   Engineering capacity: 420h
 *   Required engineering: 0h
 *
 * EVENT 1: deal_accepted (₹50L = ₹5,000,000)
 * EVENT 2: feature_committed (3 features, 420h requirement)
 * EVENT 3: capacity_changed (300h)
 * EVENT 4: budget_changed (₹18L -> ₹11L = ₹1,100,000)
 */

import { describe, it, expect } from 'vitest';
import { StateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import { ReplayService } from '../../server/services/replay/replay.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Blacktide Core Demo Scenario', () => {
  const engine = new StateTransitionEngine();
  const replay = new ReplayService();

  const INITIAL_STATE: BusinessState = {
    id: 'state-demo-initial',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    timestamp: '2026-09-10T09:00:00Z',
    metrics: {
      available_budget: 1800000,      // ₹18L
      committed_budget: 1100000,      // ₹11L
      revenue_pipeline: 0,            // ₹0
      committed_revenue: 0,           // ₹0
      engineering_capacity: 420,      // 420h
      engineering_demand: 0,          // 0h
      capacity_utilization: 0,        // 0%
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'initial-state-hash',
    last_event_id: null,
    created_at: '2026-09-10T09:00:00Z',
  };

  // EVENT 1: deal_accepted (₹50L)
  const event1: DecisionEvent<'deal_accepted'> = {
    id: 'demo-evt-01-deal-accepted',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    department: 'sales',
    event_type: 'deal_accepted',
    entity_id: 'ent-deal-apex',
    payload: {
      deal_id: 'ent-deal-apex',
      final_value: 5000000, // ₹50L
      close_date: '2026-10-15',
      sla_commitments: ['Enterprise SAML Mandate', '99.9% Uptime'],
    },
    created_by: 'Maya Lin (Sales)',
    created_at: '2026-09-10T10:00:00Z',
  };

  // EVENT 2: feature_committed (3 features, 420h requirement)
  const event2: DecisionEvent<'feature_committed'> = {
    id: 'demo-evt-02-feature-committed',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    department: 'product',
    event_type: 'feature_committed',
    entity_id: 'ent-feat-sso',
    payload: {
      feature_id: 'ent-feat-sso',
      sprint_target: 'Sprint-24',
      committed_capacity_hours: 420, // 420h demand requirement
      feature_count: 3,              // 3 features
    },
    created_by: 'Marcus Vance (Product)',
    created_at: '2026-09-10T11:00:00Z',
  };

  // EVENT 3: capacity_changed (300h)
  const event3: DecisionEvent<'capacity_changed'> = {
    id: 'demo-evt-03-capacity-changed',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    department: 'engineering',
    event_type: 'capacity_changed',
    entity_id: 'ent-res-eng',
    payload: {
      team_id: 'ent-res-eng',
      previous_capacity_hours: 420,
      new_capacity_hours: 300,       // 300h
      effective_date: '2026-09-15',
    },
    created_by: 'Devon Ross (Engineering)',
    created_at: '2026-09-10T12:00:00Z',
  };

  // EVENT 4: budget_changed (₹18L -> ₹11L)
  const event4: DecisionEvent<'budget_changed'> = {
    id: 'demo-evt-04-budget-changed',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    department: 'finance',
    event_type: 'budget_changed',
    entity_id: 'ent-budget-q1',
    payload: {
      department: 'finance',
      previous_budget: 1800000,      // ₹18L
      new_budget: 1100000,           // ₹11L
      fiscal_period: 'Q1-2026',
      rationale: 'Capital preservation reserve',
    },
    created_by: 'Priya Sharma (Finance)',
    created_at: '2026-09-10T13:00:00Z',
  };

  it('progressively mutates business state through all 4 demo events and matches replay', () => {
    // -------------------------------------------------------------------------
    // STEP 0: INITIAL ASSERTIONS
    // -------------------------------------------------------------------------
    expect(INITIAL_STATE.metrics.revenue_pipeline).toBe(0);
    expect(INITIAL_STATE.metrics.committed_revenue).toBe(0);
    expect(INITIAL_STATE.metrics.available_budget).toBe(1800000);
    expect(INITIAL_STATE.metrics.engineering_capacity).toBe(420);
    expect(INITIAL_STATE.metrics.engineering_demand).toBe(0);

    // -------------------------------------------------------------------------
    // STEP 1: EVENT 1 (deal_accepted -> ₹50L)
    // -------------------------------------------------------------------------
    const step1 = engine.applyEvent(INITIAL_STATE, event1);
    expect(step1.nextState.metrics.committed_revenue).toBe(5000000);
    expect(step1.nextState.metrics.revenue_pipeline).toBe(5000000);
    expect(step1.stateDelta.changes.some((c) => c.metric === 'committedRevenue' && c.delta === 5000000)).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 2: EVENT 2 (feature_committed -> 3 features, 420h requirement)
    // -------------------------------------------------------------------------
    const step2 = engine.applyEvent(step1.nextState, event2);
    expect(step2.nextState.metrics.engineering_demand).toBe(420);
    expect(step2.nextState.metrics.capacity_utilization).toBe(100); // 420 / 420 = 100%
    expect(step2.nextState.metrics.committed_features_count).toBe(3);
    expect(step2.stateDelta.changes.some((c) => c.metric === 'engineeringDemand' && c.delta === 420)).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 3: EVENT 3 (capacity_changed -> 300h)
    // -------------------------------------------------------------------------
    const step3 = engine.applyEvent(step2.nextState, event3);
    expect(step3.nextState.metrics.engineering_capacity).toBe(300);
    // Capacity utilization: 420h demand / 300h capacity = 140% DEFICIT!
    expect(step3.nextState.metrics.capacity_utilization).toBe(140);
    expect(step3.stateDelta.changes.some((c) => c.metric === 'engineeringCapacity' && c.delta === -120)).toBe(true);

    // -------------------------------------------------------------------------
    // STEP 4: EVENT 4 (budget_changed -> ₹18L to ₹11L)
    // -------------------------------------------------------------------------
    const step4 = engine.applyEvent(step3.nextState, event4);
    expect(step4.nextState.metrics.available_budget).toBe(1100000);
    expect(step4.nextState.metrics.availableBudget).toBe(1100000);
    // Delta: ₹11L - ₹18L = -₹7L (-700,000)
    expect(step4.stateDelta.changes.some((c) => c.metric === 'availableBudget' && c.delta === -700000)).toBe(true);

    // -------------------------------------------------------------------------
    // REPLAY RECONSTRUCTION ASSERTION
    // -------------------------------------------------------------------------
    const replayedState = replay.replayEvents([event1, event2, event3, event4], INITIAL_STATE);
    expect(replayedState.metrics.available_budget).toBe(1100000);
    expect(replayedState.metrics.engineering_capacity).toBe(300);
    expect(replayedState.metrics.engineering_demand).toBe(420);
    expect(replayedState.metrics.capacity_utilization).toBe(140);
    expect(replayedState.metrics.committed_revenue).toBe(5000000);
    expect(replayedState.state_hash).toBe(step4.nextState.state_hash);

    // -------------------------------------------------------------------------
    // READABLE STATE SNAPSHOT LOGGING FOR DEBUGGING
    // -------------------------------------------------------------------------
    const snapshot = {
      scenario: 'Blacktide Systems Phase 2 Demo Scenario',
      finalStateId: replayedState.id,
      stateHash: replayedState.state_hash,
      lastEventId: replayedState.last_event_id,
      metrics: {
        'Available Budget': `₹${(replayedState.metrics.available_budget / 100000).toFixed(1)}L (₹${replayedState.metrics.available_budget.toLocaleString()})`,
        'Committed Revenue': `₹${(replayedState.metrics.committed_revenue! / 100000).toFixed(1)}L (₹${replayedState.metrics.committed_revenue!.toLocaleString()})`,
        'Revenue Pipeline': `₹${(replayedState.metrics.revenue_pipeline / 100000).toFixed(1)}L (₹${replayedState.metrics.revenue_pipeline.toLocaleString()})`,
        'Engineering Capacity': `${replayedState.metrics.engineering_capacity}h`,
        'Engineering Demand': `${replayedState.metrics.engineering_demand}h`,
        'Capacity Utilization': `${replayedState.metrics.capacity_utilization}% (DEFICIT)`,
        'Budget Pressure': `${(replayedState.metrics.budget_pressure * 100).toFixed(1)}%`,
        'Committed Features': `${replayedState.metrics.committed_features_count}`,
      },
    };

    // Log the readable snapshot to console
    console.log('\n============================================================');
    console.log('DEMO TEST SCENARIO RESULT — RECONSTRUCTED BUSINESS STATE');
    console.log('============================================================');
    console.log(JSON.stringify(snapshot, null, 2));
    console.log('============================================================\n');

    expect(snapshot.metrics['Available Budget']).toContain('11.0L');
    expect(snapshot.metrics['Committed Revenue']).toContain('50.0L');
    expect(snapshot.metrics['Engineering Capacity']).toBe('300h');
    expect(snapshot.metrics['Engineering Demand']).toBe('420h');
    expect(snapshot.metrics['Capacity Utilization']).toBe('140% (DEFICIT)');
  });
});
