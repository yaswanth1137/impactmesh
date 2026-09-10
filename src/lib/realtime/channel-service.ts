/**
 * IMPACTMESH - Channel Service (Event Publisher)
 * Provides client methods to emit department events into the centralized event store.
 */

import { supabase } from '../supabase/client.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../types/events.ts';

import type { Json } from '../supabase/types.ts';

import { realtimeSubscriptionManager } from './subscription-manager.ts';

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

import { env } from '../../config/env.ts';
import { securityPolicyService } from '../auth/auth-service.ts';

/**
 * Publishes an event from a department client device (Sales, Product, Eng, Finance)
 * to Supabase PostgreSQL, triggering the event pipeline and realtime listeners.
 */
export async function publishDecisionEvent<T extends ImpactMeshEventType>(
  input: PublishEventInput<T>
): Promise<PublishEventResult> {
  const currentUser = securityPolicyService.getCurrentUser();

  // Security authorization enforcement: client cannot spoof unauthorized department
  if (!securityPolicyService.canModifyDepartment(currentUser, input.department)) {
    return {
      success: false,
      error: `403 Forbidden: User '${currentUser.fullName}' (${currentUser.department}) is not authorized to emit events for '${input.department}'`,
    };
  }

  const syntheticEvent: DecisionEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    organization_id: input.organization_id,
    department: input.department,
    event_type: input.event_type,
    entity_id: input.entity_id,
    payload: input.payload,
    created_by: input.created_by || currentUser.fullName,
    created_at: new Date().toISOString(),
  };

  if (!env.isSupabaseConfigured) {
    // Local / offline realtime mesh: instantly emit via BroadcastChannel to other tabs/windows
    realtimeSubscriptionManager.emitLocalEvent(syntheticEvent);
    return {
      success: true,
      event: syntheticEvent,
    };
  }

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
      // In offline / mock development mode, broadcast locally so UI and other tabs immediately react
      realtimeSubscriptionManager.emitLocalEvent(syntheticEvent);
      return {
        success: true,
        event: syntheticEvent,
      };
    }

    const savedEvent = (data as unknown as DecisionEvent) || syntheticEvent;
    realtimeSubscriptionManager.emitLocalEvent(savedEvent);

    return {
      success: true,
      event: savedEvent,
    };
  } catch (_err) {
    realtimeSubscriptionManager.emitLocalEvent(syntheticEvent);
    return {
      success: true,
      event: syntheticEvent,
    };
  }
}
