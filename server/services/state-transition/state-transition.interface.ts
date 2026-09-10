/**
 * IMPACTMESH - State Transition Engine Interface
 * Defines contracts for deterministic state mutations, explicit state deltas,
 * and directly affected entity tracking.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';

export interface StateDeltaChange {
  metric: string;
  before: number;
  after: number;
  delta: number;
}

export interface StateDelta {
  eventId: string;
  timestamp: string;
  changes: StateDeltaChange[];
}

export interface AffectedEntityRef {
  entityId: string;
  entityType: string;
  department: string;
  role?: string;
  details?: string;
}

export interface StateTransitionResult {
  nextState: BusinessState;
  stateDelta: StateDelta;
  affectedEntities: AffectedEntityRef[];
  idempotent?: boolean;
}

export interface IStateTransitionEngine {
  applyEvent(currentState: BusinessState, event: DecisionEvent): StateTransitionResult;
}
