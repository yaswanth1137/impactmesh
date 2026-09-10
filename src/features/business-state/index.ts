// Feature boundary: Business state sync, state transitions, and metrics observation
export { realtimeSubscriptionManager } from '../../lib/realtime/subscription-manager.ts';

// State Transition Engine & Replay
export {
  stateTransitionEngine,
  applyEvent,
  StateTransitionEngine,
} from '../../../server/services/state-transition/state-transition.service.ts';
export type {
  IStateTransitionEngine,
  StateTransitionResult,
  StateDelta,
  StateDeltaChange,
  AffectedEntityRef,
} from '../../../server/services/state-transition/state-transition.interface.ts';

export {
  eventValidator,
  EventValidator,
} from '../../../server/services/validation/event-validator.service.ts';
export type {
  IEventValidator,
  ValidationError,
  ValidationResult,
  ValidationErrorCode,
} from '../../../server/services/validation/event-validator.interface.ts';

export {
  eventStore,
  EventStore,
} from '../../../server/services/event-store/event-store.service.ts';
export type {
  IEventStore,
  EventStoreSaveResult,
} from '../../../server/services/event-store/event-store.interface.ts';

export {
  replayService,
  replayEvents,
  ReplayService,
} from '../../../server/services/replay/replay.service.ts';
export type {
  IReplayService,
  ReplayResult,
  ReplayStep,
} from '../../../server/services/replay/replay.interface.ts';
