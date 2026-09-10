/**
 * IMPACTMESH - Replay Service Interface
 * Defines contracts for deterministic state reconstruction from historical decision events.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { StateDelta } from '../state-transition/state-transition.interface.ts';

export interface ReplayStep {
  stepIndex: number;
  event: DecisionEvent;
  stateDelta: StateDelta;
  stateSnapshot: BusinessState;
}

export interface ReplayResult {
  finalState: BusinessState;
  steps: ReplayStep[];
  totalEventsApplied: number;
}

export interface IReplayService {
  replayEvents(events: DecisionEvent[], initialState: BusinessState): BusinessState;
  replayEventsWithHistory(events: DecisionEvent[], initialState: BusinessState): ReplayResult;
}
