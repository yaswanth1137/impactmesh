/**
 * IMPACTMESH - Realtime Subscription Layer
 * Centralized, decoupled manager for Supabase Realtime subscriptions.
 * Keeps realtime listener logic isolated from React components.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/client.ts';
import { env } from '../../config/env.ts';
import type { DecisionEvent, ImpactMeshEventType } from '../../types/events.ts';
import type { BusinessState, ImpactResult, Recommendation } from '../../types/domain.ts';

export type RealtimeConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export type EventCallback<T> = (payload: T) => void;
export type UnsubscribeFn = () => void;

export class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionState: RealtimeConnectionState = 'DISCONNECTED';
  private stateListeners: Set<EventCallback<RealtimeConnectionState>> = new Set();

  private eventListeners: Set<EventCallback<DecisionEvent>> = new Set();
  private stateChangeListeners: Set<EventCallback<BusinessState>> = new Set();
  private impactListeners: Set<EventCallback<ImpactResult>> = new Set();
  private recommendationListeners: Set<EventCallback<Recommendation>> = new Set();

  private processedEventIds: Set<string> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  // Auto-reconnect telemetry
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private readonly baseReconnectDelayMs: number = 1000;
  private readonly maxReconnectDelayMs: number = 10000;
  private isTornDown: boolean = false;
  private currentOrgId?: string;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('impactmesh_events_bus');
        this.broadcastChannel.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'DECISION_EVENT') {
            this.handleIncomingEvent(msg.data.event);
          }
        };
      } catch (err) {
        console.warn('[RealtimeManager] BroadcastChannel unavailable:', err);
      }
    }

    // Attach online/offline network listeners and storage bus in browser environments
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.isTornDown) {
          this.reconnectAttempts = 0;
          this.reconnect();
        }
      });
      window.addEventListener('offline', () => {
        this.setConnectionState('DISCONNECTED');
      });

      // Storage event listener ensures instantaneous sync across tabs/windows
      window.addEventListener('storage', (e) => {
        if (e.key === 'impactmesh_event_bus' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data && data.event) {
              this.handleIncomingEvent(data.event);
            }
          } catch (_err) {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  public isEventProcessed(eventId: string): boolean {
    return this.processedEventIds.has(eventId);
  }

  public getProcessedEventCount(): number {
    return this.processedEventIds.size;
  }

  public clearProcessedEvents(): void {
    this.processedEventIds.clear();
  }

  public handleIncomingEvent(event: DecisionEvent): void {
    if (!event || !event.id) return;
    if (this.processedEventIds.has(event.id)) {
      return; // Deduplicate: Drop repeat occurrences of the same event ID
    }
    this.processedEventIds.add(event.id);
    if (this.processedEventIds.size > 2000) {
      const first = this.processedEventIds.values().next().value;
      if (first) this.processedEventIds.delete(first);
    }

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[RealtimeManager] Error in event listener:', err);
      }
    });
  }

  public emitLocalEvent(event: DecisionEvent): void {
    this.handleIncomingEvent(event);
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'DECISION_EVENT', event });
      } catch (err) {
        console.warn('[RealtimeManager] BroadcastChannel postMessage failed:', err);
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'impactmesh_event_bus',
          JSON.stringify({ event, t: Date.now() })
        );
      } catch (_err) {
        // Storage quota / security policy safe
      }
    }
  }

  public onConnectionStateChange(callback: EventCallback<RealtimeConnectionState>): UnsubscribeFn {
    this.stateListeners.add(callback);
    callback(this.connectionState);
    return () => this.stateListeners.delete(callback);
  }

  private setConnectionState(newState: RealtimeConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.stateListeners.forEach((listener) => {
        try {
          listener(newState);
        } catch (err) {
          console.error('[RealtimeManager] Error in state listener:', err);
        }
      });
    }
  }

  /**
   * Schedules automatic reconnection with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.isTornDown) return;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.baseReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectDelayMs
    );
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      if (!this.isTornDown) {
        this.reconnect();
      }
    }, delay);
  }

  /**
   * Initializes the core system channels:
   * 1. decision_events table INSERT listener
   * 2. business_state table INSERT/UPDATE listener
   * 3. impact_results table INSERT listener
   * 4. recommendations table INSERT listener
   */
  public initializeChannels(organizationId?: string): void {
    this.currentOrgId = organizationId;
    this.isTornDown = false;

    if (this.channels.size > 0) {
      return; // Already initialized
    }

    if (!env.isSupabaseConfigured) {
      // Local development realtime mesh: BroadcastChannel is active across tabs & devices
      this.reconnectAttempts = 0;
      this.setConnectionState('CONNECTED');
      return;
    }

    this.setConnectionState('CONNECTING');

    // 1. Channel for incoming operational events across all departments
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
          this.handleIncomingEvent(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0;
          this.setConnectionState('CONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          this.setConnectionState('DISCONNECTED');
          this.scheduleReconnect();
        } else if (status === 'CLOSED') {
          this.setConnectionState('DISCONNECTED');
          this.scheduleReconnect();
        } else if (status === 'TIMED_OUT') {
          this.setConnectionState('DISCONNECTED');
          this.scheduleReconnect();
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
   * Emits a state update to all local state listeners.
   */
  public emitStateUpdate(state: BusinessState): void {
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[RealtimeManager] Error in state listener:', err);
      }
    });
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
   * Disconnect manually from all channels.
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [, channel] of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.setConnectionState('DISCONNECTED');
  }

  /**
   * Force reconnect or trigger auto-reconnection.
   */
  public async reconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.disconnect();
    this.initializeChannels(this.currentOrgId);
  }

  /**
   * Cleanly unsubscribe from all channels and halt auto-reconnect timers.
   */
  public async teardown(): Promise<void> {
    this.isTornDown = true;
    await this.disconnect();
  }
}

export const realtimeSubscriptionManager = new RealtimeSubscriptionManager();
