/**
 * IMPACTMESH - Event Validator Unit Tests
 * Verifies schema checking, type validation, entity reference integrity, and stale state detection.
 */

import { describe, it, expect } from 'vitest';
import { EventValidator } from '../../server/services/validation/event-validator.service.ts';
import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';

describe('EventValidator', () => {
  const validator = new EventValidator();

  const mockState: BusinessState = {
    id: 'state-01',
    organization_id: 'org-test',
    timestamp: '2026-09-10T10:00:00Z',
    metrics: {
      available_budget: 1800000,
      committed_budget: 1100000,
      revenue_pipeline: 4500000,
      engineering_capacity: 420,
      engineering_demand: 320,
      capacity_utilization: 76.19,
      budget_pressure: 0.61,
      risk_score: 0.28,
      business_health: 84,
    },
    state_hash: 'hash-01',
    last_event_id: null,
    created_at: '2026-09-10T10:00:00Z',
  };

  it('validates a well-formed event successfully', () => {
    const validEvent: DecisionEvent<'budget_changed'> = {
      id: 'evt-budget-01',
      organization_id: 'org-test',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'ent-budget-q1',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: 1100000,
        fiscal_period: 'Q1-2026',
        rationale: 'Capital preservation mandate',
      },
      created_by: 'Priya Sharma (Finance)',
      created_at: '2026-09-10T10:00:00Z',
    };

    const result = validator.validate(validEvent, mockState);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an event with missing schema fields', () => {
    const malformedEvent = {
      id: '',
      department: 'invalid-dept',
      event_type: 'unknown_type',
    } as unknown as DecisionEvent;

    const result = validator.validate(malformedEvent, mockState);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'INVALID_SCHEMA')).toBe(true);
    expect(result.errors.some((e) => e.code === 'INVALID_DEPARTMENT')).toBe(true);
  });

  it('rejects invalid numeric values (negative values or NaN)', () => {
    const invalidEvent: DecisionEvent<'budget_changed'> = {
      id: 'evt-neg-budget',
      organization_id: 'org-test',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'ent-budget',
      payload: {
        department: 'finance',
        previous_budget: 1800000,
        new_budget: -50000, // Invalid negative budget
        fiscal_period: 'Q1',
      },
      created_by: 'Finance Operator',
      created_at: '2026-09-10T10:00:00Z',
    };

    const result = validator.validate(invalidEvent, mockState);
    expect(result.isValid).toBe(false);
    const numError = result.errors.find((e) => e.code === 'INVALID_NUMERIC_VALUE');
    expect(numError).toBeDefined();
    expect(numError?.field).toBe('new_budget');
  });

  it('rejects stale state events when previous value mismatches current state', () => {
    const staleEvent: DecisionEvent<'budget_changed'> = {
      id: 'evt-stale-01',
      organization_id: 'org-test',
      department: 'finance',
      event_type: 'budget_changed',
      entity_id: 'ent-budget',
      payload: {
        department: 'finance',
        previous_budget: 2500000, // Mismatch! Current available_budget is 1800000
        new_budget: 1500000,
        fiscal_period: 'Q1',
      },
      created_by: 'Finance Operator',
      created_at: '2026-09-10T10:00:00Z',
    };

    const result = validator.validate(staleEvent, mockState);
    expect(result.isValid).toBe(false);

    const staleError = result.errors.find((e) => e.code === 'STALE_STATE');
    expect(staleError).toBeDefined();
    expect(staleError?.expected).toBe(1800000);
    expect(staleError?.received).toBe(2500000);
    expect(staleError?.entity).toBe('availableBudget');
    expect(staleError?.eventId).toBe('evt-stale-01');
  });

  it('rejects stale capacity changes when previous_capacity_hours mismatches', () => {
    const staleCapEvent: DecisionEvent<'capacity_changed'> = {
      id: 'evt-stale-cap',
      organization_id: 'org-test',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'ent-eng',
      payload: {
        team_id: 'team-platform',
        previous_capacity_hours: 500, // Mismatch! Current is 420
        new_capacity_hours: 300,
        effective_date: '2026-09-15',
      },
      created_by: 'Eng Lead',
      created_at: '2026-09-10T10:00:00Z',
    };

    const result = validator.validate(staleCapEvent, mockState);
    expect(result.isValid).toBe(false);
    const staleError = result.errors.find((e) => e.code === 'STALE_STATE');
    expect(staleError).toBeDefined();
    expect(staleError?.expected).toBe(420);
    expect(staleError?.received).toBe(500);
  });

  it('rejects string numeric coercion: string "300" fails explicitly without silent coercion', () => {
    const coercedEvent = {
      id: 'evt-coerced-cap',
      organization_id: 'org-test',
      department: 'engineering',
      event_type: 'capacity_changed',
      entity_id: 'ent-eng',
      payload: {
        team_id: 'team-platform',
        previous_capacity_hours: 420,
        new_capacity_hours: '300', // String instead of number!
        effective_date: '2026-09-15',
      },
      created_by: 'Eng Lead',
      created_at: '2026-09-10T10:00:00Z',
    } as unknown as DecisionEvent<'capacity_changed'>;

    const result = validator.validate(coercedEvent, mockState);
    expect(result.isValid).toBe(false);
    const numError = result.errors.find(
      (e) => e.code === 'INVALID_NUMERIC_VALUE' && e.field === 'new_capacity_hours'
    );
    expect(numError).toBeDefined();
    expect(numError?.received).toBe('300');
  });

  it('rejects invalid feature_count: negative or non-integer is rejected', () => {
    const invalidCountEvent: DecisionEvent<'feature_committed'> = {
      id: 'evt-neg-count',
      organization_id: 'org-test',
      department: 'product',
      event_type: 'feature_committed',
      entity_id: 'ent-feat',
      payload: {
        feature_id: 'ent-feat-1',
        sprint_target: 'Sprint-1',
        committed_capacity_hours: 420,
        feature_count: -1, // Invalid negative
      },
      created_by: 'Product Lead',
      created_at: '2026-09-10T10:00:00Z',
    };

    const result = validator.validate(invalidCountEvent, mockState);
    expect(result.isValid).toBe(false);
    const numError = result.errors.find(
      (e) => e.code === 'INVALID_NUMERIC_VALUE' && e.field === 'feature_count'
    );
    expect(numError).toBeDefined();
  });
});
