/**
 * IMPACTMESH - Impact Engine Unit Tests
 * Verifies Layer 1 deterministic / statistical calculations over graph dependencies.
 */

import { describe, it, expect } from 'vitest';
import { DeterministicImpactEngine } from '../../server/engines/impact-engine/impact-engine.service.ts';
import type { Dependency, BusinessState, BusinessEntity } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('DeterministicImpactEngine (Layer 1)', () => {
  const engine = new DeterministicImpactEngine();

  const mockDependencies: Dependency[] = [
    {
      id: 'dep-1',
      organization_id: 'org-test',
      source_entity_id: 'deal-apex',
      target_entity_id: 'feature-sso',
      relation_type: 'requires',
      strength: 1.0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'dep-2',
      organization_id: 'org-test',
      source_entity_id: 'feature-sso',
      target_entity_id: 'eng-capacity',
      relation_type: 'consumes',
      strength: 0.9,
      created_at: new Date().toISOString(),
    },
    {
      id: 'dep-3',
      organization_id: 'org-test',
      source_entity_id: 'eng-capacity',
      target_entity_id: 'budget-q1',
      relation_type: 'constrained_by',
      strength: 0.85,
      created_at: new Date().toISOString(),
    },
  ];

  it('traverses cascading dependencies up to maxDepth accurately', () => {
    const cascade = engine.traverseCascadingDependencies('deal-apex', mockDependencies, 3);

    expect(cascade).toHaveLength(3);
    expect(cascade[0].entityId).toBe('feature-sso');
    expect(cascade[0].depth).toBe(1);

    expect(cascade[1].entityId).toBe('eng-capacity');
    expect(cascade[1].depth).toBe(2);

    expect(cascade[2].entityId).toBe('budget-q1');
    expect(cascade[2].depth).toBe(3);
  });

  it('calculates deterministic metric deltas for finance budget_changed event', async () => {
    const mockEntities = new Map<string, BusinessEntity>([
      [
        'budget-q1',
        {
          id: 'budget-q1',
          organization_id: 'org-test',
          entity_type: 'budget',
          name: 'Q1 Budget',
          department: 'finance',
          status: 'active',
          metadata: {},
          created_at: '',
          updated_at: '',
        },
      ],
    ]);

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

    const budgetEvent: DecisionEvent = {
      id: 'evt-fin-01',
      organization_id: 'org-test',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'budget-q1',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1200000,
        fiscal_period: 'Q1',
      },
      created_by: 'finance-lead',
      created_at: new Date().toISOString(),
    };

    const result = await engine.calculateImpact({
      event: budgetEvent,
      currentState: mockState,
      graphContext: {
        entities: mockEntities,
        dependencies: mockDependencies,
        directEntityId: 'budget-q1',
      },
    });

    expect(result.decision_event_id).toBe('evt-fin-01');
    const budgetDelta = result.metric_deltas.find((d) => d.metric === 'available_budget');
    expect(budgetDelta).toBeDefined();
    expect(budgetDelta?.previous_value).toBe(1800000);
    expect(budgetDelta?.new_value).toBe(1200000);
    expect(budgetDelta?.delta).toBe(-600000);

    // Budget pressure increased because denominator decreased
    const pressureDelta = result.metric_deltas.find((d) => d.metric === 'budget_pressure');
    expect(pressureDelta).toBeDefined();
    expect(pressureDelta?.new_value).toBeGreaterThan(0.61);
  });
});
