/**
 * IMPACTMESH - Replay Service Implementation
 * Deterministically reconstructs BusinessState from an ordered sequence of DecisionEvents.
 * Guarantees that the same event sequence always produces the exact same state.
 */

import type { BusinessState } from '../../../src/types/domain.ts';
import type { DecisionEvent } from '../../../src/types/events.ts';
import type { IReplayService, ReplayResult, ReplayStep } from './replay.interface.ts';
import { stateTransitionEngine } from '../state-transition/state-transition.service.ts';

export class ReplayService implements IReplayService {
  /**
   * Sorts events strictly by ISO timestamp ascending, breaking ties deterministically with event ID.
   */
  public sortEvents(events: DecisionEvent[]): DecisionEvent[] {
    return [...events].sort((a, b) => {
      const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Fundamental Replay Operation:
   * Reconstructs BusinessState from initialState + ordered DecisionEvents.
   */
  public replayEvents(events: DecisionEvent[], initialState: BusinessState): BusinessState {
    const sorted = this.sortEvents(events);
    let currentState = initialState;

    for (const event of sorted) {
      const { nextState } = stateTransitionEngine.applyEvent(currentState, event);
      currentState = nextState;
    }

    return currentState;
  }

  /**
   * Replays events while capturing step-by-step state snapshots and explicit deltas.
   * Useful for auditing, timeline rendering, and debugging.
   */
  public replayEventsWithHistory(
    events: DecisionEvent[],
    initialState: BusinessState
  ): ReplayResult {
    const sorted = this.sortEvents(events);
    const steps: ReplayStep[] = [];
    let currentState = initialState;

    sorted.forEach((event, index) => {
      const { nextState, stateDelta } = stateTransitionEngine.applyEvent(currentState, event);
      currentState = nextState;
      steps.push({
        stepIndex: index + 1,
        event,
        stateDelta,
        stateSnapshot: currentState,
      });
    });

    return {
      finalState: currentState,
      steps,
      totalEventsApplied: sorted.length,
    };
  }
}

export const replayService = new ReplayService();
export const replayEvents = (events: DecisionEvent[], initialState: BusinessState): BusinessState =>
  replayService.replayEvents(events, initialState);
