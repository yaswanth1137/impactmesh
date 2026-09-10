/**
 * IMPACTMESH - State Transition Engine Unit Tests
 * Verifies deterministic state mutations across Finance, Operations, Sales, and Product.
 */

import { describe, it, expect } from 'vitest';
import { StateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('StateTransitionEngine', () => {
  const engine = new StateTransitionEngine();

  const getInitialState = (): BusinessState => ({
    id: 'state-init',
    organization_id: 'org-blacktide',
    timestamp: '2026-09-10T10:00:00Z',
    metrics: {
      available_budget: 1800000,
      committed_budget: 1100000,
      revenue_pipeline: 0,
      committed_revenue: 0,
      engineering_capacity: 420,
      engineering_demand: 0,
      capacity_utilization: 0,
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'initial-hash',
    last_event_id: null,
    created_at: '2026-09-10T10:00:00Z',
  });

  it('1. budget_changed applies correctly with explicit state delta', () => {
    const initialState = getInitialState();
    const event: DecisionEvent<'budget_changed'> = {
      id: 'evt-budget-cut',
      organization_id: 'org-blacktide',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'ent-budget-q1',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1100000,
        fiscal_period: 'Q1-2026',
        rationale: 'Strategic capital reserve',
      },
      created_by: 'Priya Sharma (Finance)',
      created_at: '2026-09-10T10:01:00Z',
    };

    const { nextState, stateDelta, affectedEntities } = engine.applyEvent(initialState, event);

    // Business state verification
    expect(nextState.metrics.available_budget).toBe(1100000);
    expect(nextState.metrics.availableBudget).toBe(1100000);
    expect(nextState.last_event_id).toBe('evt-budget-cut');

    // State delta verification
    expect(stateDelta.eventId).toBe('evt-budget-cut');
    const budgetChange = stateDelta.changes.find(
      (c) => c.metric === 'availableBudget' || c.metric === 'available_budget'
    );
    expect(budgetChange).toBeDefined();
    expect(budgetChange?.before).toBe(1800000);
    expect(budgetChange?.after).toBe(1100000);
    expect(budgetChange?.delta).toBe(-700000);

    // Directly affected entities
    expect(affectedEntities.some((e) => e.entityId === 'ent-budget')).toBe(true);
  });

  it('2. capacity_changed applies correctly with utilization recalculation', () => {
    const initialState = getInitialState();
    initialState.metrics.engineering_demand = 320; // 320h load

    const event: DecisionEvent<'capacity_changed'> = {
      id: 'evt-cap-01',
      organization_id: 'org-blacktide',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'ent-res-eng',
      payload: {
        team_id: 'team-core-platform',
        previous_capacity_hours: 420,
        new_capacity_hours: 300,
        effective_date: '2026-09-15',
      },
      created_by: 'Devon Ross (Engineering)',
      created_at: '2026-09-10T10:02:00Z',
    };

    const { nextState, stateDelta, affectedEntities } = engine.applyEvent(initialState, event);

    expect(nextState.metrics.engineering_capacity).toBe(300);
    expect(nextState.metrics.engineeringCapacity).toBe(300);

    // Capacity delta verification: 300 - 420 = -120
    const capChange = stateDelta.changes.find(
      (c) => c.metric === 'engineeringCapacity' || c.metric === 'engineering_capacity'
    );
    expect(capChange).toBeDefined();
    expect(capChange?.before).toBe(420);
    expect(capChange?.after).toBe(300);
    expect(capChange?.delta).toBe(-120);

    // Utilization recalculated: (320 / 300) * 100 = 106.67%
    expect(nextState.metrics.capacity_utilization).toBeCloseTo(106.67, 1);
    expect(affectedEntities.length).toBeGreaterThan(0);
  });

  it('3. deal_accepted updates committed revenue and pipeline state', () => {
    const initialState = getInitialState();

    const event: DecisionEvent<'deal_accepted'> = {
      id: 'evt-deal-apex',
      organization_id: 'org-blacktide',
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'ent-deal-apex',
      payload: {
        deal_id: 'ent-deal-apex',
        final_value: 5000000,
        close_date: '2026-10-15',
        sla_commitments: ['99.9% uptime', '24/7 priority paging'],
      },
      created_by: 'Maya Lin (Sales)',
      created_at: '2026-09-10T10:03:00Z',
    };

    const { nextState, stateDelta, affectedEntities } = engine.applyEvent(initialState, event);

    expect(nextState.metrics.committed_revenue).toBe(5000000);
    expect(nextState.metrics.committedRevenue).toBe(5000000);
    expect(nextState.metrics.revenue_pipeline).toBe(5000000);

    const revChange = stateDelta.changes.find(
      (c) => c.metric === 'committedRevenue' || c.metric === 'committed_revenue'
    );
    expect(revChange).toBeDefined();
    expect(revChange?.before).toBe(0);
    expect(revChange?.after).toBe(5000000);
    expect(revChange?.delta).toBe(5000000);

    expect(affectedEntities[0].entityId).toBe('ent-deal-apex');
    expect(affectedEntities[0].department).toBe('sales');
  });

  it('4. feature_committed updates engineering demand and scope state', () => {
    const initialState = getInitialState();
    initialState.metrics.engineering_capacity = 420;

    const event: DecisionEvent<'feature_committed'> = {
      id: 'evt-feat-commit',
      organization_id: 'org-blacktide',
      department: 'product',
      event_type: 'feature_committed',
      entity_id: 'ent-feat-sso',
      payload: {
        feature_id: 'ent-feat-sso',
        sprint_target: 'Sprint-24',
        committed_capacity_hours: 420,
        feature_count: 3,
      },
      created_by: 'Marcus Vance (Product)',
      created_at: '2026-09-10T10:04:00Z',
    };

    const { nextState, stateDelta, affectedEntities } = engine.applyEvent(initialState, event);

    expect(nextState.metrics.engineering_demand).toBe(420);
    expect(nextState.metrics.capacity_utilization).toBe(100);
    expect(nextState.metrics.committed_features_count).toBe(3);

    const demandChange = stateDelta.changes.find(
      (c) => c.metric === 'engineeringDemand' || c.metric === 'engineering_demand'
    );
    expect(demandChange).toBeDefined();
    expect(demandChange?.before).toBe(0);
    expect(demandChange?.after).toBe(420);
    expect(demandChange?.delta).toBe(420);

    expect(affectedEntities.some((e) => e.entityId === 'ent-feat-sso')).toBe(true);
    expect(affectedEntities.some((e) => e.entityId === 'ent-eng-capacity')).toBe(true);
  });

  it('10. state delta accurately captures all before/after/delta metrics', () => {
    const initialState = getInitialState();
    initialState.metrics.available_budget = 2000000;
    initialState.metrics.committed_budget = 500000;

    const event: DecisionEvent<'cost_changed'> = {
      id: 'evt-cost-01',
      organization_id: 'org-blacktide',
      department: 'finance',
      event_type: 'cost_changed',
      entity_id: 'ent-cost-headcount',
      payload: {
        category: 'contractor',
        delta_amount: 300000,
        recurring: false,
      },
      created_by: 'Finance Operator',
      created_at: '2026-09-10T10:05:00Z',
    };

    const { nextState, stateDelta } = engine.applyEvent(initialState, event);

    expect(nextState.metrics.committed_budget).toBe(800000);
    expect(nextState.metrics.available_budget).toBe(1700000);

    const committedChange = stateDelta.changes.find((c) => c.metric === 'committed_budget');
    expect(committedChange).toBeDefined();
    expect(committedChange?.before).toBe(500000);
    expect(committedChange?.after).toBe(800000);
    expect(committedChange?.delta).toBe(300000);

    const availChange = stateDelta.changes.find((c) => c.metric === 'available_budget');
    expect(availChange).toBeDefined();
    expect(availChange?.before).toBe(2000000);
    expect(availChange?.after).toBe(1700000);
    expect(availChange?.delta).toBe(-300000);
  });
});
