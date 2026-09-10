/**
 * IMPACTMESH - Idempotency Unit Tests
 * Verifies that duplicate event arrivals are safely recognized and ignored,
 * preventing double state mutation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore } from '../../server/services/event-store/event-store.service.ts';
import { handleEventIngestion } from '../../server/api/event-routes.ts';
import { StateTransitionEngine } from '../../server/services/state-transition/state-transition.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('Idempotency & Event Store', () => {
  let store: EventStore;
  const engine = new StateTransitionEngine();

  const getTestState = (): BusinessState => ({
    id: 'state-idemp-01',
    organization_id: 'org-test',
    timestamp: '2026-09-10T10:00:00Z',
    metrics: {
      available_budget: 1800000,
      committed_budget: 1100000,
      revenue_pipeline: 0,
      engineering_capacity: 420,
      engineering_demand: 0,
      capacity_utilization: 0,
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'hash-test',
    last_event_id: null,
    created_at: '2026-09-10T10:00:00Z',
  });

  beforeEach(() => {
    store = new EventStore();
    store.clear();
  });

  it('recognizes duplicate event IDs and returns cached transition without re-applying', async () => {
    const initialState = getTestState();

    const event: DecisionEvent<'deal_accepted'> = {
      id: 'evt-unique-deal-001',
      organization_id: 'org-test',
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'ent-deal-apex',
      payload: {
        deal_id: 'ent-deal-apex',
        final_value: 5000000,
        close_date: '2026-10-15',
        sla_commitments: ['Tier-1 SLA'],
      },
      created_by: 'Sales Lead',
      created_at: '2026-09-10T10:00:00Z',
    };

    // First arrival
    const transitionResult1 = engine.applyEvent(initialState, event);
    const saveResult1 = await store.saveEvent(event, transitionResult1);
    expect(saveResult1.saved).toBe(true);
    expect(saveResult1.isDuplicate).toBe(false);

    // Second arrival (Exact duplicate event ID)
    const saveResult2 = await store.saveEvent(event, transitionResult1);
    expect(saveResult2.saved).toBe(false);
    expect(saveResult2.isDuplicate).toBe(true);
    expect(saveResult2.cachedResult).toBeDefined();
    expect(saveResult2.cachedResult?.stateDelta.eventId).toBe('evt-unique-deal-001');
  });

  it('handleEventIngestion API route processes first submission and safely handles duplicate', async () => {
    const state = getTestState();

    const event: DecisionEvent<'budget_changed'> = {
      id: 'evt-api-budget-idemp',
      organization_id: 'org-test',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'ent-budget',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1100000,
        fiscal_period: 'Q1',
      },
      created_by: 'Finance Lead',
      created_at: '2026-09-10T10:00:00Z',
    };

    // First call
    const res1 = await handleEventIngestion({ event, currentState: state });
    expect(res1.statusCode).toBe(200);
    if ('nextState' in res1.body) {
      expect(res1.body.success).toBe(true);
      expect(res1.body.idempotent).toBe(false);
      expect(res1.body.nextState.metrics.available_budget).toBe(1100000);
    }

    // Second call with same event ID
    const res2 = await handleEventIngestion({ event, currentState: state });
    expect(res2.statusCode).toBe(200);
    if ('nextState' in res2.body) {
      expect(res2.body.success).toBe(true);
      expect(res2.body.idempotent).toBe(true);
      // Ensure state is not mutated twice
      expect(res2.body.nextState.metrics.available_budget).toBe(1100000);
    }
  });

  it('direct applyEvent is idempotent and returns no-op delta when event was already applied', () => {
    const initialState = getTestState();
    const event: DecisionEvent<'deal_accepted'> = {
      id: 'evt-direct-idemp-01',
      organization_id: 'org-test',
      department: 'sales',
      event_type: 'deal_accepted',
      entity_id: 'ent-deal-apex',
      payload: {
        deal_id: 'ent-deal-apex',
        final_value: 5000000,
        close_date: '2026-10-15',
        sla_commitments: ['Tier-1 SLA'],
      },
      created_by: 'Sales Lead',
      created_at: '2026-09-10T10:00:00Z',
    };

    const firstResult = engine.applyEvent(initialState, event);
    expect(firstResult.idempotent).toBeFalsy();
    expect(firstResult.nextState.metrics.committed_revenue).toBe(5000000);

    // Apply the exact same event again to the resulting state
    const secondResult = engine.applyEvent(firstResult.nextState, event);
    expect(secondResult.idempotent).toBe(true);
    expect(secondResult.nextState.metrics.committed_revenue).toBe(5000000); // Did not double to 10M!
    expect(secondResult.stateDelta.changes).toHaveLength(0);
  });
});
