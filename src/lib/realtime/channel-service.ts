/**
 * IMPACTMESH - Channel Service (Event Publisher)
 * Provides client methods to emit department events into the centralized event store.
 */

import { supabase } from '../supabase/client.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../types/events.ts';

import type { Json } from '../supabase/types.ts';

export interface PublishEventInput<T extends ImpactMeshEventType = ImpactMeshEventType> {
  organization_id: string;
  department: DecisionEvent<T>['department'];
  event_type: T;
  entity_id: string;
  payload: DecisionEvent<T>['payload'];
  created_by: string;
}

export interface PublishEventResult {
  success: boolean;
  event?: DecisionEvent;
  error?: string;
}

/**
 * Publishes an event from a department client device (Sales, Product, Eng, Finance)
 * to Supabase PostgreSQL, triggering the event pipeline and realtime listeners.
 */
export async function publishDecisionEvent<T extends ImpactMeshEventType>(
  input: PublishEventInput<T>
): Promise<PublishEventResult> {
  try {
    const { data, error } = await supabase
      .from('decision_events')
      .insert({
        organization_id: input.organization_id,
        department: input.department,
        event_type: input.event_type,
        entity_id: input.entity_id,
        payload: input.payload as unknown as Json,
        created_by: input.created_by,
      })
      .select('*')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      event: data as unknown as DecisionEvent,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown event publication error',
    };
  }
}
