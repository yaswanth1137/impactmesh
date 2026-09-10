/**
 * IMPACTMESH - Replay Foundation Unit Tests
 * Verifies deterministic state reconstruction from historical DecisionEvents.
 */

import { describe, it, expect } from 'vitest';
import { ReplayService, replayEvents } from '../../server/services/replay/replay.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('ReplayService', () => {
  const replayService = new ReplayService();

  const getGenesisState = (): BusinessState => ({
    id: 'state-genesis',
    organization_id: 'org-replay-test',
    timestamp: '2026-09-10T09:00:00Z',
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
    state_hash: 'genesis-hash',
    last_event_id: null,
    created_at: '2026-09-10T09:00:00Z',
  });

  const event1: DecisionEvent<'deal_accepted'> = {
    id: 'evt-01-deal',
    organization_id: 'org-replay-test',
    department: 'sales',
    event_type: 'deal_accepted',
    entity_id: 'ent-deal-1',
    payload: {
      deal_id: 'ent-deal-1',
      final_value: 5000000,
      close_date: '2026-10-01',
      sla_commitments: ['Standard SLA'],
    },
    created_by: 'Sales Lead',
    created_at: '2026-09-10T10:00:00Z',
  };

  const event2: DecisionEvent<'feature_committed'> = {
    id: 'evt-02-feature',
    organization_id: 'org-replay-test',
    department: 'product',
    event_type: 'feature_committed',
    entity_id: 'ent-feat-1',
    payload: {
      feature_id: 'ent-feat-1',
      sprint_target: 'Sprint-1',
      committed_capacity_hours: 420,
      feature_count: 3,
    },
    created_by: 'Product Lead',
    created_at: '2026-09-10T11:00:00Z',
  };

  const event3: DecisionEvent<'capacity_changed'> = {
    id: 'evt-03-capacity',
    organization_id: 'org-replay-test',
    department: 'engineering',
    event_type: 'capacity_changed',
    entity_id: 'ent-eng-1',
    payload: {
      team_id: 'team-1',
      previous_capacity_hours: 420,
      new_capacity_hours: 300,
      effective_date: '2026-09-15',
    },
    created_by: 'Eng Lead',
    created_at: '2026-09-10T12:00:00Z',
  };

  const event4: DecisionEvent<'budget_changed'> = {
    id: 'evt-04-budget',
    organization_id: 'org-replay-test',
    department: 'finance',
    event_type: 'budget_changed',
    entity_id: 'ent-budget-1',
    payload: {
      department: 'finance',
      previous_budget: 1800000,
      new_budget: 1100000,
      fiscal_period: 'Q1',
    },
    created_by: 'Finance Lead',
    created_at: '2026-09-10T13:00:00Z',
  };

  it('8. replay produces deterministic state regardless of arrival order', () => {
    const initialState = getGenesisState();

    // Replay in chronological order
    const stateA = replayEvents([event1, event2, event3, event4], initialState);

    // Replay with reversed arrival order
    const stateB = replayEvents([event4, event3, event2, event1], initialState);

    // Replay with shuffled order
    const stateC = replayEvents([event2, event4, event1, event3], initialState);

    // Assert absolute state determinism
    expect(stateA.state_hash).toBe(stateB.state_hash);
    expect(stateB.state_hash).toBe(stateC.state_hash);

    expect(stateA.metrics.available_budget).toBe(1100000);
    expect(stateA.metrics.engineering_capacity).toBe(300);
    expect(stateA.metrics.engineering_demand).toBe(420);
    expect(stateA.metrics.committed_revenue).toBe(5000000);
    expect(stateA.metrics.capacity_utilization).toBe(140);
  });

  it('9. sorts events deterministically using timestamp and stable event ID', () => {
    // Events with identical timestamps
    const tieEventA: DecisionEvent = {
      ...event1,
      id: 'evt-alpha',
      created_at: '2026-09-10T10:00:00Z',
    };
    const tieEventB: DecisionEvent = {
      ...event2,
      id: 'evt-beta',
      created_at: '2026-09-10T10:00:00Z',
    };

    const sorted = replayService.sortEvents([tieEventB, tieEventA]);
    expect(sorted[0].id).toBe('evt-alpha');
    expect(sorted[1].id).toBe('evt-beta');
  });

  it('captures step-by-step audit history during replay', () => {
    const initialState = getGenesisState();
    const result = replayService.replayEventsWithHistory(
      [event1, event2, event3, event4],
      initialState
    );

    expect(result.totalEventsApplied).toBe(4);
    expect(result.steps).toHaveLength(4);

    expect(result.steps[0].event.id).toBe('evt-01-deal');
    expect(result.steps[0].stateSnapshot.metrics.committed_revenue).toBe(5000000);

    expect(result.steps[1].event.id).toBe('evt-02-feature');
    expect(result.steps[1].stateSnapshot.metrics.engineering_demand).toBe(420);

    expect(result.steps[2].event.id).toBe('evt-03-capacity');
    expect(result.steps[2].stateSnapshot.metrics.engineering_capacity).toBe(300);

    expect(result.steps[3].event.id).toBe('evt-04-budget');
    expect(result.steps[3].stateSnapshot.metrics.available_budget).toBe(1100000);
  });
});
