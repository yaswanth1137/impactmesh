/**
 * IMPACTMESH - Event Store & Idempotency Interface
 * Defines contracts for canonical append-only event persistence,
 * idempotency tracking, and replay retrieval.
 */

import type { DecisionEvent } from '../../../src/types/events.ts';
import type { StateTransitionResult } from '../state-transition/state-transition.interface.ts';

export interface EventStoreSaveResult {
  saved: boolean;
  isDuplicate: boolean;
  cachedResult?: StateTransitionResult;
}

export interface IEventStore {
  hasProcessed(eventId: string): Promise<boolean> | boolean;
  saveEvent(
    event: DecisionEvent,
    transitionResult?: StateTransitionResult
  ): Promise<EventStoreSaveResult>;
  getEvent(eventId: string): Promise<DecisionEvent | null>;
  getEventsForOrg(organizationId: string): Promise<DecisionEvent[]>;
  getCachedResult(eventId: string): StateTransitionResult | null;
  cacheResult(eventId: string, result: StateTransitionResult): void;
  clear(): void;
}
