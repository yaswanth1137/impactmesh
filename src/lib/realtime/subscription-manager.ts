/**
 * IMPACTMESH - Realtime Subscription Layer
 * Centralized, decoupled manager for Supabase Realtime subscriptions.
 * Keeps realtime listener logic isolated from React components.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/client.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../types/events.ts';
import type { BusinessState, ImpactResult, Recommendation } from '../../types/domain.ts';

export type RealtimeConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type EventCallback<T> = (payload: T) => void;
export type UnsubscribeFn = () => void;

class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionState: RealtimeConnectionState = 'DISCONNECTED';
  private stateListeners: Set<EventCallback<RealtimeConnectionState>> = new Set();

  private eventListeners: Set<EventCallback<DecisionEvent>> = new Set();
  private stateChangeListeners: Set<EventCallback<BusinessState>> = new Set();
  private impactListeners: Set<EventCallback<ImpactResult>> = new Set();
  private recommendationListeners: Set<EventCallback<Recommendation>> = new Set();

  public getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  public onConnectionStateChange(callback: EventCallback<RealtimeConnectionState>): UnsubscribeFn {
    this.stateListeners.add(callback);
    callback(this.connectionState);
    return () => this.stateListeners.delete(callback);
  }

  private setConnectionState(newState: RealtimeConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.stateListeners.forEach((listener) => listener(newState));
    }
  }

  /**
   * Initializes the core system channels:
   * 1. decision_events table INSERT listener
   * 2. business_state table INSERT/UPDATE listener
   * 3. impact_results table INSERT listener
   * 4. recommendations table INSERT listener
   */
  public initializeChannels(organizationId?: string): void {
    if (this.channels.size > 0) {
      return; // Already initialized
    }

    this.setConnectionState('CONNECTING');

    // 1. Channel for incoming operational events across all 4 departments
    const eventChannelName = organizationId ? `events:${organizationId}` : 'events:global';
    const eventChannel = supabase
      .channel(eventChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'decision_events',
          filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
        },
        (payload) => {
          const event = payload.new as DecisionEvent;
          this.eventListeners.forEach((listener) => listener(event));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.setConnectionState('CONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionState('ERROR');
        } else if (status === 'CLOSED') {
          this.setConnectionState('DISCONNECTED');
        }
      });

    this.channels.set('events', eventChannel);

    // 2. Channel for evolving business state (metrics, budget, capacity)
    const stateChannelName = organizationId ? `state:${organizationId}` : 'state:global';
    const stateChannel = supabase
      .channel(stateChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_state',
          filter: organizationId ? `organization_id=eq.${organizationId}` : undefined,
        },
        (payload) => {
          const newState = payload.new as BusinessState;
          if (newState && newState.metrics) {
            this.stateChangeListeners.forEach((listener) => listener(newState));
          }
        }
      )
      .subscribe();

    this.channels.set('state', stateChannel);

    // 3. Channel for calculated deterministic impact results
    const impactChannel = supabase
      .channel('impact:global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'impact_results',
        },
        (payload) => {
          const impact = payload.new as ImpactResult;
          this.impactListeners.forEach((listener) => listener(impact));
        }
      )
      .subscribe();

    this.channels.set('impact', impactChannel);

    // 4. Channel for recommendations and reasoning synthesis
    const recommendationChannel = supabase
      .channel('recommendations:global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recommendations',
        },
        (payload) => {
          const rec = payload.new as Recommendation;
          this.recommendationListeners.forEach((listener) => listener(rec));
        }
      )
      .subscribe();

    this.channels.set('recommendations', recommendationChannel);
  }

  /**
   * Subscribe to all operational events or filter by event type.
   */
  public onEvent<T extends ImpactMeshEventType>(
    callback: EventCallback<DecisionEvent<T>>,
    filterType?: T
  ): UnsubscribeFn {
    const wrappedCallback: EventCallback<DecisionEvent> = (event) => {
      if (!filterType || event.event_type === filterType) {
        callback(event as DecisionEvent<T>);
      }
    };
    this.eventListeners.add(wrappedCallback);
    return () => this.eventListeners.delete(wrappedCallback);
  }

  /**
   * Subscribe to real-time updates of the evolving Business State.
   */
  public onStateUpdate(callback: EventCallback<BusinessState>): UnsubscribeFn {
    this.stateChangeListeners.add(callback);
    return () => this.stateChangeListeners.delete(callback);
  }

  /**
   * Subscribe to deterministic Impact Result computations.
   */
  public onImpactResult(callback: EventCallback<ImpactResult>): UnsubscribeFn {
    this.impactListeners.add(callback);
    return () => this.impactListeners.delete(callback);
  }

  /**
   * Subscribe to generated Recommendations.
   */
  public onRecommendation(callback: EventCallback<Recommendation>): UnsubscribeFn {
    this.recommendationListeners.add(callback);
    return () => this.recommendationListeners.delete(callback);
  }

  /**
   * Cleanly unsubscribe from all channels (e.g. on teardown or user logoff).
   */
  public async teardown(): Promise<void> {
    for (const [, channel] of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.setConnectionState('DISCONNECTED');
  }
}

export const realtimeSubscriptionManager = new RealtimeSubscriptionManager();
