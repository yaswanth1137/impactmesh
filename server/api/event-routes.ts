/**
 * IMPACTMESH - Server Event Route Handler
 * Implements the POST /api/events boundary.
 * Orchestrates: Event Ingestion -> Validation -> Idempotency Check -> State Transition -> Event Store.
 */

import type { BusinessState } from '../../src/types/domain.ts';
import type { DecisionEvent } from '../../src/types/events.ts';
import { eventValidator } from '../services/validation/event-validator.service.ts';
import type { ValidationError } from '../services/validation/event-validator.interface.ts';
import { stateTransitionEngine } from '../services/state-transition/state-transition.service.ts';
import type {
  StateDelta,
  AffectedEntityRef,
} from '../services/state-transition/state-transition.interface.ts';
import { eventStore } from '../services/event-store/event-store.service.ts';

export interface EventIngestionRequest {
  event: DecisionEvent;
  currentState?: BusinessState;
}

export interface EventIngestionSuccessBody {
  success: true;
  event: DecisionEvent;
  stateDelta: StateDelta;
  affectedEntities: AffectedEntityRef[];
  nextState: BusinessState;
  idempotent?: boolean;
}

export interface EventIngestionErrorBody {
  success: false;
  error: string;
  code?: string;
  validationErrors?: ValidationError[];
}

export interface EventIngestionResponse {
  statusCode: number;
  body: EventIngestionSuccessBody | EventIngestionErrorBody;
}

/**
 * Fallback baseline business state if caller does not supply currentState
 */
const DEFAULT_INITIAL_STATE: BusinessState = {
  id: 'state-genesis-default',
  organization_id: 'a0000000-0000-0000-0000-000000000001',
  timestamp: new Date().toISOString(),
  metrics: {
    available_budget: 1800000,
    committed_budget: 1100000,
    revenue_pipeline: 4500000,
    engineering_capacity: 420,
    engineering_demand: 0,
    capacity_utilization: 0,
    budget_pressure: 0.61,
    risk_score: 0.28,
    business_health: 84,
  },
  state_hash: 'genesis-hash-init',
  last_event_id: null,
  created_at: new Date().toISOString(),
};

/**
 * Handles incoming POST /api/events
 */
export async function handleEventIngestion(
  request: EventIngestionRequest
): Promise<EventIngestionResponse> {
  try {
    const { event, currentState } = request;

    if (!event) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'Missing event payload in request body.',
          code: 'INVALID_REQUEST',
        },
      };
    }

    const stateToValidate = currentState || DEFAULT_INITIAL_STATE;

    // 1. Validate Event
    const validationResult = eventValidator.validate(event, stateToValidate);
    if (!validationResult.isValid) {
      const isStale = validationResult.errors.some((err) => err.code === 'STALE_STATE');
      return {
        statusCode: isStale ? 409 : 400,
        body: {
          success: false,
          error: isStale
            ? 'Stale state conflict detected: event expectations mismatch current state.'
            : 'Event validation failed.',
          code: isStale ? 'STALE_STATE' : 'VALIDATION_ERROR',
          validationErrors: validationResult.errors,
        },
      };
    }

    // 2. Idempotency Check: if event already processed, return cached outcome without re-mutating
    if (eventStore.hasProcessed(event.id)) {
      const cached = eventStore.getCachedResult(event.id);
      if (cached) {
        return {
          statusCode: 200,
          body: {
            success: true,
            event,
            stateDelta: cached.stateDelta,
            affectedEntities: cached.affectedEntities,
            nextState: cached.nextState,
            idempotent: true,
          },
        };
      }
    }

    // 3. Apply Deterministic State Transition
    const transitionResult = stateTransitionEngine.applyEvent(stateToValidate, event);

    // 4. Persist to Event Store
    await eventStore.saveEvent(event, transitionResult);

    // 5. Return structured result
    return {
      statusCode: 200,
      body: {
        success: true,
        event,
        stateDelta: transitionResult.stateDelta,
        affectedEntities: transitionResult.affectedEntities,
        nextState: transitionResult.nextState,
        idempotent: false,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: {
        success: false,
        error: err instanceof Error ? err.message : 'Internal state transition engine error',
        code: 'INTERNAL_ERROR',
      },
    };
  }
}
