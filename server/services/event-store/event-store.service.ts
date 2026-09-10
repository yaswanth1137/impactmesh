/**
 * IMPACTMESH - Event Store & Idempotency Service
 * Canonical immutable event log management.
 * Tracks processed event IDs to enforce strict idempotency and prevent duplicate state mutations.
 */

import type { DecisionEvent } from '../../../src/types/events.ts';
import type { StateTransitionResult } from '../state-transition/state-transition.interface.ts';
import type { IEventStore, EventStoreSaveResult } from './event-store.interface.ts';
import { supabase } from '../../../src/lib/supabase/client.ts';
import type { Json } from '../../../src/lib/supabase/types.ts';
import { env } from '../../../src/config/env.ts';

export class EventStore implements IEventStore {
  // In-memory canonical event store (for low-latency lookups, tests, and offline resilience)
  private readonly eventsById = new Map<string, DecisionEvent>();
  private readonly eventsByOrg = new Map<string, DecisionEvent[]>();
  private readonly cachedResults = new Map<string, StateTransitionResult>();

  public hasProcessed(eventId: string): boolean {
    return this.eventsById.has(eventId);
  }

  public getCachedResult(eventId: string): StateTransitionResult | null {
    return this.cachedResults.get(eventId) || null;
  }

  public cacheResult(eventId: string, result: StateTransitionResult): void {
    this.cachedResults.set(eventId, result);
  }

  public async saveEvent(
    event: DecisionEvent,
    transitionResult?: StateTransitionResult
  ): Promise<EventStoreSaveResult> {
    // 1. Idempotency Check: Reject duplicate events immediately
    if (this.eventsById.has(event.id)) {
      return {
        saved: false,
        isDuplicate: true,
        cachedResult: this.cachedResults.get(event.id),
      };
    }

    // 2. Append to immutable in-memory log
    this.eventsById.set(event.id, event);

    const orgEvents = this.eventsByOrg.get(event.organization_id) || [];
    orgEvents.push(event);
    this.eventsByOrg.set(event.organization_id, orgEvents);

    if (transitionResult) {
      this.cachedResults.set(event.id, transitionResult);
    }

    // 3. Persist to Supabase decision_events if configured
    if (env.isSupabaseConfigured) {
      try {
        await supabase.from('decision_events').insert({
          id: event.id,
          organization_id: event.organization_id,
          department: event.department,
          event_type: event.event_type,
          entity_id: event.entity_id,
          payload: event.payload as unknown as Json,
          created_by: event.created_by,
          created_at: event.created_at,
        });
      } catch {
        // Silently preserve in-memory state if remote Supabase connection is offline
      }
    }

    return {
      saved: true,
      isDuplicate: false,
      cachedResult: transitionResult,
    };
  }

  public async getEvent(eventId: string): Promise<DecisionEvent | null> {
    const memEvent = this.eventsById.get(eventId);
    if (memEvent) return memEvent;

    if (env.isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('decision_events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (data && !error) {
          const loadedEvent = data as unknown as DecisionEvent;
          this.eventsById.set(loadedEvent.id, loadedEvent);
          return loadedEvent;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  public async getEventsForOrg(organizationId: string): Promise<DecisionEvent[]> {
    const orgEvents = this.eventsByOrg.get(organizationId) || [];
    // Sort deterministically: created_at ASC, id ASC
    return [...orgEvents].sort((a, b) => {
      const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
  }

  public clear(): void {
    this.eventsById.clear();
    this.eventsByOrg.clear();
    this.cachedResults.clear();
  }

  public clearOrg(organizationId: string): void {
    const orgEvents = this.eventsByOrg.get(organizationId) || [];
    for (const evt of orgEvents) {
      this.eventsById.delete(evt.id);
      this.cachedResults.delete(evt.id);
    }
    this.eventsByOrg.delete(organizationId);
  }
}

export const eventStore = new EventStore();
